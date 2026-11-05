import { expect, test } from "bun:test";
import { productImportDetails } from "../src/lib/productImportDetails";

test("Other parts retain diameter and capacitance plus page-level height when saved", () => {
  const result = productImportDetails({ description: 'Mfd: 7.5 -\tDiameter: 2-1/2" -\tHeight: 4-1/2"' }, { vendor_sku_item_number: "12200" });
  expect(result.height).toBe('4-1/2"');
  expect(result.width_size).toBeNull();
  expect(result.specifications).toEqual({ vendor_sku_item_number: "12200", capacitance: "7.5", diameter: '2-1/2"', height: '4-1/2"' });
});