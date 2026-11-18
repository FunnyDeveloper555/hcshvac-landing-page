export interface PricedLine { ourCost: number; listed: number }
export interface FinancePlan { months: number; apr: number; dealerFee: number; label?: string }

export const sumLines = (lines: (PricedLine | null | undefined)[]): PricedLine =>
  lines.reduce<PricedLine>((a, l) => (l ? { ourCost: a.ourCost + (l.ourCost || 0), listed: a.listed + (l.listed || 0) } : a), { ourCost: 0, listed: 0 });

/** Standard amortized monthly payment. APR in percent (0 = same-as-cash). */
export function monthlyPayment(principal: number, apr: number, months: number): number {
  if (!months || principal <= 0) return 0;
  const r = apr / 100 / 12;
  const p = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  return Math.round(p * 100) / 100;
}

/** Contractor cost (amount the bank shorts us): principal × dealer fee %. */
export const contractorCost = (principal: number, dealerFee: number) =>
  Math.round(principal * (dealerFee / 100) * 100) / 100;

export const DEFAULT_FINANCE_PLANS: FinancePlan[] = [24, 36, 48, 60, 72, 84, 96, 108, 120].map((m) => ({ months: m, apr: 9.99, dealerFee: 0 }));

export function estimateValidUntil(date: Date, days = 10): Date {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}
