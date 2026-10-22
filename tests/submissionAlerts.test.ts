import { test } from "node:test";
import assert from "node:assert/strict";
import { submissionPath, pendingSubmissionIds, submissionAgeStage, oldestPendingSubmission } from "../src/lib/submissionAlerts";

test("registration action opens the existing customer for completion", () => {
  assert.equal(submissionPath({ id: "customer-123", kind: "registration" }), "/admin/customers/add?id=customer-123");
});
test("suggested appointment action opens the existing appointment for completion", () => {
  assert.equal(submissionPath({ id: "appointment-456", kind: "appointment" }), "/admin/appointments/add?id=appointment-456");
});

test("pending indicators identify only alerted records of the corresponding kind", () => {
  const alerts = [{ id: "customer-123", kind: "registration" }, { id: "appointment-456", kind: "appointment" }];
  assert.deepEqual([...pendingSubmissionIds(alerts, "registration")], ["customer-123"]);
  assert.deepEqual([...pendingSubmissionIds(alerts, "appointment")], ["appointment-456"]);
  assert.equal(pendingSubmissionIds(alerts, "registration").has("other-customer"), false);
});

test("completion removing an alert removes its indicator without dismissing other pending work", () => {
  const alerts = [{ id: "customer-123", kind: "registration" }, { id: "appointment-456", kind: "appointment" }];
  const remaining = alerts.filter((alert) => alert.id !== "customer-123");
  assert.equal(pendingSubmissionIds(remaining, "registration").size, 0);
  assert.equal(pendingSubmissionIds(remaining, "appointment").has("appointment-456"), true);
});

const submitted = "2026-10-20T00:00:00Z";
const afterHours = (hours: number) => Date.parse(submitted) + hours * 3600000;
test("12 hours switches the pending dot to yellow", () => {
  assert.equal(submissionAgeStage(submitted, afterHours(12) - 1), "new");
  assert.equal(submissionAgeStage(submitted, afterHours(12)), "yellow");
});
test("24 hours switches the pending dot to one red dot", () => {
  assert.equal(submissionAgeStage(submitted, afterHours(24) - 1), "yellow");
  assert.equal(submissionAgeStage(submitted, afterHours(24)), "red");
});
test("48 hours switches the pending dot to two red dots", () => {
  assert.equal(submissionAgeStage(submitted, afterHours(48) - 1), "red");
  assert.equal(submissionAgeStage(submitted, afterHours(48)), "double-red");
  assert.equal(submissionAgeStage(submitted, afterHours(72)), "double-red");
});
test("menu escalation reflects the oldest unfinished submission of its kind", () => {
  const alerts = [{kind: "registration", submitted_at: submitted}, {kind: "appointment", submitted_at: "2026-10-19T00:00:00Z"}, {kind: "registration", submitted_at: "2026-10-21T00:00:00Z"}];
  assert.equal(oldestPendingSubmission(alerts, "registration"), submitted);
  assert.equal(oldestPendingSubmission([], "registration"), undefined);
});