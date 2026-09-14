import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

// Handles "9:30 AM", "9 AM", "12 Noon", "12 Midnight"
function parseClock(t: string): { h: number; m: number } | null {
  const s = (t || "").trim();
  if (/noon/i.test(s)) return { h: 12, m: 0 };
  if (/midnight/i.test(s)) return { h: 0, m: 0 };
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]?\.?/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const suf = m[3]?.toUpperCase();
  if (suf === "P" && h < 12) h += 12;
  if (suf === "A" && h === 12) h = 0;
  return { h, m: min };
}

// Splits "1 PM to 3 PM" into start/end; single times return only a start
function parseRange(t: string): { start: { h: number; m: number }; end: { h: number; m: number } | null } {
  const parts = (t || "").split(/\s+(?:to|-|–|—|through|until)\s+/i);
  return {
    start: parseClock(parts[0] || "") || { h: 9, m: 0 },
    end: parts[1] ? parseClock(parts[1]) : null,
  };
}

function parseTime(t: string): { h: number; m: number } {
  return parseRange(t).start;
}

function iso(date: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = date.split("-").map((v) => parseInt(v, 10));
  const { h, m } = parseTime(time);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, m + addMinutes, 0));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:00`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gcalKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!lovableKey || !gcalKey) return json({ error: "Google Calendar is not connected" }, 500);

    const { appointment_id, action } = await req.json();
    if (!appointment_id || typeof appointment_id !== "string") {
      return json({ error: "appointment_id is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: apt, error } = await supabase
      .from("appointments")
      .select("*, companies(name), calendars(calendar_name, google_calendar_id, email)")
      .eq("id", appointment_id)
      .maybeSingle();
    if (error) throw error;
    if (!apt) return json({ error: "Appointment not found" }, 404);

    const calRow: any = (apt as any).calendars;
    const calendarId = calRow?.google_calendar_id || (apt as any).google_calendar_id || "primary";
    const eventId = (apt as any).google_event_id as string | null;
    const timeZone = "America/Chicago";

    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gcalKey,
      "Content-Type": "application/json",
    };

    if (action === "delete" || apt.status === "cancelled") {
      if (eventId) {
        const res = await fetch(
          `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
          { method: "DELETE", headers },
        );
        if (!res.ok && res.status !== 404 && res.status !== 410) {
          const body = await res.text();
          console.error(`Calendar delete failed [${res.status}]: ${body}`);
          return json({ error: "Calendar delete failed", status: res.status, details: body }, res.status);
        }
      }
      await supabase.from("appointments").update({ google_event_id: null }).eq("id", appointment_id);
      return json({ success: true, deleted: true });
    }

    const duration = Number((apt as any).duration_minutes) || 60;
    const attendees: Array<{ email: string }> = [];
    if (apt.customer_email) attendees.push({ email: apt.customer_email });
    if (calRow?.email) attendees.push({ email: calRow.email });

    const body = {
      summary: `${apt.visit_type ? apt.visit_type + " — " : ""}${apt.customer_name}${
        (apt as any).appointment_number ? ` (${(apt as any).appointment_number})` : ""
      }`,
      description: [
        (apt as any).appointment_number ? `Appointment: ${(apt as any).appointment_number}` : "",
        `Customer: ${apt.customer_name}`,
        apt.customer_phone ? `Phone: ${apt.customer_phone}` : "",
        (apt as any).companies?.name ? `Company: ${(apt as any).companies.name}` : "",
        apt.notes ? `Notes: ${apt.notes}` : "",
      ].filter(Boolean).join("\n"),
      location: apt.customer_address || undefined,
      start: { dateTime: iso(apt.scheduled_date, apt.scheduled_time), timeZone },
      end: { dateTime: iso(apt.scheduled_date, apt.scheduled_time, duration), timeZone },
      attendees: attendees.length ? attendees : undefined,
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
    };

    const url = eventId
      ? `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`
      : `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`;

    let res = await fetch(url, { method: eventId ? "PATCH" : "POST", headers, body: JSON.stringify(body) });

    // A stale/removed event id: recreate instead of failing
    if (eventId && (res.status === 404 || res.status === 410)) {
      res = await fetch(
        `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
        { method: "POST", headers, body: JSON.stringify(body) },
      );
    }

    if (!res.ok) {
      const details = await res.text();
      console.error(`Calendar sync failed [${res.status}]: ${details}`);
      return json({ error: "Calendar sync failed", status: res.status, details }, res.status);
    }

    const event = await res.json();
    await supabase
      .from("appointments")
      .update({ google_event_id: event.id, google_calendar_id: calendarId })
      .eq("id", appointment_id);

    return json({ success: true, event_id: event.id, html_link: event.htmlLink, calendar_id: calendarId });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
