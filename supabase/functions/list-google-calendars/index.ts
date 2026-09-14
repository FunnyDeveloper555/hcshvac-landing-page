import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gcalKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!lovableKey || !gcalKey) return json({ error: "Google Calendar is not connected" }, 500);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(jwt);
    if (!userData?.user) return json({ error: "Not authorized" }, 401);

    const res = await fetch(`${GATEWAY}/users/me/calendarList?maxResults=250`, {
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": gcalKey },
    });
    if (!res.ok) {
      const details = await res.text();
      console.error(`calendarList failed [${res.status}]: ${details}`);
      return json({ error: "Could not load Google calendars", status: res.status, details }, res.status);
    }
    const data = await res.json();
    return json({
      calendars: (data.items || []).map((c: any) => ({
        id: c.id,
        summary: c.summary,
        primary: !!c.primary,
        accessRole: c.accessRole,
      })),
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
