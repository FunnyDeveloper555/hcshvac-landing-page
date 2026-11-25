import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultForm, masterElements, productFormPatch, valuesFromProduct, generatedProductName, readFieldKeys } from "../src/lib/productForms";

test("Pumps form includes GPM without furnace-only measurements", () => {
  const pump = defaultForm("Pumps");
  assert.equal(pump.fields.includes("gpm"), true);
  assert.equal(pump.fields.includes("input_btu_s"), false);
});
test("selected dimensions write the catalog columns rather than duplicate specifications", () => {
  const fields = masterElements().filter(f => ["height", "width_size", "length_depth", "weight"].includes(f.key));
  const patch = productFormPatch("Pumps", fields, { product_name: "Pump", height: "20", width_size: "10", length_depth: "8", weight: "12.5" });
  assert.equal(patch.height, "20"); assert.equal(patch.width_size, "10"); assert.equal(patch.length_depth, "8"); assert.equal(patch.weight, 12.5);
  assert.deepEqual(patch.specifications, {});
});
test("hidden attributes and pricing are not overwritten by a tailored form", () => {
  const fields = masterElements().filter(f => f.key === "gpm");
  const patch = productFormPatch("Pumps", fields, { product_name: "Pump", gpm: "25" }, { legacy: "keep", our_cost: 150, custom_connection: "1 inch" });
  assert.deepEqual(patch.specifications, { legacy: "keep", our_cost: 150, custom_connection: "1 inch", gpm: "25" });
  assert.equal(Object.hasOwn(patch, "selling_price"), false);
  assert.equal(Object.hasOwn(patch, "model_number"), false);
});
test("brand control saves both ID and display name", () => {
  const patch = productFormPatch("Pumps", masterElements().filter(f => f.kind === "brand"), { product_name: "Pump", brand_id: "brand-1", brand_name: "Crane Crest" });
  assert.equal(patch.brand_id, "brand-1"); assert.equal(patch.brand_name, "Crane Crest");
});
test("primary vendor cost feeds shared Our Cost while retaining additional vendor quotes", () => {
  const quotes = [{ supplier_name: "Vendor 1", our_cost: "250" }, { supplier_name: "Vendor 2", our_cost: "275" }];
  const patch = productFormPatch("Pumps", masterElements().filter(f => f.kind === "costs"), { product_name: "Pump", vendor_costs: quotes });
  assert.deepEqual(patch.specifications, { vendor_costs: quotes, our_cost: "250", vendor: "Vendor 1" });
});
test("custom dropdown and multi-selection values remain typed in specifications", () => {
  const fields = masterElements([{ key: "custom_pipe", label: "Pipe", kind: "select", options: ["1 inch", "2 inch"], section: "Custom Elements" }, { key: "custom_sizes", label: "Sizes", kind: "multi", options: ["S", "L"], section: "Custom Elements" }]).filter(f => f.key.startsWith("custom_"));
  const patch = productFormPatch("Pumps", fields, { product_name: "Pump", custom_pipe: "2 inch", custom_sizes: ["S", "L"] });
  assert.deepEqual(patch.specifications, { custom_pipe: "2 inch", custom_sizes: ["S", "L"] });
});
test("image order roundtrips and generator retains standard name sequence", () => {
  const values = valuesFromProduct({ product_name: "Pump", spot_images: ["main", "thumb"], specifications: { gpm: "25" } });
  assert.equal(values.main_image, "main"); assert.deepEqual(values.thumbnail_images, ["thumb"]);
  const patch = productFormPatch("Pumps", masterElements().filter(f => ["image", "images"].includes(f.kind)), values);
  assert.deepEqual(patch.spot_images, ["main", "thumb"]);
  assert.equal(generatedProductName("Furnace", { brand_name: "Brand", model_number: "M1", location_type: ["Residential"], input_btu_s: "60000", refrigerant_type: "R-32", seer_rating: "16" }), "Brand M1 Residential 60000 R-32 16 Furnace");
});
test("malformed field configuration falls back safely", () => {
  assert.deepEqual(readFieldKeys(null), []); assert.deepEqual(readFieldKeys(["gpm", null, "gpm", 1]), ["gpm"]);
});
test("legacy sheet values remain editable when the equivalent catalog column is empty", () => {
  const values = valuesFromProduct({ product_name: "Legacy furnace", voltage: null, afue: "", specifications: { voltage: "120v", afue: "96" } });
  assert.equal(values.voltage, "120v"); assert.equal(values.afue, "96%");
});
import { moveKey, orderedElements, STANDARD_ELEMENTS } from "../src/lib/productForms";
test("layout: moves an item to a new position", () => { assert.deepEqual(moveKey(["a", "b", "c"], 2, 0), ["c", "a", "b"]); });
test("layout: elements follow saved order", () => { assert.deepEqual(orderedElements(STANDARD_ELEMENTS, ["missing", "model_number", "product_name"]).map(e => e.key), ["model_number", "product_name"]); });
