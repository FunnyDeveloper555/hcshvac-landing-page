// Shared 2-hour appointment time windows: "12 Midnight to 2 AM", "1 AM to 3 AM", ...
export const formatHour = (h: number): string => {
  const hour24 = ((h % 24) + 24) % 24;
  if (hour24 === 0) return "12 Midnight";
  if (hour24 === 12) return "12 Noon";
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
};

export const timeSlots = Array.from({ length: 24 }, (_, i) => `${formatHour(i)} to ${formatHour(i + 2)}`);

// Customer-submitted times (e.g. "16:30" from the booking form) are not one of the
// standard windows; this keeps them visible in time dropdowns instead of blank.
export const timeSlotsWith = (current?: string | null): string[] =>
  current && !timeSlots.includes(current) ? [current, ...timeSlots] : timeSlots;
