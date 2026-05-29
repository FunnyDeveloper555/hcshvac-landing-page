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
  const startDt = "2026-05-01T00:00:00Z";
  const endDt = "2026-05-30T00:00:00Z";

  // ReportCallLogData is an OData function — must be called as Pbx.ReportCallLogData with params in URL
  const candidates = [
    `/xapi/v1/ReportCallLogData(periodFrom=${startDt},periodTo=${endDt},sourceType=0,sourceFilter='',destinationType=0,destinationFilter='',callsType=0,callTimeFilterType=0,callTimeFilterFrom='00:00:00',callTimeFilterTo='00:00:00',hidePcalls=true)?$top=3`,
    `/xapi/v1/Pbx.ReportCallLogData(periodFrom=${startDt},periodTo=${endDt},sourceType=0,sourceFilter='',destinationType=0,destinationFilter='',callsType=0,callTimeFilterType=0,callTimeFilterFrom='00:00:00',callTimeFilterTo='00:00:00',hidePcalls=true)?$top=3`,
    `/xapi/v1/CallHistoryView?$count=true&$top=5`,
  ];

  const out: any[] = [];
  for (const path of candidates) {
    const r = await fetch(`${SERVER}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const text = await r.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    out.push({
      path,
      status: r.status,
      count: parsed?.value?.length ?? null,
      odataCount: parsed?.["@odata.count"] ?? null,
      first: parsed?.value?.[0] || null,
      raw: parsed ? null : text.slice(0, 400),
    });
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
