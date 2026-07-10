// Build an RFC5545 iCalendar VEVENT for an appointment.
// Returns { ics, filename } or null if no valid date/time.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Format Date as ICS floating local time (no Z). We keep it local because
// scheduled_time in the DB has no timezone.
function toIcsLocal(d: Date): string {
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    "00"
  );
}

function toIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Parse "10:00 AM", "10:00", "13:30" -> {h,m}
function parseTime(t: string): { h: number; m: number } | null {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const suf = m[3]?.toUpperCase();
  if (suf === "PM" && h < 12) h += 12;
  if (suf === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

function esc(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function base64Utf8(s: string): string {
  // btoa doesn't handle non-latin1 — encode via URI first
  return btoa(unescape(encodeURIComponent(s)));
}

export interface BuildIcsInput {
  uid: string; // stable id, e.g. appointment id
  summary: string; // event title
  description?: string;
  location?: string;
  method?: "REQUEST" | "PUBLISH";
  organizerEmail?: string;
  organizerName?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  extraAttendees?: Array<{ email: string; name?: string }>;
  scheduledDate: string; // yyyy-mm-dd
  scheduledTime?: string | null;
  durationMinutes?: number; // default 60
  meetingUrl?: string;
}

export function buildMeetingUrl(uid: string): string {
  // Jitsi Meet — free, zero-config, works in any browser without accounts.
  const room = `hcs-appt-${uid}`.replace(/[^a-zA-Z0-9-]/g, "");
  return `https://meet.jit.si/${room}`;
}

export function buildAppointmentIcs(input: BuildIcsInput): {
  filename: string;
  contentBase64: string;
} | null {
  if (!input.scheduledDate) return null;
  const [yy, mm, dd] = input.scheduledDate.split("-").map((v) => parseInt(v, 10));
  if (!yy || !mm || !dd) return null;

  const t = input.scheduledTime ? parseTime(input.scheduledTime) : null;
  const start = new Date(yy, mm - 1, dd, t?.h ?? 9, t?.m ?? 0, 0);
  const end = new Date(start.getTime() + (input.durationMinutes ?? 60) * 60000);
  const dtstamp = toIcsUtc(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HCS//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${input.method || "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:appt-${input.uid}@hcshvac.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toIcsLocal(start)}`,
    `DTEND:${toIcsLocal(end)}`,
    `SUMMARY:${esc(input.summary)}`,
  ];
  const desc = [input.description || "", input.meetingUrl ? `\nJoin video call: ${input.meetingUrl}` : ""].join("").trim();
  if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
  if (input.meetingUrl) {
    lines.push(`URL:${input.meetingUrl}`);
    // X-props read by Google Calendar / Outlook to render a "Join" button
    lines.push(`X-GOOGLE-CONFERENCE:${input.meetingUrl}`);
    lines.push(`X-MICROSOFT-SKYPETEAMSMEETINGURL:${input.meetingUrl}`);
  }
  if (input.location) lines.push(`LOCATION:${esc(input.location)}`);
  if (input.organizerEmail) {
    lines.push(
      `ORGANIZER;CN=${esc(input.organizerName || input.organizerEmail)}:mailto:${input.organizerEmail}`,
    );
  }
  if (input.attendeeEmail) {
    lines.push(
      `ATTENDEE;CN=${esc(input.attendeeName || input.attendeeEmail)};RSVP=TRUE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:${input.attendeeEmail}`,
    );
  }
  if (input.extraAttendees) {
    for (const a of input.extraAttendees) {
      lines.push(
        `ATTENDEE;CN=${esc(a.name || a.email)};RSVP=FALSE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${a.email}`,
      );
    }
  }
  lines.push("STATUS:CONFIRMED", "SEQUENCE:0", "END:VEVENT", "END:VCALENDAR");

  const ics = lines.join("\r\n");
  return {
    filename: "appointment.ics",
    contentBase64: base64Utf8(ics),
  };
}
