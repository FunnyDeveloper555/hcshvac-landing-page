import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Sends a chat message. Internal chats save the message; customer/vendor chats also
// text it out through Twilio. Staff who are away get a text alert (throttled).

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");
const SITE = "https://hcshvac.com";
const AWAY_MS = 2 * 60 * 1000;
const ALERT_GAP_MS = 10 * 60 * 1000;

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.length === 10) d = "1" + d;
  if (d.length < 11) return null;
  return "+" + d;
}

async function sendSms(to: string, body: string, media: string[] = []) {
  if (!SID || !TOKEN || !FROM) throw new Error("Text messaging is not configured");
  const p = new URLSearchParams({ To: to, From: FROM, Body: body });
  media.slice(0, 10).forEach((m) => p.append("MediaUrl", m));
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: p.toString(),
  });
  if (!res.ok) throw new Error(`Text failed: ${(await res.json().catch(() => ({})))?.message || res.status}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await sb.auth.getUser(token);
    const user = u?.user;
    if (!user) return json({ error: "Sign in required" }, 401);
    const { data: staff } = await sb.rpc("is_staff", { _uid: user.id });
    if (!staff) return json({ error: "Staff only" }, 403);

    const input = await req.json().catch(() => ({}));
    const convId = typeof input.conversation_id === "string" ? input.conversation_id : "";
    const body = typeof input.body === "string" ? input.body.trim().slice(0, 4000) : "";
    const attachments = Array.isArray(input.attachments)
      ? input.attachments.slice(0, 10).filter((a: any) => typeof a?.path === "string").map((a: any) => ({
          path: String(a.path), name: String(a.name || "file").slice(0, 200), type: String(a.type || "").slice(0, 100),
        }))
      : [];
    if (!convId || (!body && attachments.length === 0)) return json({ error: "Message is empty" }, 400);

    const { data: allowed } = await sb.rpc("can_access_chat", { _conv: convId, _uid: user.id });
    if (!allowed) return json({ error: "No access to this chat" }, 403);
    const { data: conv } = await sb.from("chat_conversations").select("*").eq("id", convId).single();

    const { data: prof } = await sb.from("profiles").select("display_name, email").eq("user_id", user.id).maybeSingle();
    const senderName = prof?.display_name || prof?.email || user.email || "Staff";

    let direction = "internal";
    let phone: string | null = null;
    if (conv.kind === "external") {
      phone = normalizePhone(conv.external_phone);
      if (!phone) return json({ error: "This contact has no textable number" }, 400);
      const { data: blocked } = await sb.rpc("is_phone_blocked", { _phone: phone });
      if (blocked) return json({ error: "This number is blocked" }, 400);
      const media: string[] = [];
      for (const a of attachments) {
        const { data: s } = await sb.storage.from("chat-files").createSignedUrl(a.path, 7 * 86400);
        if (s?.signedUrl) media.push(s.signedUrl);
      }
      await sendSms(phone, body || "(photo)", media);
      direction = "outbound";
    }

    const { data: msg, error } = await sb.from("chat_messages").insert({
      conversation_id: convId, sender_id: user.id, sender_name: senderName, body, attachments, direction, phone,
    }).select().single();
    if (error) throw error;

    await sb.from("chat_members").upsert(
      { conversation_id: convId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" },
    );

    // Text alerts for away staff — direct chats only (channels would be too noisy).
    if (conv.kind === "direct") {
      const { data: members } = await sb.from("chat_members").select("*").eq("conversation_id", convId).neq("user_id", user.id);
      const now = Date.now();
      for (const m of members || []) {
        const away = now - new Date(m.last_read_at).getTime() > AWAY_MS;
        const recent = m.last_alerted_at && now - new Date(m.last_alerted_at).getTime() < ALERT_GAP_MS;
        if (!away || recent) continue;
        const { data: p } = await sb.from("profiles").select("email").eq("user_id", m.user_id).maybeSingle();
        if (!p?.email) continue;
        const { data: emp } = await sb.from("employees").select("phone_number").ilike("email_address", p.email).limit(1).maybeSingle();
        const to = normalizePhone(emp?.phone_number);
        if (!to) continue;
        try {
          await sendSms(to, `New chat message from ${senderName}:\n"${(body || "(file)").slice(0, 160)}"\n${SITE}/admin/chat?c=${convId}`);
          await sb.from("chat_members").update({ last_alerted_at: new Date().toISOString() })
            .eq("conversation_id", convId).eq("user_id", m.user_id);
        } catch (e) { console.error("chat alert failed", e); }
      }
    }

    return json({ message: msg });
  } catch (e) {
    console.error("chat-send error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
