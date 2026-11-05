import { expect, test } from "bun:test";
import { descriptionDetails, enrichDescription } from "../supabase/functions/parse-products/description";

test("reads fractional height and diameter from the uploaded MARS description", () => {
  const s = descriptionDetails('Turbo™ 200 Universal Replacement Capacitor - Description: Turbo200 -\tMfd: 2.5 to 67.5 -\tVolts: 370VAC or 440VAC -\tDiameter: 2-1/2" -\tHeight: 4-1/2"');
  expect(s).toEqual({ capacitance: "2.5 to 67.5", voltage: "370VAC or 440VAC", diameter: '2-1/2"', height: '4-1/2"' });
});
test("maps description height and depth to Model & Dimensions without losing source text", () => {
  const description = 'Motor Run Capacitor Oval - Mfd: 7.5 -\tVolts: 370 -\tHeight: 2-1/8" -\tDepth: 1-1/4"';
  const p = enrichDescription({ description, specs: { energy_supply_type: "Electric" } });
  expect(p.height).toBe('2-1/8"');
  expect(p.length_depth).toBe('1-1/4"');
  expect(p.description).toBe(description);
  expect(p.specs?.energy_supply_type).toBe("Electric");
});
test("never treats diameter as width or infers dimensions from a model code", () => {
  const p = enrichDescription({ description: 'Model C307L Diameter: 2-1/2"' });
  expect(p.width_size).toBeUndefined();
  expect(p.height).toBeUndefined();
  expect(p.specs?.diameter).toBe('2-1/2"');
});
test("maps pounds only to the numeric weight column", () => {
  expect(enrichDescription({ description: "Weight: 125 lbs" }).weight).toBe(125);
  expect(enrichDescription({ description: "Weight: 12 kg" }).weight).toBeUndefined();
});