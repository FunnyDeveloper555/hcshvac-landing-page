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

  const tries = [
    { method: "POST", path: `/xapi/v1/CallLogData/Pbx.GetCallLogData(periodFrom=${from},periodTo=${to},sourceType=0,sourceFilter='',destinationType=0,destinationFilter='',callsType=0,callTimeFilterType=0,callTimeFilterFrom='',callTimeFilterTo='',hidePcalls=true)?$top=3` },
    { method: "GET", path: `/xapi/v1/CallLogData/Pbx.GetCallLogData(periodFrom=${from},periodTo=${to},sourceType=0,sourceFilter=null,destinationType=0,destinationFilter=null,callsType=0,callTimeFilterType=0,callTimeFilterFrom=null,callTimeFilterTo=null,hidePcalls=true)?$top=3` },
    { method: "GET", path: `/xapi/v1/CallHistoryView/Pbx.DownloadCallHistory()` },
  ];

  const out: any[] = [];
  for (const t of tries) {
    const r = await fetch(`${SERVER}${t.path}`, { method: t.method, headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Length": "0" } });
    const text = await r.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}
    out.push({
      method: t.method, path: t.path, status: r.status,
      count: parsed?.value?.length ?? null,
      first: parsed?.value?.[0] || null,
      raw: parsed ? null : text.slice(0, 500),
    });
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
