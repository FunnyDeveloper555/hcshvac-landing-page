import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { formatPagerSms, isPagerRecipient } from "../_shared/pager-sms.ts";

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

// Accepts "09:00", "2:30 PM", and window strings like "4 PM to 6 PM" / "12 Noon to 2 PM"
// (uses the window's start time).
function parseTime(t: string): { h: number; m: number } {
  const start = (t || "").trim().split(/\s+to\s+|\s*-\s*/i)[0].trim();
  if (/^noon$|^12\s*noon$/i.test(start)) return { h: 12, m: 0 };
  const m = start.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp]\.?[Mm]\.?|noon)?$/i);
  if (!m) return { h: 9, m: 0 };
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const suf = m[3]?.replace(/\./g, "").toUpperCase();
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
  const isWindow = /\s+to\s+/i.test(time || "");
  return isWindow ? `${day}, ${time.trim()}` : `${day} at ${clock}`;
}

async function processAppointment(apt: any, kind: "booking" | "reminder") {
  const supabase = admin();
  const company = apt.companies?.name || "Home Comfort Suppliers";
  const when = prettyWhen(apt.scheduled_date, apt.scheduled_time);
  const results: any[] = [];

  const targets: Array<{ type: "customer" | "technician" | "staff"; phone: string | null; message: string }> = [
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

  // Extra notification targets (pagers, office lines) get the technician message too.
  const { data: extraTargets } = await supabase
    .from("notification_targets")
    .select("phone, email")
    .eq("active", true)
    .eq("notify_appointments", true);
  for (const t of extraTargets || []) {
    const phone = normalizePhone(t.phone);
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    targets.push({ type: "staff", phone, message: targets[1].message });
  }

  for (const t of targets) {
    if (!t.phone) continue;
    if (isPagerRecipient(t.phone, extraTargets || [])) t.message = formatPagerSms(t.message);
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

const COMPANY_ALERT_EMAILS: Record<string, string> = {
  "Best Comfort HVAC Joliet Office": "calendar@bestcomforthvac.com",
  "Blue Flame Heating and Cooling": "calendar@blueflameheatingcooling.com",
  "Jerry's Heating and Cooling": "calendar@jerrysheatingcooling.com",
  "PozitiveHVAC": "calendar@pozitivehvac.com",
};

// Text and email staff when a customer finishes a registration/booking link,
// so submissions are noticed even when nobody has the admin panel open.
async function notifyStaffOfSubmissions(supabase: ReturnType<typeof admin>) {
  const { data: subs, error } = await supabase
    .from("booking_invitations")
    .select("id, company_id, created_at, invitation_type, recipient_phone, recipient_email, completed_at, companies:company_id (name)")
    .eq("status", "completed")
    .is("staff_notified_at", null)
    .order("completed_at", { ascending: true })
    .limit(20);
  if (error) { console.error("submission alert query failed", error); return 0; }
  if (!subs?.length) return 0;

  const { data: staff } = await supabase
    .from("employees")
    .select("first_name, last_name, phone_number, email_address");
  const phones = [...new Set((staff || []).map((e: any) => normalizePhone(e.phone_number)).filter(Boolean))] as string[];
  const emails = [...new Set((staff || []).map((e: any) => (e.email_address || "").trim()).filter(Boolean))] as string[];

  // Extra notification targets (pagers, office lines) also get submission alerts.
  const { data: extra } = await supabase
    .from("notification_targets")
    .select("phone, email")
    .eq("active", true)
    .eq("notify_submissions", true);
  for (const t of extra || []) {
    const p = normalizePhone(t.phone);
    if (p && !phones.includes(p)) phones.push(p);
    const e = (t.email || "").trim();
    if (e && !emails.includes(e)) emails.push(e);
  }

  let count = 0;
  for (const s of subs as any[]) {
    const companyName = s.companies?.name || "Home Comfort Suppliers";
    const isBooking = s.invitation_type !== "registration";
    const kind = isBooking ? "booking" : "registration";

    // Find the appointment the customer just requested through this link.
    let appt: any = null;
    if (isBooking) {
      const last10 = (s.recipient_phone || "").replace(/\D/g, "").slice(-10);
      let q = supabase.from("appointments")
        .select("id, appointment_number, customer_name, customer_phone, customer_email, customer_address, appointment_type, visit_type, scheduled_date, scheduled_time, notes")
        .gte("created_at", s.created_at)
        .order("created_at", { ascending: false })
        .limit(10);
      if (s.company_id) q = q.eq("company_id", s.company_id);
      const { data: appts } = await q;
      appt = (appts || []).find((a: any) => last10 && (a.customer_phone || "").replace(/\D/g, "").slice(-10) === last10)
        || (appts || [])[0] || null;
    }

    const fullName = (appt?.customer_name || "").trim();
    const [firstName, ...rest] = fullName ? fullName.split(/\s+/) : [""];
    const lastName = rest.join(" ");
    const phone = appt?.customer_phone || s.recipient_phone || "";
    const email = appt?.customer_email || s.recipient_email || "";
    const name = fullName || email || phone || "A customer";
    let suggestedDate = "";
    if (appt?.scheduled_date) {
      const [y, m, d] = String(appt.scheduled_date).split("-");
      suggestedDate = `${m}-${d}-${y}`;
    }
    const submittedAt = s.completed_at
      ? new Date(s.completed_at).toLocaleString("en-US", { timeZone: ZONE, dateStyle: "medium", timeStyle: "short" })
      : "";
    const adminUrl = appt?.id
      ? `https://hcshvac.com/admin/appointments/add?id=${appt.id}`
      : "https://hcshvac.com/admin/screenpops/sms";

    const smsBody = isBooking
      ? `Appointment requested: ${name} ${phone}${suggestedDate ? ` — ${suggestedDate} ${appt?.scheduled_time || ""}` : ""} (Attn: ${companyName}). Needs approval or modification: ${adminUrl}`
      : `New ${kind} submission: ${name}${phone ? ` ${phone}` : ""} (${companyName}). Review it: ${adminUrl}`;
    for (const phone of phones) {
      const { data: blocked } = await supabase.rpc("is_phone_blocked", { _phone: phone });
      if (blocked) continue;
      try {
        await sendSms(phone, isPagerRecipient(phone, extra || []) ? formatPagerSms(smsBody) : smsBody);
      } catch (e) {
        console.error(`submission alert SMS to ${phone} failed: ${(e as Error).message}`);
      }
    }

    const toList = [...emails];
    const companyEmail = COMPANY_ALERT_EMAILS[companyName];
    if (companyEmail && !toList.includes(companyEmail)) toList.push(companyEmail);
    for (const to of toList) {
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: to,
            templateName: "booking-submission-alert",
            idempotencyKey: `booking-submission-alert-${s.id}-${to}`,
            templateData: {
              customerName: name,
              firstName,
              lastName,
              customerAddress: appt?.customer_address || "",
              customerPhone: phone,
              customerEmail: email,
              companyName,
              isBooking,
              suggestedDate,
              suggestedTime: appt?.scheduled_time || "",
              appointmentType: appt?.visit_type || appt?.appointment_type || "",
              notes: appt?.notes || "",
              appointmentNumber: appt?.appointment_number || "",
              submittedAt,
              adminUrl,
            },
          }),
        });
      } catch (e) {
        console.error(`submission alert email to ${to} failed: ${(e as Error).message}`);
      }
    }

    await supabase.from("booking_invitations").update({ staff_notified_at: new Date().toISOString() }).eq("id", s.id);
    count++;
  }
  return count;
}

// One-time text to clerical staff of the submission's company when a
// customer registration or suggested appointment is still unfinished after 12 hours.
async function escalateUnfinishedSubmissions(supabase: ReturnType<typeof admin>) {
  const cutoff = new Date(Date.now() - 12 * 3600000).toISOString();
  const [regs, appts, staffRes] = await Promise.all([
    supabase.from("customer_registrations")
      .select("id, company_id, created_at, ship_to_first_name, ship_to_last_name, phone, companies:company_id (name)")
      .eq("staff_review_required", true).is("staff_escalation_sent_at", null).lte("created_at", cutoff).limit(50),
    supabase.from("appointments")
      .select("id, company_id, created_at, customer_name, customer_phone, appointment_number, companies:company_id (name)")
      .eq("staff_review_required", true).is("staff_escalation_sent_at", null).lte("created_at", cutoff).limit(50),
    supabase.from("employees")
      .select("phone_number, job_title, department, company_id, active_company_ids, employment_status"),
  ]);
  const clerical = (staffRes.data || []).filter((e: any) =>
    (e.employment_status || "active") === "active" &&
    /clerical/i.test(`${e.job_title || ""} ${e.department || ""}`));

  const items = [
    ...(regs.data || []).map((r: any) => ({ table: "customer_registrations", id: r.id, company_id: r.company_id,
      company: r.companies?.name, label: "New registration", name: `${r.ship_to_first_name || ""} ${r.ship_to_last_name || ""}`.trim(), phone: r.phone })),
    ...(appts.data || []).map((a: any) => ({ table: "appointments", id: a.id, company_id: a.company_id,
      company: a.companies?.name, label: "Suggested appointment", name: a.customer_name, phone: a.customer_phone })),
  ];
  let sent = 0;
  for (const it of items) {
    // Claim first so overlapping runs never double-text.
    const { data: claimed } = await supabase.from(it.table)
      .update({ staff_escalation_sent_at: new Date().toISOString() })
      .eq("id", it.id).is("staff_escalation_sent_at", null).select("id");
    if (!claimed?.length) continue;
    const phones = [...new Set(clerical
      .filter((e: any) => !it.company_id || e.company_id === it.company_id || (e.active_company_ids || []).includes(it.company_id))
      .map((e: any) => normalizePhone(e.phone_number)).filter(Boolean))] as string[];
    const body = formatPagerSms(`12 HOURS UNFINISHED: ${it.label} - ${it.name || "customer"} ${it.phone || ""} (${it.company || "HCS"}). Please complete it in the CRM.`);
    for (const p of phones) {
      const { data: blocked } = await supabase.rpc("is_phone_blocked", { _phone: p });
      if (blocked) continue;
      try { await sendSms(p, body); sent++; } catch (e) { console.error(`12h escalation SMS to ${p} failed: ${(e as Error).message}`); }
    }
  }
  return sent;
}

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

      // Staff alerts: customers who finished a registration/booking link.
      const alerted = await notifyStaffOfSubmissions(supabase);
      const escalated = await escalateUnfinishedSubmissions(supabase);
      return json({ success: true, checked: rows?.length || 0, sent: out.length, details: out, submissionAlerts: alerted, escalationTexts: escalated });
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
