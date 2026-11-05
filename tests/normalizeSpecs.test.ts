import { test, expect } from "bun:test";
import { normalizeSpecs } from "../src/lib/normalizeSpecs";
import { specCategory } from "../src/lib/productSpecs";

test("snaps AI values onto exact Condenser options", () => {
  const cat = specCategory("Condenser")!;
  const s = normalizeSpecs(cat, { btu_s: "18,000", a2l_compliant: "yes", location_type: "Residential", bogus: 1 });
  expect(s.btu_s).toBe("18,000 (1.5 Ton)");
  expect(s.a2l_compliant).toBe("Yes");
  expect(s.location_type).toEqual(["Residential"]);
  expect(s.bogus).toBeUndefined();
});
