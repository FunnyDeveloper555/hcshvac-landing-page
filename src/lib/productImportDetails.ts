import { enrichDescription, type DescriptionProduct } from "../../supabase/functions/parse-products/description";
import type { Json } from "@/integrations/supabase/types";

function jsonValue(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(jsonValue);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, jsonValue(v)]));
  return null;
}

/** Keep measurements and uncategorized source details alongside normalized filter options. */
export function productImportDetails(product: DescriptionProduct, specs: Record<string, unknown>) {
  const enriched = enrichDescription({ ...product, specs });
  const specifications: Record<string, Json> = Object.fromEntries(Object.entries(enriched.specs || {}).map(([key, value]) => [key, jsonValue(value)]));
  return { specifications, height: enriched.height || null,
    width_size: enriched.width_size || null, length_depth: enriched.length_depth || null,
    weight: enriched.weight ?? null };
}