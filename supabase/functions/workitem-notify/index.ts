import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Calendar sync + text notifications for internal work items (tickets and tasks).
//   body: { item_type: "ticket" | "task", item_id: string, action: "sync" | "sms" | "delete" }

const GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
const ZONE = "America/Chicago";

const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

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

function parseRange(t: string) {
  const parts = (t || "").split(/\s+(?:to|-|–|—|through|until)\s+/i);
  return {
    start: parseClock(parts[0] || "") || { h: 9, m: 0 },
    end: parts[1] ? parseClock(parts[1]) : null,
  };
}

function iso(date: string, time: string, addMinutes = 0): string {
  const [y, mo, d] = date.split("-").map((v) => parseInt(v, 10));
  const { h, m } = parseRange(time).start;
  const dt = new Date(Date.UTC(y, mo - 1, d, h, m + addMinutes, 0));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:00`;
}

function prettyWhen(date: string, time?: string | null) {
  if (!date) return "";
  const [y, mo, d] = date.split("-").map((v) => parseInt(v, 10));
  const { h, m } = time ? parseRange(time).start : { h: 9, m: 0 };
  const dt = new Date(Date.UTC(y, mo - 1, d, h, m));
  const day = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  if (!time) return day;
  return `${day} at ${time}`;
}

function zoneOffsetMinutes(utc: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(utc);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)!.value, 10);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return (asUtc - utc.getTime()) / 60000;
}

function centralUtc(date: string, h: number, m: number): number {
  const [y, mo, d] = date.split("-").map((v) => parseInt(v, 10));
  const naive = Date.UTC(y, mo - 1, d, h, m);
  let g = new Date(naive - zoneOffsetMinutes(new Date(naive)) * 60000);
  g = new Date(naive - zoneOffsetMinutes(g) * 60000);
  return g.getTime();
}

function describe(itemType: string, row: any) {
  const label = itemType === "task" ? row.task_number : row.ticket_number;
  const title = itemType === "task" ? row.title : row.subject;
  const forWho = row.for_type === "vendor"
    ? row.vendor_name
    : row.customer_name || (row.for_type === "other" ? "Other" : "");
  const when = row.scheduled_date
    ? prettyWhen(row.scheduled_date, row.scheduled_time)
    : row.expected_completion_date || row.due_date
      ? `due ${prettyWhen(row.expected_completion_date || row.due_date)}`
      : "no date set";
  return { label, title, forWho, when, kindWord: itemType === "task" ? "Task" : "Ticket" };
}

async function smsCrew(supabase: any, itemType: string, row: any, prefix = "") {
  const d = describe(itemType, row);
  const crew: Array<{ name?: string; phone?: string }> = Array.isArray(row.assigned_team) ? row.assigned_team : [];
  const message = [
    `${prefix}${d.kindWord} ${d.label || ""}: ${d.title}`.trim(),
    d.when,
    d.forWho ? `For: ${d.forWho}` : "",
    row.location ? `Where: ${row.location}` : "",
    row.public_notes ? `Notes: ${String(row.public_notes).slice(0, 160)}` : "",
  ].filter(Boolean).join(" | ");
  const results: any[] = [];
  const seen = new Set<string>();
  for (const m of crew) {
    const phone = normalizePhone(m?.phone);
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    const { data: blocked } = await supabase.rpc("is_phone_blocked", { _phone: phone });
    if (blocked) continue;
    try {
      await sendSms(phone, message);
      results.push({ name: m?.name, status: "sent" });
    } catch (e) {
      console.error(`work item SMS failed: ${(e as Error).message}`);
      results.push({ name: m?.name, status: "failed", error: (e as Error).message });
    }
  }
  return results;
}

async function emailCrew(itemType: string, row: any) {
  const d = describe(itemType, row);
  const crew: Array<{ name?: string; email?: string }> = Array.isArray(row.assigned_team) ? row.assigned_team : [];
  const out: any[] = [];
  const seen = new Set<string>();
  for (const m of crew) {
    const email = (m?.email || "").trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateName: "work-item-assigned",
        recipientEmail: email,
        idempotencyKey: `wi-${row.id}-${email}-${row.updated_at}`,
        templateData: {
          kind: d.kindWord, number: d.label, title: d.title, when: d.when, forWho: d.forWho,
          location: row.location, publicNotes: row.public_notes, employeeName: m?.name,
        },
      }),
    });
    out.push({ email, status: res.ok ? "sent" : "failed" });
    if (!res.ok) console.error("work item email failed", await res.text());
  }
  return out;
}

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 10) d = "1" + d;
  if (d.length < 11) return null;
  return "+" + d;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const payload = await req.json().catch(() => ({}));

    // Cron: 8 PM the night before, and 2 hours before the scheduled time.
    if (payload.action === "cron") {
      const sb = admin();
      if (!SID || !TOKEN || !FROM) return json({ error: "Text messaging is not configured" }, 500);
      const now = Date.now();
      const from = new Date(now - 86400000).toISOString().slice(0, 10);
      const to = new Date(now + 2 * 86400000).toISOString().slice(0, 10);
      const sent: any[] = [];
      for (const [t, table] of [["ticket", "tickets"], ["task", "tasks"]] as const) {
        const { data: rows } = await sb.from(table).select("*")
          .in("status", ["open", "in_progress"]).eq("send_sms_reminder", true)
          .gte("scheduled_date", from).lte("scheduled_date", to);
        for (const row of rows || []) {
          const r: any = row;
          const st = parseRange(r.scheduled_time || "9 AM").start;
          const start = centralUtc(r.scheduled_date, st.h, st.m);
          const [y, mo, d] = r.scheduled_date.split("-").map((v: string) => parseInt(v, 10));
          const prev = new Date(Date.UTC(y, mo - 1, d - 1)).toISOString().slice(0, 10);
          const night = centralUtc(prev, 20, 0);
          if (!r.reminder_night_sent_at && now >= night && now < start - 2 * 3600000) {
            await smsCrew(sb, t, r, "Reminder (tomorrow) ");
            await sb.from(table).update({ reminder_night_sent_at: new Date().toISOString() }).eq("id", r.id);
            sent.push({ id: r.id, kind: "night" });
          } else if (!r.reminder_2h_sent_at && now >= start - 2 * 3600000 && now < start) {
            await smsCrew(sb, t, r, "Reminder (in 2 hrs) ");
            await sb.from(table).update({ reminder_2h_sent_at: new Date().toISOString() }).eq("id", r.id);
            sent.push({ id: r.id, kind: "2h" });
          }
        }
      }
      return json({ success: true, sent });
    }

    const itemType = payload.item_type === "task" ? "task" : "ticket";
    const table = itemType === "task" ? "tasks" : "tickets";
    const itemId = payload.item_id;
    const action = payload.action || "sync";
    if (!itemId || typeof itemId !== "string") return json({ error: "item_id is required" }, 400);

    const supabase = admin();

    const authHeader = req.headers.get("Authorization") || "";
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) return json({ error: "Not authorized" }, 401);

    const { data: item, error } = await supabase
      .from(table)
      .select("*, calendars(calendar_name, google_calendar_id, email, phone)")
      .eq("id", itemId)
      .maybeSingle();
    if (error) throw error;
    if (!item) return json({ error: `${itemType} not found` }, 404);

    const row: any = item;
    const label = itemType === "task" ? row.task_number : row.ticket_number;
    const title = itemType === "task" ? row.title : row.subject;
    const crew: Array<{ name?: string; phone?: string; email?: string }> = Array.isArray(row.assigned_team)
      ? row.assigned_team
      : [];
    const crewNames = crew.map((m) => (m?.name || "").trim()).filter(Boolean);

    // ---------- Text + email to the assigned crew ----------
    if (action === "sms") {
      if (!SID || !TOKEN || !FROM) return json({ error: "Text messaging is not configured" }, 500);
      const results = await smsCrew(supabase, itemType, row);
      let emails: any[] = [];
      try { emails = await emailCrew(itemType, row); } catch (e) { console.error(e); }
      await supabase.from(table).update({ reminder_sent_at: new Date().toISOString() }).eq("id", itemId);
      return json({ success: true, results, emails });
    }

    // ---------- Vendor price & availability request ----------
    if (action === "rfq" && itemType === "task") {
      const s: any = row.sourcing && typeof row.sourcing === "object" ? row.sourcing : {};
      const vendors: any[] = Array.isArray(s.vendors) ? s.vendors : [];
      if (!vendors.length) return json({ error: "No vendors on this task" }, 400);
      let companyName = "HCS HVAC";
      if (row.company_id) {
        const { data: c } = await supabase.from("companies").select("name").eq("id", row.company_id).maybeSingle();
        if (c?.name) companyName = c.name;
      }
      // Customer: first, last, address, phone only.
      let customer = "";
      if (s.include_customer && row.customer_id) {
        const { data: c } = await supabase.from("customer_registrations")
          .select("ship_to_first_name, ship_to_last_name, ship_to_address, ship_to_city, ship_to_state, ship_to_zip_code, phone")
          .eq("id", row.customer_id).maybeSingle();
        if (c) {
          customer = [
            `${c.ship_to_first_name || ""} ${c.ship_to_last_name || ""}`.trim(),
            [c.ship_to_address, c.ship_to_city, [c.ship_to_state, c.ship_to_zip_code].filter(Boolean).join(" ")].filter(Boolean).join(", "),
            c.phone,
          ].filter(Boolean).join(", ");
        }
      }
      const files: any[] = [
        ...(s.include_task_photos && Array.isArray(row.attachments) ? row.attachments : []),
        ...(Array.isArray(s.media) ? s.media : []),
      ];
      const media: Array<{ url: string; name: string; isImage: boolean }> = [];
      if (files.length) {
        const { data: signed } = await supabase.storage.from("workitem-files")
          .createSignedUrls(files.map((f) => f.path), 60 * 60 * 24 * 14);
        (signed || []).forEach((sg: any, i: number) => {
          if (sg?.signedUrl) media.push({ url: sg.signedUrl, name: files[i].name, isImage: String(files[i].type || "").startsWith("image/") });
        });
      }
      const results: any[] = [];
      const now = new Date().toISOString();
      for (const v of vendors) {
        if (!v?.vendor_id) continue;
        const method = v.method || "both";
        let sent = false;
        if (method === "text" || method === "both") {
          const phone = normalizePhone(v.alt_sms || v.sms || v.phone);
          if (!phone || !SID || !TOKEN || !FROM) {
            results.push({ to: `${v.name} (text)`, status: "failed", error: "no text number" });
          } else {
            const body = [
              `${companyName} – Price & Availability ${label || ""}`.trim(),
              v.account_number ? `Acct #: ${v.account_number}` : "",
              s.message || "",
              customer ? `Job site: ${customer}` : "",
              ...media.slice(0, 5).map((m) => m.url),
            ].filter(Boolean).join("\n");
            try {
              const form = new URLSearchParams({ To: phone, From: FROM!, Body: body.slice(0, 1550) });
              media.filter((m) => m.isImage).slice(0, 10).forEach((m) => form.append("MediaUrl", m.url));
              const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
                method: "POST",
                headers: { Authorization: `Basic ${btoa(`${SID}:${TOKEN}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
                body: form.toString(),
              });
              if (!res.ok) throw new Error((await res.json())?.message || `Twilio ${res.status}`);
              results.push({ to: `${v.name} (text)`, status: "sent" });
              sent = true;
            } catch (e) {
              results.push({ to: `${v.name} (text)`, status: "failed", error: (e as Error).message });
            }
          }
        }
        if (method === "email" || method === "both") {
          const email = (v.alt_email || v.email || "").trim();
          if (!email) {
            results.push({ to: `${v.name} (email)`, status: "failed", error: "no email" });
          } else {
            const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
              method: "POST",
              headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                templateName: "vendor-rfq",
                recipientEmail: email,
                idempotencyKey: `rfq-${row.id}-${v.vendor_id}-${now}`,
                templateData: { companyName, vendorName: v.name, accountNumber: v.account_number, number: label, message: s.message, customer, media },
              }),
            });
            if (res.ok) { results.push({ to: `${v.name} (email)`, status: "sent" }); sent = true; }
            else results.push({ to: `${v.name} (email)`, status: "failed", error: await res.text() });
          }
        }
        if (sent) v.sent_at = now;
      }
      await supabase.from(table).update({ sourcing: s }).eq("id", itemId);
      await supabase.from("work_item_replies").insert({
        item_type: "task", item_id: itemId, author_id: userData.user.id, author_name: userData.user.email,
        message: `Price & availability request sent to: ${vendors.filter((v) => v.sent_at === now).map((v) => v.name).join(", ") || "nobody"}`,
      });
      return json({ success: true, results, sourcing: s });
    }

    // ---------- Text one vendor from the Notes Log ----------
    if (action === "vendor_text" && itemType === "task") {
      if (!SID || !TOKEN || !FROM) return json({ error: "Text messaging is not configured" }, 500);
      const message = String(payload.message || "").trim().slice(0, 1500);
      if (!message) return json({ error: "Message is required" }, 400);
      const vendors: any[] = Array.isArray(row.sourcing?.vendors) ? row.sourcing.vendors : [];
      const v = vendors.find((x) => x?.vendor_id === payload.vendor_id);
      if (!v) return json({ error: "Vendor is not on this task" }, 400);
      const phone = normalizePhone(v.alt_sms || v.sms || v.phone);
      if (!phone) return json({ error: "This vendor has no text number" }, 400);
      const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", userData.user.id).maybeSingle();
      const who = prof?.display_name || userData.user.email;
      try {
        await sendSms(phone, `${label ? label + ": " : ""}${message}`);
      } catch (e) {
        return json({ error: (e as Error).message }, 502);
      }
      await supabase.from("work_item_replies").insert({
        item_type: "task", item_id: itemId, author_id: userData.user.id,
        author_name: `${who} → ${v.name || "vendor"} (text)`, message,
        direction: "outbound", channel: "sms", phone, vendor_id: v.vendor_id,
      });
      return json({ success: true });
    }

    // ---------- Customer quote approval text ----------
    if (action === "quote" && itemType === "task") {
      if (!SID || !TOKEN || !FROM) return json({ error: "Text messaging is not configured" }, 500);
      if (!row.customer_id) return json({ error: "No customer on this task" }, 400);
      if (!row.quote_total) return json({ error: "No quote total set" }, 400);
      const { data: c } = await supabase.from("customer_registrations")
        .select("ship_to_first_name, phone").eq("id", row.customer_id).maybeSingle();
      const phone = normalizePhone(c?.phone);
      if (!phone) return json({ error: "The customer has no mobile number on file" }, 400);
      const { data: blocked } = await supabase.rpc("is_phone_blocked", { _phone: phone });
      if (blocked) return json({ error: "The customer's number is blocked" }, 400);
      let companyName = "HCS HVAC";
      if (row.company_id) {
        const { data: co } = await supabase.from("companies").select("name").eq("id", row.company_id).maybeSingle();
        if (co?.name) companyName = co.name;
      }
      const origin = typeof payload.origin === "string" && /^https?:\/\//.test(payload.origin) ? payload.origin : "https://hcshvac.com";
      const link = `${origin}/quote/${row.quote_token}`;
      const msg = `${companyName}: Hi ${c?.ship_to_first_name || ""}, we located the part for your repair (${title}). Total: $${Number(row.quote_total).toFixed(2)}. Approve or decline here: ${link}`;
      await sendSms(phone, msg);
      await supabase.from(table).update({ quote_status: "pending", quote_sent_at: new Date().toISOString() }).eq("id", itemId);
      await supabase.from("work_item_replies").insert({
        item_type: "task", item_id: itemId, author_id: userData.user.id, author_name: userData.user.email,
        message: `Quote of $${Number(row.quote_total).toFixed(2)} texted to customer for approval`,
      });
      return json({ success: true });
    }

    // ---------- Google Calendar ----------
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const gcalKey = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!lovableKey || !gcalKey) return json({ error: "Google Calendar is not connected" }, 500);

    const calRow: any = row.calendars;
    const calendarId = calRow?.google_calendar_id || "primary";
    const eventId = row.google_event_id as string | null;
    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gcalKey,
      "Content-Type": "application/json",
    };

    if (action === "delete" || row.status === "cancelled") {
      if (eventId) {
        const res = await fetch(
          `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
          { method: "DELETE", headers },
        );
        if (!res.ok && res.status !== 404 && res.status !== 410) {
          const details = await res.text();
          return json({ error: "Calendar delete failed", details }, res.status);
        }
      }
      await supabase.from(table).update({ google_event_id: null }).eq("id", itemId);
      return json({ success: true, deleted: true });
    }

    const eventDate = row.scheduled_date || row.expected_completion_date || row.due_date;
    if (!eventDate) return json({ error: "No date set, nothing to put on the calendar" }, 400);
    const eventTime = row.scheduled_time || "9 AM";
    const range = parseRange(eventTime);
    const startMin = range.start.h * 60 + range.start.m;
    const endMin = range.end ? range.end.h * 60 + range.end.m : null;
    const duration = endMin !== null && endMin > startMin ? endMin - startMin : Number(row.duration_minutes) || 60;

    const attendees: Array<{ email: string }> = [];
    if (calRow?.email) attendees.push({ email: calRow.email });
    for (const m of crew) {
      const email = (m?.email || "").trim();
      if (email && !attendees.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        attendees.push({ email });
      }
    }

    const kindWord = itemType === "task" ? "Task" : "Ticket";
    const body = {
      summary: `${kindWord}: ${title}${label ? ` (${label})` : ""}${crewNames.length ? ` [${crewNames.join(", ")}]` : ""}`,
      description: [
        `${kindWord}: ${label || ""}`.trim(),
        row.customer_name ? `Customer: ${row.customer_name}` : "",
        row.customer_phone ? `Phone: ${row.customer_phone}` : "",
        row.reason ? `Reason: ${row.reason}` : "",
        row.task_type ? `Type: ${row.task_type}` : "",
        row.vendor_name ? `Vendor: ${row.vendor_name}` : "",
        row.public_notes ? `Public notes: ${row.public_notes}` : "",
        row.location ? `Where: ${row.location}` : "",
        crewNames.length ? `Team: ${crewNames.join(", ")}` : "",
        row.expected_completion_date ? `Expected completion: ${row.expected_completion_date}` : "",
        row.due_date ? `Due: ${row.due_date}` : "",
        row.created_by_name ? `Created by: ${row.created_by_name}` : "",
      ].filter(Boolean).join("\n"),
      location: row.location || row.customer_address || undefined,
      start: { dateTime: iso(eventDate, eventTime), timeZone: ZONE },
      end: { dateTime: iso(eventDate, eventTime, duration), timeZone: ZONE },
      attendees: attendees.length ? attendees : undefined,
      reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
    };

    const url = eventId
      ? `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`
      : `${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`;

    let res = await fetch(url, { method: eventId ? "PATCH" : "POST", headers, body: JSON.stringify(body) });
    if (eventId && (res.status === 404 || res.status === 410)) {
      res = await fetch(`${GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
    }
    if (!res.ok) {
      const details = await res.text();
      console.error(`Work item calendar sync failed [${res.status}]: ${details}`);
      return json({ error: "Calendar sync failed", status: res.status, details }, res.status);
    }

    const event = await res.json();
    await supabase.from(table).update({ google_event_id: event.id }).eq("id", itemId);
    return json({ success: true, event_id: event.id, html_link: event.htmlLink });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
