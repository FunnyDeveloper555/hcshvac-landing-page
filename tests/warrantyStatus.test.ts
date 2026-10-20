import { test } from "node:test";
import assert from "node:assert/strict";
import { warrantyStatus, isInstallationVisit } from "../src/components/admin/installations/warrantyStatus";

const base = { install_date: "2025-01-01", maintenance_interval_months: 12, labor_warranty_years: 10, equipment_warranty_years: 10 };

test("green when maintenance is not yet due", () => {
  assert.equal(warrantyStatus(base, "2025-12-31").color, "green");
});
test("yellow when maintenance is overdue by less than 90 days", () => {
  assert.equal(warrantyStatus(base, "2026-03-01").color, "yellow");
});
test("red (void) when maintenance is more than 90 days overdue", () => {
  assert.equal(warrantyStatus(base, "2026-04-02").color, "red");
});
test("recent maintenance resets the clock", () => {
  assert.equal(warrantyStatus({ ...base, last_maintenance_date: "2026-03-01" }, "2026-06-01").color, "green");
});
test("expired after the warranty period", () => {
  assert.equal(warrantyStatus({ ...base, labor_warranty_years: 1, equipment_warranty_years: 1, last_maintenance_date: "2025-12-01" }, "2026-01-02").color, "expired");
});
test("installation visit types require the form", () => {
  assert.equal(isInstallationVisit("Residential Furnace Installation"), true);
  assert.equal(isInstallationVisit("Service Repair"), false);
});
