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

  // Pull the $metadata to find ReportCallLogData's exact function signature
  const meta = await fetch(`${SERVER}/xapi/v1/$metadata`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/xml" } });
  const metaText = await meta.text();
  // extract function definitions related to call log
  const fnMatch = metaText.match(/<Function Name="ReportCallLogData"[\s\S]*?<\/Function>/g);
  const fnMatch2 = metaText.match(/<Function Name="GetCallHistoryView"[\s\S]*?<\/Function>/g);
  // also list all <Function Name="...
  const allFns = [...metaText.matchAll(/<Function Name="([^"]+)"/g)].map(m => m[1]);
  const callFns = allFns.filter(n => /call|cdr|report|history|log/i.test(n));

  return new Response(JSON.stringify({
    callFns,
    ReportCallLogData: fnMatch,
    GetCallHistoryView: fnMatch2,
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
