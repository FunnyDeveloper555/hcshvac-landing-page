import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimateTotals, legacyEstimateLines, lineTotal, EstimateLine } from "../src/lib/bundles";
import { monthlyPayment, contractorCost } from "../src/lib/bundleMath";

const l = (qty: number, price: number, cost = 0): EstimateLine => ({ id: "x", type: "product", title: "t", qty, unitPrice: price, unitOurCost: cost });

describe("estimate lines", () => {
  it("multiplies qty by unit price", () => assert.equal(lineTotal(l(2, 150.25)), 300.5));
  it("totals mixed lines and applies discount", () => {
    const t = estimateTotals([l(1, 5000, 3000), l(2, 250, 100)], 500);
    assert.deepEqual(t, { subtotal: 5500, ourCost: 3200, discount: 500, total: 5000 });
  });
  it("never discounts below zero", () => assert.equal(estimateTotals([l(1, 100)], 400).total, 0));
  it("maps legacy estimates to one custom bundle line", () => {
    const lines = legacyEstimateLines({ furnace: { product: { selling_price: 2000, specifications: { our_cost: 1000 } }, comesWith: [] }, financeBundle: "b2" });
    assert.equal(lines.length, 1);
    assert.equal(lines[0].type, "custom_bundle");
    assert.equal(lines[0].unitPrice, 2000);
  });
});

describe("financing", () => {
  it("same-as-cash splits evenly", () => assert.equal(monthlyPayment(1200, 0, 12), 100));
  it("amortizes with APR", () => assert.equal(monthlyPayment(10000, 9.99, 60), 212.42));
  it("CC is financed amount times BDr", () => assert.equal(contractorCost(10000, 6.5), 650));
});

