import { describe, it, expect } from "vitest";
import { monthlyPayment, contractorCost, sumLines, estimateValidUntil } from "../src/lib/bundleMath";

describe("bundle math", () => {
  it("amortizes a loan", () => { expect(monthlyPayment(10000, 9.99, 60)).toBe(212.42); });
  it("same-as-cash splits evenly", () => { expect(monthlyPayment(1200, 0, 12)).toBe(100); });
  it("contractor cost uses dealer fee", () => { expect(contractorCost(10000, 8.5)).toBe(850); });
  it("sums bundle lines, skipping empty slots", () => {
    expect(sumLines([{ ourCost: 100, listed: 180 }, null, { ourCost: 50, listed: 90 }])).toEqual({ ourCost: 150, listed: 270 });
  });
  it("estimate valid for 10 days", () => {
    expect(estimateValidUntil(new Date(2026, 10, 18)).getDate()).toBe(28);
  });
});
