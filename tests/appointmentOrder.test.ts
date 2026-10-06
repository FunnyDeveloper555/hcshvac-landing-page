import { test } from "node:test";
import assert from "node:assert/strict";
import { sortOpenAppointments } from "../src/components/admin/appointments/appointmentOrder";

test("today's open appointments precede future and older appointments before pagination", () => {
  const items = ["2026-10-09", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-01"]
    .map(scheduled_date => ({ scheduled_date }));
  assert.deepEqual(sortOpenAppointments(items, "2026-10-06").map(item => item.scheduled_date),
    ["2026-10-06", "2026-10-07", "2026-10-09", "2026-10-05", "2026-10-01"]);
  assert.equal(items[0].scheduled_date, "2026-10-09");
});