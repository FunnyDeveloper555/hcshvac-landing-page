import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SECRET = Deno.env.get("CALL_3CX_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  if (!digits) return null;
  // Return last 10 digits for matching (US-focused)
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function pick<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k] as T;
  }
  return undefined;
}

function mapDirection(v: unknown): string {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("in")) return "inbound";
  if (s.includes("out")) return "outbound";
  if (s.includes("internal")) return "internal";
  return "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { ...corsHeaders, "Access-Control-Allow-Headers": "content-type, x-webhook-secret, authorization" },
    });
  }

  try {
    // Auth: header OR ?secret= query param (3CX templates vary)
    const headerSecret = req.headers.get("x-webhook-secret") || req.headers.get("X-Webhook-Secret");
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    const provided = headerSecret || querySecret;

    if (!SECRET || provided !== SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: Record<string, unknown> = {};
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const form = await req.formData();
      form.forEach((v, k) => (payload[k] = typeof v === "string" ? v : v.name));
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const fromNumber = String(pick(payload, ["from", "caller", "callerNumber", "from_number", "CallerNumber", "Caller"]) ?? "") || null;
    const toNumber = String(pick(payload, ["to", "callee", "dialed", "to_number", "CalledNumber", "Destination"]) ?? "") || null;
    const callerName = String(pick(payload, ["caller_name", "callerName", "CallerName", "name"]) ?? "") || null;
    const externalId = String(pick(payload, ["call_id", "callId", "id", "CallID", "uniqueId"]) ?? "") || null;
    const direction = mapDirection(pick(payload, ["direction", "Direction", "type"]));
    const agentExt = String(pick(payload, ["agent_extension", "extension", "Extension", "agent"]) ?? "") || null;
    const agentName = String(pick(payload, ["agent_name", "agentName", "AgentName"]) ?? "") || null;
    const queueName = String(pick(payload, ["queue", "queue_name", "QueueName"]) ?? "") || null;
    const status = String(pick(payload, ["status", "Status", "result", "Result"]) ?? "") || null;
    const startedAtRaw = pick<string>(payload, ["started_at", "start_time", "StartTime", "startTime"]);
    const endedAtRaw = pick<string>(payload, ["ended_at", "end_time", "EndTime", "endTime"]);
    const durationRaw = pick<number | string>(payload, ["duration", "Duration", "duration_seconds"]);
    const ringRaw = pick<number | string>(payload, ["ring_seconds", "ringTime", "RingTime"]);
    const talkRaw = pick<number | string>(payload, ["talk_seconds", "talkTime", "TalkTime"]);
    const recordingUrl = String(pick(payload, ["recording_url", "recordingUrl", "RecordingUrl"]) ?? "") || null;
    const cost = pick<number | string>(payload, ["cost", "Cost"]);

    const toInt = (v: unknown): number | null => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n) : null;
    };
    const toTs = (v: unknown): string | null => {
      if (!v) return null;
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    // Match customer by phone (last 10 digits)
    const normalizedFrom = normalizePhone(fromNumber);
    const normalizedTo = normalizePhone(toNumber);
    const matchPhone = direction === "outbound" ? normalizedTo : normalizedFrom;

    let customerId: string | null = null;
    let matchedPhone: string | null = null;
    if (matchPhone) {
      const { data: matches } = await supabase
        .from("customer_registrations")
        .select("id, phone_number")
        .limit(50);
      if (matches) {
        const found = matches.find((c: { phone_number: string | null }) =>
          normalizePhone(c.phone_number) === matchPhone
        );
        if (found) {
          customerId = found.id;
          matchedPhone = matchPhone;
        }
      }
    }

    const row = {
      external_call_id: externalId,
      direction,
      from_number: fromNumber,
      to_number: toNumber,
      caller_name: callerName,
      agent_extension: agentExt,
      agent_name: agentName,
      queue_name: queueName,
      status,
      started_at: toTs(startedAtRaw),
      ended_at: toTs(endedAtRaw),
      duration_seconds: toInt(durationRaw),
      ring_seconds: toInt(ringRaw),
      talk_seconds: toInt(talkRaw),
      recording_url: recordingUrl,
      cost: cost !== undefined ? Number(cost) : null,
      raw_payload: payload,
      customer_id: customerId,
      matched_phone: matchedPhone,
    };

    // Upsert by external_call_id if present, else insert
    let insertedId: string | null = null;
    if (externalId) {
      const { data, error } = await supabase
        .from("call_logs_3cx")
        .upsert(row, { onConflict: "external_call_id" })
        .select("id")
        .single();
      if (error) throw error;
      insertedId = data?.id ?? null;
    } else {
      const { data, error } = await supabase
        .from("call_logs_3cx")
        .insert(row)
        .select("id")
        .single();
      if (error) throw error;
      insertedId = data?.id ?? null;
    }

    // Mirror to admin_logs for Activity Logs view
    await supabase.from("admin_logs").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      user_email: "3cx-webhook",
      action: direction === "outbound" ? "call_out" : "call_in",
      entity_type: "call",
      entity_id: insertedId,
      details: {
        from: fromNumber,
        to: toNumber,
        caller_name: callerName,
        agent: agentName || agentExt,
        status,
        duration: toInt(durationRaw),
        customer_id: customerId,
      },
    });

    return new Response(JSON.stringify({ ok: true, id: insertedId, matched_customer: customerId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("webhook-3cx-call error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
