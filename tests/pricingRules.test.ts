import { describe, it, expect } from "vitest";
import { computeSellingPrice, pickRule, PricingRule } from "../src/lib/pricingRules";

describe("pricing rules", () => {
  it("applies (OC x MU) + labor", () => {
    expect(computeSellingPrice(1053.66, { markup: 1.8, labor_cost: 300, round_to: 0 })).toBe(2196.59);
  });
  it("rounds up to the chosen step", () => {
    expect(computeSellingPrice(100, { markup: 1.5, labor_cost: 2, round_to: 5 })).toBe(155);
  });
  it("prefers the product-type rule over the default", () => {
    const rules: PricingRule[] = [
      { name: "Default", markup: 1.5, labor_cost: 0, round_to: 0 },
      { name: "Coil", product_type: "Evaporator Coil", markup: 1.8, labor_cost: 300, round_to: 0 },
    ];
    expect(pickRule(rules, "Evaporator Coil")?.name).toBe("Coil");
    expect(pickRule(rules, "Furnace")?.name).toBe("Default");
  });
  it("ignores inactive rules", () => {
    expect(pickRule([{ name: "X", markup: 2, labor_cost: 0, round_to: 0, is_active: false }], "Furnace")).toBeUndefined();
  });
});
