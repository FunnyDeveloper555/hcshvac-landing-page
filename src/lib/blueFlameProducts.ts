/** Turns Products module rows into the shape the uploaded template's product scripts expect (HVAC_PRODUCTS). */
export interface ProductRow {
  id: string;
  product_name: string | null;
  brand_name?: string | null;
  category?: string | null;
  spot_text?: string | null;
  spot_images?: unknown;
  status?: string | null;
  is_part?: boolean | null;
  afue?: string | null;
  seer_rating?: string | null;
  tons_btu?: string | null;
  model_number?: string | null;
  poise?: string | null;
  stages?: string | null;
  width_size?: string | null;
  promo_title?: string | null;
  promo_description?: string | null;
  is_promo_active?: boolean | null;
  bullet_points?: string[] | null;
  alternative_product_url?: string | null;
  display_order?: number | null;
  product_variants?: { id: string; sku?: string | null; variant_name?: string | null; price?: number | null; is_active?: boolean | null }[] | null;
}

type Tpl = Record<string, unknown>;

export function templateCategory(r: ProductRow): string {
  const name = (r.product_name || "").toLowerCase();
  const cat = (r.category || "").toLowerCase();
  if (r.is_part) return "parts";
  if (name.includes("thermostat")) return "thermostats";
  if (name.includes("filter")) return "filters";
  if (/furnace|boiler/.test(name) || cat.endsWith("furnace only")) return "furnaces";
  return "systems";
}

export function toTemplateProduct(r: ProductRow, base?: Tpl): Tpl {
  const imgs = Array.isArray(r.spot_images) ? (r.spot_images as unknown[]).filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u)) : [];
  const variants = (r.product_variants || []).filter((v) => v.is_active !== false);
  const prices = variants.map((v) => Number(v.price)).filter((n) => n > 0);
  const caption = r.spot_text || r.product_name || "";
  const bullets = (r.bullet_points || []).filter(Boolean);
  const placeholders: Record<string, string> = {};
  bullets.slice(0, 4).forEach((b, i) => (placeholders[`TextPlaceHolder${i + 1}`] = b));
  const promo = r.is_promo_active !== false && r.promo_title ? r.promo_title : "";
  return {
    vendors: [],
    reviews: [],
    avgRating: 0,
    reviewCount: 0,
    ...(base || {}),
    id: r.id,
    name: r.product_name || "Product",
    brand: r.brand_name || "",
    category: templateCategory(r),
    originalCategory: r.category || "",
    tag: promo || r.afue || r.seer_rating || "",
    tagClass: (base?.tagClass as string) || (promo ? "tag-pink" : "tag-salmon"),
    efficiency: r.afue ? `${r.afue} AFUE` : r.seer_rating ? `${r.seer_rating} SEER` : "",
    btu: r.tons_btu || "",
    series: r.model_number || "",
    primaryImage: imgs[0] || "",
    primaryCaption: caption,
    thumbnails: imgs.map((img, i) => ({ img, label: i === 0 ? "Primary" : `Image ${i + 1}`, caption })),
    spot_text: r.spot_text || "",
    status: r.status,
    is_part: !!r.is_part,
    price_from: prices.length ? Math.min(...prices) : (base?.price_from as number) ?? 0,
    isDiscontinued: r.status === "discontinued_showing",
    discontinuedType: r.status === "discontinued_showing" ? (r.alternative_product_url ? "alternative" : "none") : undefined,
    variants: variants.map((v) => ({ id: v.id, sku: v.sku || "", name: v.variant_name || "", price: Number(v.price) || 0 })),
    promo_title: promo,
    promo_description: promo ? r.promo_description || "" : "",
    placeholders,
    specs: {
      airflow: r.poise ? `${r.poise} Airflow Orientation` : "",
      soundLevel: (base?.specs as Tpl | undefined)?.soundLevel || "",
      stages: r.stages || "",
      dimensions: r.width_size ? `${r.width_size} Width Housing` : "",
    },
  };
}

/** Replace the template's bundled demo product list with the given products. */
export function injectProducts(html: string, products: Tpl[]): string {
  const json = JSON.stringify(products).replace(/</g, "\\u003c");
  return html.replace(
    /<script src="[^"]*assets\/js\/products-data\.js"><\/script>/,
    () => `<script>var HVAC_PRODUCTS = ${json};</script>`,
  );
}
