// debug list entities
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
  const r = await fetch(`${SERVER}/xapi/v1/`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
  const j = await r.json();
  const names = (j.value || []).map((e: any) => e.name).filter((n: string) => /call|cdr|report|history|log/i.test(n));

  // probe each call-related endpoint with $top=2
  const results: any[] = [];
  for (const name of names) {
    const res = await fetch(`${SERVER}/xapi/v1/${name}?$top=2`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    let body: any = null;
    try { body = await res.json(); } catch {}
    results.push({
      name,
      status: res.status,
      count: body?.value?.length ?? null,
      firstKeys: body?.value?.[0] ? Object.keys(body.value[0]).slice(0, 15) : null,
      first: body?.value?.[0] || null,
    });
  }
  return new Response(JSON.stringify({ allNames: names, results }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
