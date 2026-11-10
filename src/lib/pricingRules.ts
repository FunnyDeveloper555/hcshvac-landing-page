export interface PricingRule {
  id?: string;
  company_id?: string | null;
  name: string;
  product_type?: string | null; // null = applies to all product types
  markup: number;
  labor_cost: number;
  round_to: number; // 0 = no rounding, e.g. 5 rounds up to nearest $5
  is_active?: boolean;
}

/** Selling Price = (Our Cost × Markup) + Labor, optionally rounded up. */
export function computeSellingPrice(ourCost: number, rule: Pick<PricingRule, "markup" | "labor_cost" | "round_to">): number {
  const raw = Number(ourCost || 0) * Number(rule.markup || 0) + Number(rule.labor_cost || 0);
  const step = Number(rule.round_to || 0);
  const value = step > 0 ? Math.ceil(raw / step - 1e-9) * step : raw;
  return Math.round(value * 100) / 100;
}

/** Most specific active rule wins: company + type, then type, then company-wide, then global default. */
export function pickRule(rules: PricingRule[], productType?: string | null, companyId?: string | null): PricingRule | undefined {
  const active = rules.filter((r) => r.is_active !== false);
  const score = (r: PricingRule) => {
    if (r.product_type && r.product_type !== productType) return -1;
    if (r.company_id && r.company_id !== companyId) return -1;
    return (r.product_type ? 2 : 0) + (r.company_id ? 1 : 0);
  };
  return active
    .map((r) => ({ r, s: score(r) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)[0]?.r;
}
