import { PRODUCT_SPEC_CATEGORIES, formatAfue, specCategory, visibleSpecFields } from "./productSpecs";
import type { Json, TablesInsert } from "@/integrations/supabase/types";

export type FieldKind = "text" | "textarea" | "number" | "select" | "radio" | "multi" | "boolean" | "brand" | "vendor" | "image" | "images" | "bullets" | "costs" | "generator" | "url";
export interface FormElement { key: string; label: string; kind: FieldKind; options?: string[]; column?: string; section: string }
export interface ProductTypeForm { id?: string; name: string; fields: string[]; is_active: boolean; applicable_areas?: string[] }
export const APPLICABLE_AREAS = ["HVAC Equipment", "Plumbing", "Electrical", "HVAC Parts", "Plumbing Parts", "Other"];
/** Returns the chosen elements in the saved layout order (fields array order). */
export function orderedElements(all: FormElement[], keys: string[]): FormElement[] {
  const byKey = new Map(all.map(e => [e.key, e]));
  return keys.map(k => byKey.get(k)).filter((e): e is FormElement => !!e);
}
export function moveKey(keys: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= keys.length || to >= keys.length) return keys;
  const next = [...keys]; const [k] = next.splice(from, 1); next.splice(to, 0, k); return next;
}
export type FormValues = Record<string, unknown>;
const field = (key: string, label: string, kind: FieldKind = "text", section = "Identification", column?: string, options?: string[]): FormElement => ({ key, label, kind, section, column, options });

export const STANDARD_ELEMENTS: FormElement[] = [
  field("item_name", "Item Name"), field("model_number", "Model Number", "text", "Identification", "model_number"),
  field("vendor_sku_item_number", "SKU"), field("vendor", "Vendor / Supplier", "vendor"),
  field("product_name", "Product Name", "text", "Identification", "product_name"), field("brand_name", "Brand Name", "brand", "Identification", "brand_name"),
  field("series_number", "Series Number"), field("name_generator", "Name Generator", "generator"),
  field("location_type", "Location Type", "multi", "Product Filter Category", undefined, ["Residential", "Commercial", "Light Commercial", "Industrial", "Mobile Home Unit"]),
  field("voltage", "Voltage", "select", "Product Filter Category", "voltage", ["N/A", "24v", "120v", "208/230", "208/230/3", "220/240", "220/440/3", "277/460/3", "277/480/3", "460/480/3"]),
  field("a2l_compliant", "A2L Compliant", "boolean", "Product Filter Category"), field("energy_star", "Energy Star", "boolean", "Product Filter Category"),
  field("refrigerant_type", "Refrigerant Type", "select", "Product Filter Category", "refrigerant_type", ["R-410A", "R-32", "R-454B", "R-22", "Other"]),
  field("input_btu_s", "BTU’s Heating", "text", "Specifications"), field("btu_s", "BTU’s Cooling", "text", "Specifications"),
  field("tonnage", "Tons Cooling", "text", "Specifications"), field("blower_tons", "Tons Blower", "text", "Specifications"),
  field("height", "Height", "text", "Model & Dimensions", "height"), field("length_depth", "Length / Depth", "text", "Model & Dimensions", "length_depth"),
  field("width_size", "Width", "text", "Model & Dimensions", "width_size"), field("weight", "Weight (lbs)", "number", "Model & Dimensions", "weight"),
  field("amps", "Amps", "text", "Specifications"), field("high_temp", "High Temp", "text", "Specifications"), field("low_temp", "Low Temp", "text", "Specifications"),
  field("specs_detail", "Specs Detail", "textarea", "Specifications"), field("gallons_capacity_size", "Gallons", "text", "Specifications"),
  field("flow_rate", "Flow Rate", "text", "Specifications"), field("gpm", "GPM", "text", "Specifications"), field("color", "Color", "text", "Specifications"),
  field("labor_warranty", "Labor Warranty", "text", "Warranty", "labor_warranty"), field("parts_warranty", "Manufacturer Warranty", "text", "Warranty", "parts_warranty"),
  field("warranty_disclaimer", "Warranty Disclaimer Statement", "textarea", "Warranty"), field("installation_only_statement", "Installation Only Product Statement", "textarea", "Warranty"),
  field("not_retail_statement", "We Are Not Internet or Retail Sales Statement", "textarea", "Warranty"),
  field("vendor_costs", "Vendor 1 (Our Cost) / Add Vendor 2 / Add Vendor 3", "costs", "Suppliers & Pricing"),
  field("our_cost", "Our Cost", "number", "Suppliers & Pricing"),
  field("spot_text", "Full Description", "textarea", "Content", "spot_text"), field("bullet_points", "Bullet Points Box", "bullets", "Content", "bullet_points"),
  field("main_image", "Product Image (Main)", "image", "Images"), field("thumbnail_images", "Product Image (Thumbnail) / Add Another", "images", "Images"),
];

export const DEFAULT_TYPE_NAMES = [...new Set([...PRODUCT_SPEC_CATEGORIES.map(c => c.name), "Air Conditioner", "Pumps"])];
export function masterElements(custom: FormElement[] = []): FormElement[] {
  const map = new Map(STANDARD_ELEMENTS.map(f => [f.key, f]));
  for (const c of PRODUCT_SPEC_CATEGORIES) for (const f of visibleSpecFields(c)) {
    if (!map.has(f.key)) map.set(f.key, { ...f, section: "Specifications", column: ["afue", "poise", "stages", "seer_rating"].includes(f.key) ? f.key : undefined });
  }
  for (const f of custom) map.set(f.key, f);
  return [...map.values()];
}
export function defaultForm(name: string): ProductTypeForm {
  const base = ["item_name", "model_number", "vendor_sku_item_number", "vendor", "product_name", "brand_name", "series_number", "location_type", "voltage", "main_image"];
  const fields = name === "Pumps" ? [...base, "gpm"] : [...base, "name_generator", ...visibleSpecFields(specCategory(name)).map(f => f.key), ...(name === "Air Handler" ? ["refrigerant_type", "a2l_compliant"] : []), "height", "length_depth", "width_size", "weight", "parts_warranty", "labor_warranty", "spot_text", "bullet_points", "thumbnail_images"];
  // Refrigerant never applies to furnaces (gas heat only); it belongs to Air Handlers/coils/condensers.
  const filtered = name === "Furnace" ? fields.filter(k => !/refrigerant/.test(k)) : fields;
  return { name, fields: [...new Set(filtered)], is_active: true };
}
export function readFieldKeys(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((k): k is string => typeof k === "string"))] : [];
}
export function asObject(value: unknown): FormValues {
  return value && typeof value === "object" && !Array.isArray(value) ? value as FormValues : {};
}
export function valuesFromProduct(product: FormValues): FormValues {
  const specs = asObject(product.specifications);
  const images = Array.isArray(product.spot_images) ? product.spot_images : [];
  const values: FormValues = { ...specs, ...product, main_image: images[0] || "", thumbnail_images: images.slice(1) };
  for (const element of masterElements()) {
    if (element.column && (product[element.column] == null || product[element.column] === "") && specs[element.key] != null) values[element.key] = specs[element.key];
  }
  if (values.afue) values.afue = formatAfue(values.afue);
  return values;
}
/** Only selected controls write catalog columns; hidden attributes survive edits. */
export function productFormPatch(typeName: string, elements: FormElement[], values: FormValues, oldSpecs: unknown = {}): TablesInsert<"products"> {
  const specs = { ...asObject(oldSpecs) };
  const payload: FormValues = { spec_type: typeName, company_id: values.company_id || null, product_name: String(values.product_name || "").trim(), status: values.status || "active_not_showing", category_id: values.category_id || null };
  for (const element of elements) {
    if (["generator", "image", "images"].includes(element.kind)) continue;
    const value = values[element.key];
    if (element.column) payload[element.column] = element.kind === "number" ? (value === "" || value == null ? null : Number(value)) : value ?? null;
    else specs[element.key] = value ?? (element.kind === "boolean" ? false : "");
  }
  if (payload.afue) payload.afue = formatAfue(payload.afue);
  if (specs.afue) specs.afue = formatAfue(specs.afue);
  if (elements.some(f => f.kind === "brand")) payload.brand_id = values.brand_id || null;
  if (elements.some(f => f.kind === "image" || f.kind === "images")) payload.spot_images = [values.main_image, ...(Array.isArray(values.thumbnail_images) ? values.thumbnail_images : [])].filter(Boolean);
  if (elements.some(f => f.kind === "costs")) {
    const costs = Array.isArray(values.vendor_costs) ? values.vendor_costs.map(asObject) : [];
    specs.our_cost = costs[0]?.our_cost ?? specs.our_cost ?? null;
    specs.vendor = costs[0]?.supplier_name || specs.vendor || "";
  }
  // JSONB specifications intentionally preserve unselected and legacy attributes.
  payload.specifications = specs as Json;
  return payload as TablesInsert<"products">;
}
const firstOf = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
export function generatedProductName(typeName: string, values: FormValues): string {
  if (typeName.trim().toLowerCase() === "furnace") {
    // Client furnace pattern: [AFUE%] [Brand] [Model] [Location] [Stages] [Poise] Furnace
    const afue = values.afue ? formatAfue(String(values.afue)) : "";
    return [afue, values.brand_name, values.model_number, firstOf(values.location_type), firstOf(values.stages), firstOf(values.poise), "Furnace"]
      .map(v => (v == null ? "" : String(v).trim())).filter(Boolean).join(" ");
  }
  const location = Array.isArray(values.location_type) ? values.location_type[0] : values.location_type;
  return [values.brand_name, values.model_number, location, values.tons_btu || values.tonnage || values.input_btu_s || values.btu_s || values.gallons_capacity_size, values.refrigerant_type, values.seer_rating, typeName].filter(Boolean).join(" ");
}