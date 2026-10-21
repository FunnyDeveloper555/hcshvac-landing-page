import { test } from "node:test";
import assert from "node:assert/strict";
import { submissionPath } from "../src/lib/submissionAlerts";

test("registration action opens the existing customer for completion", () => {
  assert.equal(submissionPath({ id: "customer-123", kind: "registration" }), "/admin/customers/add?id=customer-123");
});
test("suggested appointment action opens the existing appointment for completion", () => {
  assert.equal(submissionPath({ id: "appointment-456", kind: "appointment" }), "/admin/appointments/add?id=appointment-456");
});