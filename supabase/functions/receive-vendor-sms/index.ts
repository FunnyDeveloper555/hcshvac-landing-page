import { createClient } from "npm:@supabase/supabase-js@2";

// Twilio inbound SMS webhook. Matches the sender to a vendor on a recent sourcing task,
// posts the text to that task's Notes Log and texts the assigned staff an alert.

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
const SITE = "https://hcshvac.com";

const twiml = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 10) d = "1" + d;
  if (d.length < 11) return null;
  return "+" + d;
}

async function signatureFor(url: string, params: URLSearchParams) {
  const keys = [...new Set([...params.keys()])].sort();
  let data = url;
  for (const k of keys) for (const v of params.getAll(k)) data += k + v;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(TOKEN!), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function sendSms(to: string, body: string) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: FROM!, Body: body }).toString(),
  });
  if (!res.ok) console.error(`alert SMS failed [${res.status}]: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (!SID || !TOKEN || !FROM) return new Response("Text messaging is not configured", { status: 500 });

  const raw = await req.text();
  const params = new URLSearchParams(raw);

  // Verify the request really came from Twilio.
  const given = req.headers.get("X-Twilio-Signature") || "";
  const reqUrl = new URL(req.url);
  const candidates = [
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/receive-vendor-sms${reqUrl.search}`,
    req.url,
  ];
  let valid = false;
  for (const u of candidates) if ((await signatureFor(u, params)) === given) valid = true;
  if (!valid) {
    console.error("Rejected inbound SMS: bad Twilio signature");
    return new Response("Forbidden", { status: 403 });
  }

  const from = normalizePhone(params.get("From"));
  const body = (params.get("Body") || "").trim().slice(0, 4000);
  const numMedia = parseInt(params.get("NumMedia") || "0", 10) || 0;
  const media: Array<{ url: string; type: string }> = [];
  for (let i = 0; i < Math.min(numMedia, 10); i++) {
    const url = params.get(`MediaUrl${i}`);
    if (url) media.push({ url, type: params.get(`MediaContentType${i}`) || "" });
  }
  if (!from) return twiml();

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  let match: any = null;
  let vendor: any = null;
  let itemType: "task" | "ticket" = "task";
  let senderName: string | null = null;

  // 1) The ticket/task that most recently texted this number (customer or vendor).
  const { data: lastOut } = await sb.from("work_item_replies")
    .select("item_type, item_id, author_name, vendor_id")
    .eq("direction", "outbound").eq("phone", from).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (lastOut) {
    itemType = lastOut.item_type as any;
    const { data: t } = await sb.from(itemType === "task" ? "tasks" : "tickets")
      .select(`id, ${itemType === "task" ? "task_number" : "ticket_number"}, status, assigned_team, customer_name, vendor_name, sourcing:${itemType === "task" ? "sourcing" : "id"}`)
      .eq("id", lastOut.item_id).maybeSingle();
    if (t) {
      match = { ...t, task_number: (t as any).task_number || (t as any).ticket_number };
      const arrow = String(lastOut.author_name || "").split("→")[1];
      senderName = arrow ? arrow.replace(/\(text\)/, "").trim() : null;
      if (lastOut.vendor_id) vendor = { vendor_id: lastOut.vendor_id, name: senderName };
    }
  }

  // 2) Fall back to vendors on recent sourcing tasks.
  if (!match) {
    const { data: tasks } = await sb.from("tasks")
      .select("id, task_number, title, status, assigned_team, sourcing, updated_at")
      .neq("status", "cancelled").gte("updated_at", since)
      .order("updated_at", { ascending: false }).limit(300);
    for (const t of tasks || []) {
      const vendors: any[] = Array.isArray((t as any).sourcing?.vendors) ? (t as any).sourcing.vendors : [];
      const v = vendors.find((x) => [x?.alt_sms, x?.sms, x?.phone].some((p) => normalizePhone(p) === from));
      if (v) { match = t; vendor = v; itemType = "task"; break; }
    }
  }

  if (!match) {
    console.log(`Inbound SMS from ${from} did not match any ticket or task`);
    return twiml();
  }

  const vendorName = vendor?.name || senderName || from;
  await sb.from("work_item_replies").insert({
    item_type: itemType,
    item_id: match.id,
    author_name: `${vendorName} (text)`,
    message: body || (media.length ? "[photo]" : "[empty message]"),
    direction: "inbound",
    channel: "sms",
    phone: from,
    vendor_id: vendor?.vendor_id || null,
    media,
  });
  await sb.from(itemType === "task" ? "tasks" : "tickets").update({ updated_at: new Date().toISOString() }).eq("id", match.id);

  // Alert the assigned staff.
  const crew: any[] = Array.isArray(match.assigned_team) ? match.assigned_team : [];
  const seen = new Set<string>();
  const alert = [
    `New text from ${vendorName} on ${match.task_number || "task"}:`,
    `"${body.slice(0, 200)}"${media.length ? ` (+${media.length} photo)` : ""}`,
    `Reply: ${SITE}/admin/tasks/add?id=${match.id}`,
  ].join("\n");
  for (const m of crew) {
    const p = normalizePhone(m?.phone);
    if (!p || seen.has(p) || p === from) continue;
    seen.add(p);
    await sendSms(p, alert);
  }

  return twiml();
});
