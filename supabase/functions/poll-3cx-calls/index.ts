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

async function tryVariant(token: string, label: string, params: Record<string, string>) {
  const url = new URL(`${SERVER}/xapi/v1/CallHistoryView`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch {}
  return {
    label,
    url: url.toString().replace(SERVER, ""),
    status: res.status,
    count: parsed?.["@odata.count"] ?? parsed?.value?.length ?? null,
    firstRecord: parsed?.value?.[0] || null,
    error: !res.ok ? text.slice(0, 200) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    if (!SERVER || !CLIENT_ID || !CLIENT_SECRET) throw new Error("3CX env vars missing");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const token = await getToken();

    if (debug) {
      // Try many CallHistoryView variants to figure out why it's empty
      const variants = await Promise.all([
        tryVariant(token, "CallHistoryView", { "$top": "5" }),
        tryVariant(token, "CallHistoryView-count", { "$count": "true", "$top": "0" }),
      ]);

      // Probe alternative endpoints — try entity sets + report functions with required params
      const fromIso = "2026-05-01T00:00:00Z";
      const toIso = "2026-05-30T00:00:00Z";
      const altEndpoints = [
        `/xapi/v1/CallLogData?$top=3`,
        `/xapi/v1/OutboundCall?$top=3`,
        `/xapi/v1/InboundCall?$top=3`,
        `/xapi/v1/CallDistribution?$top=3`,
        `/xapi/v1/ReportCallLogData(periodFrom=${fromIso},periodTo=${toIso},sourceType='Extension',sourceFilter=null,destinationType='Extension',destinationFilter=null,callsType=0,callTimeFilterType=0,callTimeFilterFrom='00%3A00%3A00',callTimeFilterTo='00%3A00%3A00',hidePcalls=true)?$top=3`,
        `/xapi/v1/ReportInboundCalls(periodFrom=${fromIso},periodTo=${toIso})?$top=3`,
        `/xapi/v1/ReportOutboundCalls(periodFrom=${fromIso},periodTo=${toIso})?$top=3`,
        `/xapi/v1/ReportCallDistribution(periodFrom=${fromIso},periodTo=${toIso})?$top=3`,
      ];
      const altResults = await Promise.all(
        altEndpoints.map(async (ep) => {
          const r = await fetch(`${SERVER}${ep}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          const t = await r.text();
          let parsed: any = null; try { parsed = JSON.parse(t); } catch {}
          return {
            endpoint: ep.split("?")[0].slice(0, 80),
            status: r.status,
            count: parsed?.value?.length ?? null,
            firstRecord: parsed?.value?.[0] || null,
            error: !r.ok ? t.slice(0, 250) : null,
          };
        })
      );


      // Read $metadata to discover what entity sets exist for this client
      const metaRes = await fetch(`${SERVER}/xapi/v1/$metadata`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/xml" },
      });
      const metaText = await metaRes.text();
      const entitySets = [...metaText.matchAll(/<EntitySet\s+Name="([^"]+)"/g)].map(m => m[1]);
      const callRelated = entitySets.filter(n => /call|cdr|history|report|chat/i.test(n));

      const lastCdrRes = await fetch(`${SERVER}/xapi/v1/LastCdrAndChatMessageTimestamp`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const lastCdr = await lastCdrRes.json();

      return new Response(JSON.stringify({
        ok: true, lastCdr, variants, altResults,
        callRelatedEntitySets: callRelated,
        totalEntitySets: entitySets.length,
        metadataStatus: metaRes.status,
      }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normal mode
    const fetchUrl = new URL(`${SERVER}/xapi/v1/CallHistoryView`);
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
