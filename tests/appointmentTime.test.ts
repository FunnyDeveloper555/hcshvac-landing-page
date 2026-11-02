import { test, expect } from "bun:test";
import { parseTimeRange } from "../src/lib/appointmentIcs";
test("24-hour times keep their hour", () => {
  expect(parseTimeRange("11:00").start).toEqual({ h: 11, m: 0 });
  expect(parseTimeRange("10:30").start).toEqual({ h: 10, m: 30 });
  expect(parseTimeRange("12:00").start).toEqual({ h: 12, m: 0 });
});
test("6 PM to 8 PM is an evening range", () => {
  expect(parseTimeRange("6 PM to 8 PM")).toEqual({ start: { h: 18, m: 0 }, end: { h: 20, m: 0 } });
});
