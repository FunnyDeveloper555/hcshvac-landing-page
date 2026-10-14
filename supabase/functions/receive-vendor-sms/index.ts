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

async function postToChat(sb: any, convId: string, from: string, body: string, media: Array<{ url: string; type: string }>) {
  const { data: conv } = await sb.from("chat_conversations").select("name, external_name").eq("id", convId).maybeSingle();
  const who = conv?.external_name || conv?.name || from;
  await sb.from("chat_messages").insert({
    conversation_id: convId, sender_id: null, sender_name: who,
    body: body || (media.length ? "[photo]" : "[empty message]"),
    attachments: media.map((m) => ({ url: m.url, type: m.type, name: "photo" })),
    direction: "inbound", phone: from,
  });
  // Alert staff who have joined this conversation (throttled to one text per 10 minutes).
  const { data: members } = await sb.from("chat_members").select("user_id, last_alerted_at").eq("conversation_id", convId);
  for (const m of members || []) {
    if (m.last_alerted_at && Date.now() - new Date(m.last_alerted_at).getTime() < 10 * 60 * 1000) continue;
    const { data: p } = await sb.from("profiles").select("email").eq("user_id", m.user_id).maybeSingle();
    if (!p?.email) continue;
    const { data: emp } = await sb.from("employees").select("phone_number").ilike("email_address", p.email).limit(1).maybeSingle();
    const to = normalizePhone(emp?.phone_number);
    if (!to || to === from) continue;
    await sendSms(to, `New text from ${who}:\n"${body.slice(0, 160)}"\nReply: ${SITE}/admin/chat?c=${convId}`);
    await sb.from("chat_members").update({ last_alerted_at: new Date().toISOString() }).eq("conversation_id", convId).eq("user_id", m.user_id);
  }
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
    .select("item_type, item_id, author_name, vendor_id, created_at")
    .eq("direction", "outbound").eq("phone", from).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  // A chat-page conversation that texted this number more recently wins.
  const { data: chatOut } = await sb.from("chat_messages")
    .select("conversation_id, created_at")
    .eq("direction", "outbound").eq("phone", from).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  const chatWins = chatOut && (!lastOut || chatOut.created_at > lastOut.created_at);
  if (chatWins) {
    await postToChat(sb, chatOut.conversation_id, from, body, media);
    return twiml();
  }

  if (lastOut) {
    itemType = lastOut.item_type as any;
    const { data: t } = await sb.from(itemType === "task" ? "tasks" : "tickets")
      .select("*")
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
    // Unknown thread: start (or reuse) a customer/vendor chat for this number.
    let { data: conv } = await sb.from("chat_conversations").select("id").eq("kind", "external").eq("external_phone", from).maybeSingle();
    if (!conv) {
      const { data: who } = await sb.rpc("lookup_caller_by_phone", { _phone: from });
      const name = (who as any)?.customer?.name || [(who as any)?.employee?.first_name, (who as any)?.employee?.last_name].filter(Boolean).join(" ") || null;
      const { data: created } = await sb.from("chat_conversations").insert({
        kind: "external", external_phone: from, external_name: name, name: name || from,
        external_type: (who as any)?.match_type === "customer" ? "customer" : "other",
      }).select("id").single();
      conv = created;
    }
    if (conv) await postToChat(sb, conv.id, from, body, media);
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
    `New text from ${vendorName} on ${match.task_number || itemType}:`,
    `"${body.slice(0, 200)}"${media.length ? ` (+${media.length} photo)` : ""}`,
    `Reply: ${SITE}/admin/${itemType}s/add?id=${match.id}`,
  ].join("\n");
  for (const m of crew) {
    const p = normalizePhone(m?.phone);
    if (!p || seen.has(p) || p === from) continue;
    seen.add(p);
    await sendSms(p, alert);
  }

  return twiml();
});
