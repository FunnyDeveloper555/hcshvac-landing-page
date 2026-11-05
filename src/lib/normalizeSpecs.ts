import type { SpecCategory } from "./productSpecs";

const norm = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9.]/g, "");

function matchOption(v: unknown, options: string[]): string | undefined {
  const n = norm(v);
  if (!n) return undefined;
  return options.find((o) => norm(o) === n)
    ?? options.find((o) => norm(o).startsWith(n) || n.startsWith(norm(o)))
    ?? options.find((o) => norm(o).includes(n) || n.includes(norm(o)));
}

/** Keeps only fields of the category and snaps AI values onto the exact dropdown/checkbox options. */
export function normalizeSpecs(cat: SpecCategory, raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of cat.fields) {
    const v = raw[f.key];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (f.kind === "multi" && f.options) {
      const vals = (Array.isArray(v) ? v : String(v).split(/[,/;]/)).map((x) => matchOption(x, f.options!)).filter(Boolean) as string[];
      if (vals.length) out[f.key] = [...new Set(vals)];
    } else if (f.kind === "select" && f.options) {
      const m = matchOption(Array.isArray(v) ? v[0] : v, f.options);
      if (m) out[f.key] = m;
    } else if (f.kind === "boolean") {
      out[f.key] = v === true || /^(yes|true|1)$/i.test(String(v));
    } else if (f.kind !== "vendor") out[f.key] = Array.isArray(v) ? v.join(", ") : String(v);
  }
  return out;
}
