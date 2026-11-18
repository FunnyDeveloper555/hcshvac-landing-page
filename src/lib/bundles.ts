import { productOurCost } from "@/lib/pricingRules";
import { PricedLine, sumLines } from "@/lib/bundleMath";

// deno-lint-ignore no-explicit-any
type P = any;
export interface Slot { product: P | null; comesWith: P[] }
export const emptySlot = (): Slot => ({ product: null, comesWith: [] });

export type PackageKey = "b2" | "b3" | "b4";
export const PACKAGE_LABELS: Record<PackageKey, string> = {
  b2: "Bundle 2 — Furnace & Coil",
  b3: "Bundle 3 — Furnace, Condenser & Coil",
  b4: "Bundle 4 — Complete System + Water Heater",
};

export interface BundleItems {
  furnace: Slot; condenser: Slot; coil: Slot; wh40: Slot; wh50: Slot;
  whChoice: "40" | "50"; comfort: P[]; addons: P[];
}
export const emptyBundleItems = (): BundleItems => ({
  furnace: emptySlot(), condenser: emptySlot(), coil: emptySlot(), wh40: emptySlot(), wh50: emptySlot(),
  whChoice: "40", comfort: [], addons: [],
});
export const toBundleItems = (v: unknown): BundleItems => {
  const d = (v && typeof v === "object" ? v : {}) as Partial<BundleItems>;
  const e = emptyBundleItems();
  const slot = (s: unknown): Slot => (s && typeof s === "object" ? { product: (s as Slot).product || null, comesWith: Array.isArray((s as Slot).comesWith) ? (s as Slot).comesWith : [] } : emptySlot());
  return {
    furnace: slot(d.furnace), condenser: slot(d.condenser), coil: slot(d.coil), wh40: slot(d.wh40), wh50: slot(d.wh50),
    whChoice: d.whChoice === "50" ? "50" : e.whChoice,
    comfort: Array.isArray(d.comfort) ? d.comfort : [], addons: Array.isArray(d.addons) ? d.addons : [],
  };
};

export const productLine = (p: P | null, useWi = false): PricedLine | null =>
  p ? { ourCost: productOurCost(p) ?? 0, listed: Number((useWi && p.wi_price) || p.selling_price || 0) } : null;

/** Totals for the three package tiers. Comfort accessories (WI= price) and add-ons count in every tier. */
export function bundleTotals(b: BundleItems): Record<PackageKey, PricedLine> {
  const s = (x: Slot) => [productLine(x.product), ...x.comesWith.map((c) => productLine(c))];
  const extras = [...b.comfort.map((c) => productLine(c, true)), ...b.addons.map((a) => productLine(a))];
  const wh = b.whChoice === "40" ? b.wh40 : b.wh50;
  return {
    b2: sumLines([...s(b.furnace), ...s(b.coil), ...extras]),
    b3: sumLines([...s(b.furnace), ...s(b.condenser), ...s(b.coil), ...extras]),
    b4: sumLines([...s(b.furnace), ...s(b.condenser), ...s(b.coil), ...s(wh), ...extras]),
  };
}

/** Products included in one package tier, for display. */
export function packageProducts(b: BundleItems, pkg: PackageKey): P[] {
  const s = (x: Slot) => [x.product, ...x.comesWith].filter(Boolean);
  const wh = b.whChoice === "40" ? b.wh40 : b.wh50;
  return [
    ...s(b.furnace), ...(pkg !== "b2" ? s(b.condenser) : []), ...s(b.coil), ...(pkg === "b4" ? s(wh) : []),
    ...b.comfort, ...b.addons,
  ];
}

// ---------- Estimate lines ----------
export type EstimateLineType = "product" | "bundle" | "custom_bundle";
export interface EstimateLine {
  id: string;
  type: EstimateLineType;
  title: string;
  description?: string;
  qty: number;
  unitOurCost: number;
  unitPrice: number;
  bundle_id?: string | null;
  package?: PackageKey;
  items?: BundleItems;
  product?: P;
  financed?: boolean;
  /** Finance plans offered for this line (one = chosen with the customer, several = options). */
  finance?: { key: string; label: string | null; months: number; apr: number; bdr: number }[];
}

export const lineTotal = (l: EstimateLine) => Math.round((l.qty || 0) * (l.unitPrice || 0) * 100) / 100;

export function estimateTotals(lines: EstimateLine[], discount: number) {
  const subtotal = Math.round(lines.reduce((t, l) => t + lineTotal(l), 0) * 100) / 100;
  const ourCost = Math.round(lines.reduce((t, l) => t + (l.qty || 0) * (l.unitOurCost || 0), 0) * 100) / 100;
  const disc = Math.min(Math.max(discount || 0, 0), subtotal);
  return { subtotal, ourCost, discount: disc, total: Math.round((subtotal - disc) * 100) / 100 };
}

/** Saved estimates from before lines existed become a single custom-bundle line. */
export function legacyEstimateLines(data: Record<string, unknown> | null | undefined): EstimateLine[] {
  if (!data) return [];
  if (Array.isArray(data.lines)) return data.lines as EstimateLine[];
  if (!data.furnace && !data.condenser && !data.coil) return [];
  const items = toBundleItems(data);
  const pkg = (["b2", "b3", "b4"].includes(String(data.financeBundle)) ? data.financeBundle : "b3") as PackageKey;
  const t = bundleTotals(items)[pkg];
  return [{ id: "legacy", type: "custom_bundle", title: PACKAGE_LABELS[pkg], qty: 1, unitOurCost: t.ourCost, unitPrice: t.listed, package: pkg, items }];
}
