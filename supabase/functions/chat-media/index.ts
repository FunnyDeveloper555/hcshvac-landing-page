import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { downloadMedia, trustedTwilioMedia } from "./media.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
    const { data: auth, error: authError } = await sb.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Sign in required" }, 401);
    const { data: staff, error: staffError } = await sb.rpc("is_staff", { _uid: auth.user.id });
    if (staffError || !staff) return json({ error: "Staff only" }, 403);
    const input = await req.json().catch(() => ({}));
    if (typeof input.message_id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.message_id)) return json({ error: "Invalid message" }, 400);
    const { data: message, error } = await sb.from("chat_messages").select("id, conversation_id, attachments").eq("id", input.message_id).maybeSingle();
    if (error) throw error;
    if (!message) return json({ error: "Message not found" }, 404);
    const { data: allowed, error: accessError } = await sb.rpc("can_access_chat", { _conv: message.conversation_id, _uid: auth.user.id });
    if (accessError || !allowed) return json({ error: "No access to this chat" }, 403);
    const account = Deno.env.get("TWILIO_ACCOUNT_SID");
    const secret = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!account || !secret) return json({ error: "Photo retrieval is not configured" }, 503);
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    const saved = [...attachments];
    const resolved = [];
    let changed = false;
    for (const [index, attachment] of attachments.entries()) {
      const a = attachment && typeof attachment === "object" ? { ...attachment } : {};
      try {
        if (!a.path && typeof a.url === "string" && trustedTwilioMedia(a.url, account)) {
          const media = await downloadMedia(a.url, account, secret);
          const path = `${message.conversation_id}/inbound/${message.id}/${index}`;
          const { error: uploadError } = await sb.storage.from("chat-files").upload(path, media, { contentType: media.type, upsert: true });
          if (uploadError) throw uploadError;
          delete a.url;
          a.path = path;
          a.type = media.type || a.type;
          saved[index] = a;
          changed = true;
        }
        if (typeof a.path === "string") {
          if (!a.path.startsWith(`${message.conversation_id}/`)) throw new Error("Invalid attachment path");
          const { data: signed, error: signError } = await sb.storage.from("chat-files").createSignedUrl(a.path, 3600);
          if (signError || !signed) throw signError || new Error("Photo unavailable");
          resolved.push({ ...a, url: signed.signedUrl });
        } else {
          resolved.push({ ...a, error: "Photo unavailable" });
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Storage operation failed";
        // Only our fixed downloader messages may be logged; never provider responses.
        console.warn("chat-media attachment failed", index, /^(Invalid photo|Missing photo|Photo retrieval failed|Photo exceeds|Photo is empty|Too many photo)/.test(reason) ? reason : "Storage operation failed");
        // Do not expose provider URLs or credentials in an error response.
        resolved.push({ name: a.name, type: a.type, error: "Photo unavailable" });
      }
    }
    if (changed) {
      const { error: saveError } = await sb.from("chat_messages").update({ attachments: saved }).eq("id", message.id);
      if (saveError) throw saveError;
    }
    return json({ attachments: resolved });
  } catch {
    return json({ error: "Unable to load message photos" }, 500);
  }
});