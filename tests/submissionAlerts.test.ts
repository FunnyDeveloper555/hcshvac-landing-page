import { test } from "node:test";
import assert from "node:assert/strict";
import { submissionPath, pendingSubmissionIds } from "../src/lib/submissionAlerts";

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