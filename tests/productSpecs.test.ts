import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_SPEC_CATEGORIES,
  specCategory,
  visibleSpecFields,
  PAGE_LEVEL_SPEC_KEYS,
} from "../src/lib/productSpecs";

const keysOf = (name: string) => visibleSpecFields(specCategory(name)).map((f) => f.key);

test("the five product filter categories are offered", () => {
  assert.deepEqual(
    PRODUCT_SPEC_CATEGORIES.map((c) => c.name),
    ["Furnace", "Evaporator Coil", "Condenser", "Water Heater", "Boiler"]
  );
});

test("no product type repeats the page's own dimension boxes", () => {
  for (const cat of PRODUCT_SPEC_CATEGORIES) {
    const shown = visibleSpecFields(cat).map((f) => f.key);
    for (const dup of PAGE_LEVEL_SPEC_KEYS) {
      assert.equal(shown.includes(dup), false, `${cat.name} should not show ${dup} again`);
    }
  }
});

test("furnace keeps its necessary fields", () => {
  const shown = keysOf("Furnace");
  for (const needed of ["vendor", "vendor_sku_item_number", "location_type", "voltage", "afue", "input_btu_s", "poise", "stages", "our_cost"]) {
    assert.equal(shown.includes(needed), true, `Furnace is missing ${needed}`);
  }
  // 24 sheet fields minus the 4 dimension copies the page already has
  assert.equal(shown.length, 20);
});

test("water heater keeps its own measurement fields", () => {
  const shown = keysOf("Water Heater");
  for (const needed of ["gallons_capacity_size", "btu_hr_input", "dry_weight_lbs", "depth_front_to_back_of_unit_inches", "our_cost"]) {
    assert.equal(shown.includes(needed), true, `Water Heater is missing ${needed}`);
  }
});

test("unknown product type shows no sheet fields", () => {
  assert.deepEqual(visibleSpecFields(specCategory("")), []);
  assert.deepEqual(visibleSpecFields(undefined), []);
});
