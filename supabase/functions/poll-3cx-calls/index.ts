// Polls 3CX XAPI (Enterprise v20) for new call history and inserts into call_logs_3cx.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SERVER = (Deno.env.get("THREECX_SERVER_URL") || "").trim().replace(/\/+$/, "");
const CLIENT_ID = (Deno.env.get("THREECX_CLIENT_ID") || "").trim();
const CLIENT_SECRET = (Deno.env.get("THREECX_CLIENT_SECRET") || "").trim();

const BATCH_SIZE = 200;

function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const d = p.replace(/\D/g, "");
  if (!d) return null;
  return d.length > 10 ? d.slice(-10) : d;
}

function isoDurationToSeconds(d?: string | null): number | null {
  if (!d) return null;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(d);
  if (!m) return null;
  const [, days, h, mm, s] = m;
  return (
    (Number(days || 0) * 86400) +
    (Number(h || 0) * 3600) +
    (Number(mm || 0) * 60) +
    Math.round(Number(s || 0))
  );
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
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token as string;
}

async function tryEndpoint(token: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`${SERVER}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch {}
  return { path, status: res.status, sample: parsed ? (parsed.value ? `value[${parsed.value.length}]` : Object.keys(parsed).slice(0,8)) : text.slice(0, 200), firstRecord: parsed?.value?.[0] || null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    if (!SERVER || !CLIENT_ID || !CLIENT_SECRET) throw new Error("3CX env vars missing");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const token = await getToken();

    // DEBUG MODE: try multiple endpoints to find call data
    if (debug) {
      const probes = await Promise.all([
        tryEndpoint(token, "/xapi/v1/CallHistoryView", { "$top": "3", "$orderby": "SegmentStartTime desc" }),
        tryEndpoint(token, "/xapi/v1/CallHistoryView", { "$top": "3" }),
        tryEndpoint(token, "/xapi/v1/ReportCallLogData", { "$top": "3" }),
        tryEndpoint(token, "/xapi/v1/CallLogData", { "$top": "3" }),
        tryEndpoint(token, "/xapi/v1/Pbx.GetCallHistoryView", {}),
        tryEndpoint(token, "/xapi/v1/$metadata", {}),
        tryEndpoint(token, "/xapi/v1/", {}),
      ]);
      return new Response(JSON.stringify({ ok: true, probes }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normal mode: fetch most recent N rows (server-side $filter on SegmentStartTime is broken)
    const fetchUrl = new URL(`${SERVER}/xapi/v1/CallHistoryView`);
    fetchUrl.searchParams.set("$orderby", "SegmentStartTime desc");
    fetchUrl.searchParams.set("$top", String(BATCH_SIZE));

    const resp = await fetch(fetchUrl.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!resp.ok) throw new Error(`CallHistoryView fetch failed: ${resp.status} ${await resp.text()}`);
    const body = await resp.json();
    const records: any[] = body.value || [];

    const externalIds = records.map((r) => String(r.SegmentId)).filter(Boolean);
    const existing = new Set<string>();
    if (externalIds.length) {
      const { data: existRows } = await supabase
        .from("call_logs_3cx").select("external_call_id").in("external_call_id", externalIds);
      (existRows || []).forEach((r: any) => existing.add(r.external_call_id));
    }

    const { data: customers } = await supabase
      .from("customer_registrations").select("id, phone_number").limit(5000);
    const phoneMap = new Map<string, string>();
    (customers || []).forEach((c: any) => {
      const n = normalizePhone(c.phone_number);
      if (n) phoneMap.set(n, c.id);
    });

    let imported = 0;
    const errors: string[] = [];

    for (const r of records) {
      const externalId = String(r.SegmentId);
      if (existing.has(externalId)) continue;
      try {
        const srcExternal = !!r.SrcExternal;
        const dstExternal = !!r.DstExternal;
        const direction = srcExternal && !dstExternal ? "inbound" : !srcExternal && dstExternal ? "outbound" : "internal";
        const fromNumber = r.SrcCallerNumber || r.SrcDn || null;
        const toNumber = r.DstCallerNumber || r.DstDn || null;
        const callerName = r.SrcDisplayName || r.SrcExtendedDisplayName || null;
        const agentExt = direction === "outbound" ? (r.SrcDn || null) : (r.DstDn || null);
        const agentName = direction === "outbound" ? (r.SrcDisplayName || null) : (r.DstDisplayName || null);
        const matchPhone = direction === "outbound" ? normalizePhone(toNumber) : normalizePhone(fromNumber);
        const customerId = matchPhone ? phoneMap.get(matchPhone) ?? null : null;

        const row = {
          external_call_id: externalId, direction, from_number: fromNumber, to_number: toNumber,
          caller_name: callerName, agent_extension: agentExt, agent_name: agentName, queue_name: null,
          status: r.CallAnswered === false ? "unanswered" : r.CallAnswered === true ? "answered" : null,
          started_at: r.SegmentStartTime ? new Date(r.SegmentStartTime).toISOString() : null,
          ended_at: r.SegmentEndTime ? new Date(r.SegmentEndTime).toISOString() : null,
          duration_seconds: isoDurationToSeconds(r.CallTime), ring_seconds: null, talk_seconds: null,
          raw_payload: r, customer_id: customerId, matched_phone: matchPhone,
        };

        const { data, error } = await supabase
          .from("call_logs_3cx").upsert(row, { onConflict: "external_call_id" }).select("id").single();
        if (error) throw error;

        await supabase.from("admin_logs").insert({
          user_id: "00000000-0000-0000-0000-000000000000", user_email: "3cx-poller",
          action: direction === "outbound" ? "call_out" : "call_in", entity_type: "call",
          entity_id: data?.id ?? null,
          details: { from: fromNumber, to: toNumber, caller_name: callerName, agent: agentName || agentExt, status: row.status, duration: row.duration_seconds, customer_id: customerId },
        });
        imported++;
      } catch (e) {
        errors.push(`${externalId}: ${(e as Error).message ?? e}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, fetched: records.length, already_imported: records.length - imported - errors.length, imported, errors }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("poll-3cx-calls error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
