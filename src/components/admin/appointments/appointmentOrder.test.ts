import { test, expect } from "bun:test";
import { sortOpenAppointments } from "./appointmentOrder";

test("today's open appointments precede future and older appointments before pagination", () => {
  const items = ["2026-10-09", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-01"]
    .map(scheduled_date => ({ scheduled_date }));
  expect(sortOpenAppointments(items, "2026-10-06").map(item => item.scheduled_date))
    .toEqual(["2026-10-06", "2026-10-07", "2026-10-09", "2026-10-05", "2026-10-01"]);
  expect(items[0].scheduled_date).toBe("2026-10-09");
});