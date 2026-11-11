/** Start time of an appointment's scheduled_time text ("16:30", "2 PM to 4 PM", "9am"), in minutes; null if unknown. */
export function startMinutes(time: string | null | undefined): number | null {
  const m = (time || "").match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h > 23 ? null : h * 60 + Number(m[2] || 0);
}

/** True once the appointment's date (and start time, when known) is in the past. */
export function isAppointmentPast(date: string | null, time: string | null, now = new Date()): boolean {
  if (!date) return false;
  const [y, mo, d] = date.split("-").map(Number);
  const start = new Date(y, mo - 1, d);
  const mins = startMinutes(time);
  if (mins === null) start.setDate(start.getDate() + 1); // unknown time: overdue after the day ends
  else start.setMinutes(mins);
  return start.getTime() <= now.getTime();
}
