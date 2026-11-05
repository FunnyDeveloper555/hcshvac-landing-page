/** Explicit labeled measurements only: never infer dimensions from model codes. */
export function descriptionDetails(description: string): Record<string, string> {
  const out: Record<string, string> = {};
  const labels: Record<string, string> = { height: "height", diameter: "diameter", dia: "diameter", width: "width", depth: "depth", length: "depth", weight: "weight", mfd: "capacitance", volts: "voltage" };
  const pattern = /\b(Height|Diameter|Dia\.?|Width|Depth|Length|Weight|Mfd|Volts)\s*:\s*(.+?)(?=\s+-\s*(?:\t|[A-Za-z])|\s*[;,\n\t]|$)/gi;
  for (const match of description.matchAll(pattern)) {
    const key = labels[match[1].toLowerCase().replace(/\.$/, "")];
    const value = match[2].trim();
    if (key && value) out[key] = value;
  }
  return out;
}

export interface DescriptionProduct {
  description?: string;
  height?: string;
  width_size?: string;
  length_depth?: string;
  weight?: number;
  specs?: Record<string, unknown>;
}

export function enrichDescription<T extends DescriptionProduct>(product: T): T {
  const details = descriptionDetails(product.description || "");
  const specs = { ...(product.specs || {}), ...details };
  // Product weight is pounds; retain other units in specs without silently converting them.
  const weightMatch = details.weight?.match(/^([\d.]+)\s*(?:lb|lbs|pounds?)\.?$/i);
  return { ...product, specs,
    height: details.height || product.height || (typeof specs.height === "string" ? specs.height : undefined),
    width_size: details.width || product.width_size || (typeof specs.width === "string" ? specs.width : undefined),
    length_depth: details.depth || product.length_depth || (typeof specs.depth === "string" ? specs.depth : undefined),
    weight: weightMatch ? Number(weightMatch[1]) : product.weight,
  };
}