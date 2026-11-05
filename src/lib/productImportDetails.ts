import { enrichDescription, type DescriptionProduct } from "../../supabase/functions/parse-products/description";

/** Keep measurements and uncategorized source details alongside normalized filter options. */
export function productImportDetails(product: DescriptionProduct, specs: Record<string, unknown>) {
  const enriched = enrichDescription({ ...product, specs });
  return { specifications: enriched.specs, height: enriched.height || null,
    width_size: enriched.width_size || null, length_depth: enriched.length_depth || null,
    weight: enriched.weight ?? null };
}