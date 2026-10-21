import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPagerSms, isPagerRecipient } from "../supabase/functions/_shared/pager-sms";

test("pager alerts preserve customer and time as single-part printable text", () => {
  const body = formatPagerSms("Appointment requested: Kathy Stricker 8155573689 — 10-23-2026 10:18 (Attn: Best Comfort HVAC Chicago). Needs approval or modification: https://hcshvac.com/admin/appointments/add?id=appointment-123");
  assert.match(body, /Kathy Stricker 8155573689/);
  assert.match(body, /10-23-2026 10:18/);
  assert.match(body, /^[\x20-\x7e]+$/);
  assert.ok(body.length <= 160);
  assert.ok(!body.includes("https://"));
});

test("pager formatting normalizes Unicode and bounds long content", () => {
  const body = formatPagerSms(`José — “New job” ${"long address ".repeat(30)}`);
  assert.ok(body.startsWith('Jose - "New job"'));
  assert.ok(body.endsWith("..."));
  assert.ok(body.length <= 160);
  assert.throws(() => formatPagerSms("😀"));
});

test("only the registered USAMobility phone gets pager formatting", () => {
  const targets = [{ phone: "8152030237", email: "815-203-0237@usamobility.net" }];
  assert.equal(isPagerRecipient("+18152030237", targets), true);
  assert.equal(isPagerRecipient("+18152030238", targets), false);
  assert.equal(isPagerRecipient("+18152030237", [{ phone: "8152030237", email: "office@example.com" }]), false);
});