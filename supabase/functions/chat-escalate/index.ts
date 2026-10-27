import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { formatPagerSms, isPagerRecipient } from "../_shared/pager-sms.ts";

// Scheduled: inbound chat texts with no staff reply after 10 minutes get one
// SMS + email alert to every active notification_targets row with notify_chat.

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
const SITE = "https://hcshvac.com";
const WAIT_MS = 10 * 60 * 1000;

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
  if (!res.ok) console.error(`escalation SMS to ${to} failed [${res.status}]: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);
  const cutoff = new Date(Date.now() - WAIT_MS).toISOString();

  const { data: pending } = await sb.from("chat_messages")
    .select("id, conversation_id, sender_name, body, phone, created_at")
    .eq("direction", "inbound").is("escalation_sent_at", null).lte("created_at", cutoff)
    .order("created_at", { ascending: true }).limit(50);
  if (!pending?.length) return new Response(JSON.stringify({ alerted: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: targets } = await sb.from("notification_targets").select("phone, email")
    .eq("active", true).eq("notify_chat", true);

  // One alert per conversation: the oldest unanswered message.
  const done = new Set<string>();
  let alerted = 0;
  for (const m of pending) {
    if (done.has(m.conversation_id)) {
      await sb.from("chat_messages").update({ escalation_sent_at: new Date().toISOString() }).eq("id", m.id);
      continue;
    }
    done.add(m.conversation_id);
    const { count } = await sb.from("chat_messages").select("id", { count: "exact", head: true })
      .eq("conversation_id", m.conversation_id).neq("direction", "inbound").gt("created_at", m.created_at);
    const { data: later } = await sb.from("chat_messages").select("id")
      .eq("conversation_id", m.conversation_id).eq("direction", "inbound").is("escalation_sent_at", null).lte("created_at", cutoff);
    const ids = (later || []).map((r: any) => r.id);
    await sb.from("chat_messages").update({ escalation_sent_at: new Date().toISOString() }).in("id", ids.length ? ids : [m.id]);
    if ((count || 0) > 0) continue; // staff already replied

    const who = m.sender_name || m.phone || "Customer";
    const chatUrl = `${SITE}/admin/chat?c=${m.conversation_id}`;
    const text = `No reply in 10 min - text from ${who}${m.phone ? ` ${m.phone}` : ""}: "${(m.body || "").slice(0, 120)}" ${chatUrl}`;
    const receivedAt = new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" });

    const phones = new Set<string>();
    for (const t of targets || []) {
      const p = normalizePhone(t.phone);
      if (p && !phones.has(p) && SID && TOKEN && FROM) {
        phones.add(p);
        await sendSms(p, isPagerRecipient(p, targets || []) ? formatPagerSms(text) : text);
      }
      const e = (t.email || "").trim();
      if (e) {
        await fetch(`${url}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: e, templateName: "chat-unreplied-alert",
            idempotencyKey: `chat-unreplied-${m.id}-${e}`,
            templateData: { senderName: who, phone: m.phone || "", message: m.body || "", receivedAt, chatUrl },
          }),
        }).catch((err) => console.error("escalation email failed", err));
      }
    }
    alerted++;
  }
  return new Response(JSON.stringify({ alerted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
