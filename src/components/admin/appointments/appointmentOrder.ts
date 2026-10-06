interface ScheduledAppointment {
  scheduled_date: string;
}

// Keep today's work first, followed by upcoming dates, then older appointments.
export function sortOpenAppointments<T extends ScheduledAppointment>(items: T[], today: string): T[] {
  const group = (date: string) => date === today ? 0 : date > today ? 1 : 2;
  return [...items].sort((a, b) => {
    const difference = group(a.scheduled_date) - group(b.scheduled_date);
    if (difference) return difference;
    return group(a.scheduled_date) === 2
      ? b.scheduled_date.localeCompare(a.scheduled_date)
      : a.scheduled_date.localeCompare(b.scheduled_date);
  });
}