import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
const SERVER = (Deno.env.get("THREECX_SERVER_URL") || "").trim().replace(/\/+$/, "");
const CLIENT_ID = (Deno.env.get("THREECX_CLIENT_ID") || "").trim();
const CLIENT_SECRET = (Deno.env.get("THREECX_CLIENT_SECRET") || "").trim();

async function getToken() {
  const res = await fetch(`${SERVER}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  return (await res.json()).access_token as string;
}

Deno.serve(async () => {
  const token = await getToken();
  const from = "2026-05-01T00:00:00Z";
  const to = "2026-05-30T00:00:00Z";

  const args = `periodFrom=${from},periodTo=${to},sourceType=0,sourceFilter='',destinationType=0,destinationFilter='',callsType=0,callTimeFilterType=0,callTimeFilterFrom='',callTimeFilterTo='',hidePcalls=true`;

  const paths = [
    `/xapi/v1/CallLogData/Pbx.GetCallLogData(${args})?$top=3`,
    `/xapi/v1/InboundCall/Pbx.GetInboundCalls(periodFrom=${from},periodTo=${to},trunkDns='',callsType=0)?$top=3`,
    `/xapi/v1/OutboundCall/Pbx.GetOutboundCalls(periodFrom=${from},periodTo=${to},trunkDns='',callsType=0)?$top=3`,
    `/xapi/v1/CallHistoryView/Pbx.DownloadCallHistory()?$top=3`,
  ];

  const out: any[] = [];
  for (const p of paths) {
    const r = await fetch(`${SERVER}${p}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const text = await r.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    out.push({
      path: p,
      status: r.status,
      count: parsed?.value?.length ?? null,
      first: parsed?.value?.[0] || null,
      raw: parsed ? null : text.slice(0, 400),
    });
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
