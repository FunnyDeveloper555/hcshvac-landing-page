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

  const meta = await fetch(`${SERVER}/xapi/v1/$metadata`, { headers: { Authorization: `Bearer ${token}` } });
  const metaText = await meta.text();
  const fn = metaText.match(/<Function Name="GetCallLogData"[\s\S]*?<\/Function>/);
  const ib = metaText.match(/<Function Name="GetInboundCalls"[\s\S]*?<\/Function>/);
  const ob = metaText.match(/<Function Name="GetOutboundCalls"[\s\S]*?<\/Function>/);
  const dch = metaText.match(/<Function Name="DownloadCallHistory"[\s\S]*?<\/Function>/);

  return new Response(JSON.stringify({
    GetCallLogData: fn?.[0],
    GetInboundCalls: ib?.[0],
    GetOutboundCalls: ob?.[0],
    DownloadCallHistory: dch?.[0],
  }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
