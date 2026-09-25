import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Sends appointment text messages:
//  - kind "booking"  : immediate confirmation right after booking
//  - kind "reminder" : 1 hour before the appointment (driven by mode "cron")
// Recipients: the customer and the assigned technician / company calendar phone.

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 10) d = "1" + d;
  if (d.length < 11) return null;
  return "+" + d;
}

function parseTime(t: string): { h: number; m: number } {
  const m = (t || "").trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return { h: 9, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const suf = m[3]?.toUpperCase();
  if (suf === "PM" && h < 12) h += 12;
  if (suf === "AM" && h === 12) h = 0;
  return { h, m: min };
}

// Appointment times are stored without a timezone; treat them as US Central,
// resolving the real CST/CDT offset for that date instead of a fixed guess.
const ZONE = "America/Chicago";

function zoneOffsetMinutes(utc: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(utc);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value, 10);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return (asUtc - utc.getTime()) / 60000; // negative west of Greenwich
}

function appointmentUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map((v) => parseInt(v, 10));
  const { h, m } = parseTime(time);
  const naive = Date.UTC(y, mo - 1, d, h, m);
  // Two passes settle the offset even near a DST boundary.
  let guess = new Date(naive - zoneOffsetMinutes(new Date(naive)) * 60000);
  guess = new Date(naive - zoneOffsetMinutes(guess) * 60000);
  return guess;
}

async function sendSms(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
  const form = new URLSearchParams({ To: to, From: FROM!, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result?.message || `Twilio error ${res.status}`);
  return result;
}

function prettyWhen(date: string, time: string) {
  const [y, mo, d] = date.split("-").map((v) => parseInt(v, 10));
  const { h, m } = parseTime(time);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, m));
  const day = dt.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
  const clock = dt.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });
  return `${day} at ${clock}`;
}

async function processAppointment(apt: any, kind: "booking" | "reminder") {
  const supabase = admin();
  const company = apt.companies?.name || "Home Comfort Suppliers";
  const when = prettyWhen(apt.scheduled_date, apt.scheduled_time);
  const results: any[] = [];

  const targets: Array<{ type: "customer" | "technician"; phone: string | null; message: string }> = [
    {
      type: "customer",
      phone: normalizePhone(apt.customer_phone),
      message:
        kind === "booking"
          ? `${company}: your appointment is booked for ${when}. ${apt.appointment_number ? `Ref ${apt.appointment_number}. ` : ""}We'll text you a reminder an hour before. Reply STOP to opt out.`
          : `${company}: reminder — your appointment is in about 1 hour (${when}). ${apt.customer_address ? `Address: ${apt.customer_address}. ` : ""}Reply STOP to opt out.`,
    },
    {
      type: "technician",
      phone: normalizePhone(apt.technician_phone || apt.calendars?.phone),
      message:
        kind === "booking"
          ? `New job ${apt.appointment_number || ""}: ${apt.customer_name} — ${when}. ${apt.customer_address || ""} ${apt.customer_phone || ""}`.trim()
          : `Job in 1 hour (${when}): ${apt.customer_name} — ${apt.customer_address || ""} ${apt.customer_phone || ""}`.trim(),
    },
  ];

  // Extra crew members assigned to the job also get the technician message.
  const crew = Array.isArray(apt.assigned_team) ? apt.assigned_team : [];
  const seen = new Set(targets.map((t) => t.phone).filter(Boolean) as string[]);
  for (const m of crew) {
    const phone = normalizePhone(m?.phone);
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    targets.push({ type: "technician", phone, message: targets[1].message });
  }

  for (const t of targets) {
    if (!t.phone) continue;
    const { data: blocked } = await supabase.rpc("is_phone_blocked", { _phone: t.phone });
    if (blocked) continue;
    try {
      const sent = await sendSms(t.phone, t.message);
      await supabase.from("appointment_sms_log").insert({
        appointment_id: apt.id, recipient_type: t.type, phone: t.phone,
        kind, message: t.message, status: "sent", provider_sid: sent.sid,
      });
      results.push({ recipient: t.type, status: "sent" });
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`SMS to ${t.type} failed: ${msg}`);
      await supabase.from("appointment_sms_log").insert({
        appointment_id: apt.id, recipient_type: t.type, phone: t.phone,
        kind, message: t.message, status: "failed", error: msg,
      });
      results.push({ recipient: t.type, status: "failed", error: msg });
    }
  }

  await supabase
    .from("appointments")
    .update(kind === "booking"
      ? { booking_sms_sent_at: new Date().toISOString() }
      : { reminder_sms_sent_at: new Date().toISOString() })
    .eq("id", apt.id);

  return results;
}

const SELECT = "id, assigned_team, appointment_number, customer_name, customer_phone, customer_address, scheduled_date, scheduled_time, status, notes, technician_phone, sms_reminders_enabled, booking_sms_sent_at, reminder_sms_sent_at, companies(name), calendars(phone)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!SID || !TOKEN || !FROM) return json({ error: "Text messaging is not configured" }, 500);

    const payload = await req.json().catch(() => ({}));
    const supabase = admin();

    // Cron mode: send the 1-hour reminders that are due.
    if (payload.mode === "cron") {
      // Piggy-back ticket/task reminders on the same schedule.
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/workitem-notify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cron" }),
      }).catch((e) => console.error("workitem cron failed", e));
      const now = Date.now();
      const { data: rows, error } = await supabase
        .from("appointments")
        .select(SELECT)
        .eq("status", "open")
        .is("reminder_sms_sent_at", null)
        .gte("scheduled_date", new Date(now - 86400000).toISOString().slice(0, 10))
        .lte("scheduled_date", new Date(now + 86400000).toISOString().slice(0, 10));
      if (error) throw error;

      const due = (rows || []).filter((a: any) => {
        if (a.sms_reminders_enabled === false) return false;
        const start = appointmentUtc(a.scheduled_date, a.scheduled_time).getTime();
        const minutesAway = (start - now) / 60000;
        return minutesAway <= 60 && minutesAway > -15;
      });

      const out = [];
      for (const apt of due) out.push({ id: apt.id, results: await processAppointment(apt, "reminder") });
      return json({ success: true, checked: rows?.length || 0, sent: out.length, details: out });
    }

    // Explicit send (booking confirmation or manual reminder) — requires a signed-in admin.
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(jwt);
    if (!userData?.user) return json({ error: "Not authorized" }, 401);

    const { appointment_id, kind } = payload;
    if (!appointment_id || (kind !== "booking" && kind !== "reminder")) {
      return json({ error: "appointment_id and kind (booking|reminder) are required" }, 400);
    }

    const { data: apt, error } = await supabase.from("appointments").select(SELECT).eq("id", appointment_id).maybeSingle();
    if (error) throw error;
    if (!apt) return json({ error: "Appointment not found" }, 404);

    const results = await processAppointment(apt, kind);
    return json({ success: true, results });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
