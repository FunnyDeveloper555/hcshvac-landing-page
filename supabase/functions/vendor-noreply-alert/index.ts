import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { formatPagerSms, isPagerRecipient } from "../_shared/pager-sms.ts";

// Called by workitem-notify ~2 minutes after a sourcing text: vendors texted a sourcing request with no reply after
// 120 seconds trigger one alert to the task's assigned team (or chat notification targets).

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
const SITE = "https://hcshvac.com";
const WAIT_MS = 120 * 1000;

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 10) d = "1" + d;
  return d.length < 11 ? null : "+" + d;
}

async function sendSms(to: string, body: string) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: FROM!, Body: body }).toString(),
  });
  if (!res.ok) console.error(`vendor no-reply SMS to ${to} failed [${res.status}]: ${await res.text()}`);
}

const ok = (b: unknown) => new Response(JSON.stringify(b), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.headers.get("Authorization") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!SID || !TOKEN || !FROM) return ok({ alerted: 0, reason: "sms not configured" });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const since = new Date(Date.now() - 86400000).toISOString();
  const cutoff = Date.now() - WAIT_MS + 5000;
  const { task_id } = await req.json().catch(() => ({}));
  let q = sb.from("tasks").select("id, task_number, assigned_team, sourcing, status")
    .in("status", ["open", "in_progress"]).gte("updated_at", since).limit(300);
  if (task_id) q = q.eq("id", task_id);
  const { data: tasks } = await q;

  let targets: any[] | null = null;
  let alerted = 0;
  for (const t of tasks || []) {
    const s: any = t.sourcing && typeof t.sourcing === "object" ? t.sourcing : null;
    if (!s || s.closed_at || !Array.isArray(s.vendors)) continue;
    const due = s.vendors.filter((v: any) => v?.awaiting_since && !v.replied_at && !v.no_reply_alerted_at
      && new Date(v.awaiting_since).getTime() <= cutoff);
    if (!due.length) continue;

    const phones = new Set<string>();
    for (const m of Array.isArray(t.assigned_team) ? t.assigned_team : []) {
      const p = normalizePhone(m?.phone);
      if (p) phones.add(p);
    }
    let pagerList: any[] = [];
    if (!phones.size) {
      if (!targets) {
        const { data } = await sb.from("notification_targets").select("phone, email").eq("active", true).eq("notify_chat", true);
        targets = data || [];
      }
      pagerList = targets;
      for (const x of targets) { const p = normalizePhone(x.phone); if (p) phones.add(p); }
    }
    const names = due.map((v: any) => v.name).join(", ");
    const text = `No vendor reply in 2 min on ${t.task_number || "task"} (session ${s.session_id || t.task_number}): ${names}. ${SITE}/admin/tasks/add?id=${t.id}`;
    for (const p of phones) await sendSms(p, isPagerRecipient(p, pagerList) ? formatPagerSms(text) : text);

    const now = new Date().toISOString();
    for (const v of due) v.no_reply_alerted_at = now;
    await sb.from("tasks").update({ sourcing: s }).eq("id", t.id);
    await sb.from("work_item_replies").insert({
      item_type: "task", item_id: t.id, author_name: "System",
      message: `No reply within 2 minutes from: ${names}. Assigned staff were alerted.`,
    });
    alerted++;
  }
  return ok({ alerted });
});
