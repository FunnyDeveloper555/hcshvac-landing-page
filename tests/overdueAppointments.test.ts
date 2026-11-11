import { describe, it, expect } from "vitest";
import { isAppointmentPast, startMinutes } from "../src/lib/overdueAppointments";

describe("overdue appointments", () => {
  it("parses start times", () => {
    expect(startMinutes("2 PM to 4 PM")).toBe(840);
    expect(startMinutes("16:30")).toBe(990);
  });
  it("is past after today's start time", () => {
    const now = new Date(2026, 10, 11, 15, 0);
    expect(isAppointmentPast("2026-11-11", "2 PM to 4 PM", now)).toBe(true);
    expect(isAppointmentPast("2026-11-11", "4 PM to 6 PM", now)).toBe(false);
    expect(isAppointmentPast("2026-11-10", null, now)).toBe(true);
  });
});
