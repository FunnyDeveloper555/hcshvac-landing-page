export type Op = "+" | "-" | "*" | "/";

/** One formula line: (x) [value] op [title]. The op joins this line to the next enabled line. */
export interface FormulaTerm {
  enabled: boolean;
  title: string;
  value: number;
  op: Op;
  isCost?: boolean; // value comes from the product's Our Cost
}

export interface PricingRule {
  id?: string;
  company_id?: string | null;
  name: string;
  product_type?: string | null; // null = applies to all product types
  markup: number;
  labor_cost: number;
  round_to: number; // 0 = no rounding
  is_active?: boolean;
  terms?: FormulaTerm[] | null;
}

export const defaultTerms = (markup = 1.8, labor = 0): FormulaTerm[] => [
  { enabled: true, title: "OC", value: 0, op: "*", isCost: true },
  { enabled: true, title: "MU", value: markup, op: "+" },
  { enabled: true, title: "Labor", value: labor, op: "+" },
  { enabled: false, title: "", value: 0, op: "+" },
  { enabled: false, title: "", value: 0, op: "+" },
];

export const termsOf = (rule: Pick<PricingRule, "markup" | "labor_cost" | "terms">): FormulaTerm[] =>
  rule.terms && rule.terms.length ? rule.terms : defaultTerms(Number(rule.markup || 0), Number(rule.labor_cost || 0));

/** Evaluates enabled lines strictly top to bottom (left to right), e.g. OC * MU + Labor = (OC*MU)+Labor. */
export function evaluateTerms(terms: FormulaTerm[], ourCost: number): number {
  const lines = terms.filter((t) => t.enabled);
  if (!lines.length) return 0;
  const val = (t: FormulaTerm) => (t.isCost ? Number(ourCost || 0) : Number(t.value || 0));
  let result = val(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const op = lines[i - 1].op;
    const v = val(lines[i]);
    if (op === "+") result += v;
    else if (op === "-") result -= v;
    else if (op === "*") result *= v;
    else result = v === 0 ? 0 : result / v;
  }
  return result;
}

export const describeTerms = (terms: FormulaTerm[]) => {
  const lines = terms.filter((t) => t.enabled);
  return lines.map((t, i) => `${t.isCost ? "OC" : `${t.title || "?"}(${t.value})`}${i < lines.length - 1 ? ` ${t.op === "*" ? "×" : t.op === "/" ? "÷" : t.op} ` : ""}`).join("");
};

export function computeSellingPrice(ourCost: number, rule: Pick<PricingRule, "markup" | "labor_cost" | "round_to" | "terms">): number {
  const raw = evaluateTerms(termsOf(rule), ourCost);
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
  return active.map((r) => ({ r, s: score(r) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s)[0]?.r;
}

/** Our Cost for a product: specifications.our_cost first, then the imported invoice unit price. Null when unknown. */
export function productOurCost(p: { specifications?: unknown; invoice_unit_price_text?: string | null }): number | null {
  const specs = (p.specifications && typeof p.specifications === "object" ? p.specifications : {}) as Record<string, unknown>;
  for (const raw of [specs.our_cost, p.invoice_unit_price_text]) {
    const n = Number(String(raw ?? "").replace(/[$,\s]/g, ""));
    if (raw != null && String(raw).trim() !== "" && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}
