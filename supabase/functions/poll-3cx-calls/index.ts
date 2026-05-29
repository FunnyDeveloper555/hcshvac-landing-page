// Polls 3CX XAPI (Enterprise) for new call history and inserts into call_logs_3cx.
// Auth: OAuth2 client_credentials against {SERVER}/connect/token
// Data: OData endpoint {SERVER}/xapi/v1/CallHistoryView (filter by StartTime gt lastSeen)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SERVER = (Deno.env.get("THREECX_SERVER_URL") || "").trim().replace(/\/+$/, "");
const CLIENT_ID = (Deno.env.get("THREECX_CLIENT_ID") || "").trim();
const CLIENT_SECRET = (Deno.env.get("THREECX_CLIENT_SECRET") || "").trim();

function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, "");
  if (!d) return null;
  return d.length > 10 ? d.slice(-10) : d;
}

function mapDirection(v: unknown): string {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("in")) return "inbound";
  if (s.includes("out")) return "outbound";
  if (s.includes("internal")) return "internal";
  return "unknown";
}

async function getToken(): Promise<string> {
  const res = await fetch(`${SERVER}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token request failed: ${res.status} ${t}`);
  }
  const j = await res.json();
  return j.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!SERVER || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("3CX env vars missing");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find watermark: latest started_at we already imported
    const { data: latest } = await supabase
      .from("call_logs_3cx")
      .select("started_at")
      .order("started_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const sinceIso = latest?.started_at
      ? new Date(latest.started_at).toISOString()
      : new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // default: last 24h on first run

    const token = await getToken();

    // OData call. 3CX v20 exposes /xapi/v1/CallHistoryView
    const url = new URL(`${SERVER}/xapi/v1/CallHistoryView`);
    url.searchParams.set("$filter", `SegmentStartTime gt ${sinceIso}`);
    url.searchParams.set("$orderby", "SegmentStartTime asc");
    url.searchParams.set("$top", "200");

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`CallHistoryView fetch failed: ${resp.status} ${t}`);
    }
    const body = await resp.json();
    const records: any[] = body.value || body.Value || [];

    let imported = 0;
    const errors: string[] = [];

    // Preload customers for matching (light cache)
    const { data: customers } = await supabase
      .from("customer_registrations")
      .select("id, phone_number")
      .limit(2000);
    const phoneMap = new Map<string, string>();
    (customers || []).forEach((c: any) => {
      const n = normalizePhone(c.phone_number);
      if (n) phoneMap.set(n, c.id);
    });

    for (const r of records) {
      try {
        const externalId =
          String(r.Id ?? r.SegmentId ?? r.CallId ?? "") || null;
        const fromNumber = String(r.SourceCallerId ?? r.CallerNumber ?? r.From ?? "") || null;
        const toNumber = String(r.DestinationCallerId ?? r.DialedNumber ?? r.To ?? "") || null;
        const callerName = String(r.SourceDisplayName ?? r.CallerName ?? "") || null;
        const direction = mapDirection(r.CallType ?? r.Direction);
        const status = String(r.Status ?? r.SegmentActionName ?? "") || null;
        const startedAt = r.SegmentStartTime ?? r.StartTime ?? null;
        const endedAt = r.SegmentEndTime ?? r.EndTime ?? null;
        const ringSeconds = r.RingingDur ?? null;
        const talkSeconds = r.TalkingDur ?? null;
        const duration =
          (Number(ringSeconds) || 0) + (Number(talkSeconds) || 0) || null;
        const agentExt = String(r.SrcExtensionNumber ?? r.DstExtensionNumber ?? "") || null;
        const agentName = String(r.SrcDisplayName ?? r.DstDisplayName ?? "") || null;
        const queueName = String(r.QueueName ?? "") || null;

        const matchPhone =
          direction === "outbound" ? normalizePhone(toNumber) : normalizePhone(fromNumber);
        const customerId = matchPhone ? phoneMap.get(matchPhone) ?? null : null;

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
          started_at: startedAt ? new Date(startedAt).toISOString() : null,
          ended_at: endedAt ? new Date(endedAt).toISOString() : null,
          duration_seconds: duration,
          ring_seconds: ringSeconds ? Number(ringSeconds) : null,
          talk_seconds: talkSeconds ? Number(talkSeconds) : null,
          raw_payload: r,
          customer_id: customerId,
          matched_phone: matchPhone,
        };

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

        await supabase.from("admin_logs").insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          user_email: "3cx-poller",
          action: direction === "outbound" ? "call_out" : "call_in",
          entity_type: "call",
          entity_id: insertedId,
          details: {
            from: fromNumber,
            to: toNumber,
            caller_name: callerName,
            agent: agentName || agentExt,
            status,
            duration,
            customer_id: customerId,
          },
        });

        imported++;
      } catch (e) {
        errors.push(String((e as Error).message ?? e));
      }
    }

    return new Response(
      JSON.stringify({ ok: true, since: sinceIso, fetched: records.length, imported, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("poll-3cx-calls error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
