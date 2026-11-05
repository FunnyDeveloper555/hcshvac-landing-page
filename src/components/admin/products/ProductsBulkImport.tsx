import { useState } from "react";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_SPEC_CATEGORIES, specCategory } from "@/lib/productSpecs";
import { normalizeSpecs } from "@/lib/normalizeSpecs";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Parsed {
  include: boolean; model_number: string; product_name: string; brand_name: string; spec_type: string;
  description?: string; price?: number; tons_btu?: string; seer_rating?: string; refrigerant_type?: string;
  voltage?: string; afue?: string; stages?: string; specs?: Record<string, unknown>; rawSpecs?: Record<string, unknown>; sheet: string; exists?: boolean;
}

const CHUNK = 50;
const NONE = "__none";

export default function ProductsBulkImport() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<{ name: string; rows: unknown[][]; use: boolean }[]>([]);
  const [items, setItems] = useState<Parsed[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState<"" | "parse" | "save">("");
  const [companyId, setCompanyId] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["bulk-companies"],
    queryFn: async () => (await supabase.from("companies").select("id, company_name").order("company_name")).data || [],
  });

  const onFile = async (f?: File) => {
    if (!f) return;
    setFileName(f.name); setItems([]);
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
    setSheets(wb.SheetNames.map((name) => {
      const rows = (XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: "" }) as unknown[][])
        .map((r) => r.map((c) => (typeof c === "string" ? c.trim() : c)))
        .filter((r) => r.some((c) => c !== "" && !/^[=*\-\s]+$/.test(String(c))));
      return { name, rows, use: rows.length > 1 };
    }));
  };

  const parse = async () => {
    const jobs: { sheet: string; rows: unknown[][] }[] = [];
    for (const s of sheets.filter((s) => s.use)) {
      const header = s.rows[0];
      for (let i = 1; i < s.rows.length; i += CHUNK) jobs.push({ sheet: s.name, rows: [header, ...s.rows.slice(i, i + CHUNK)] });
    }
    if (!jobs.length) return;
    setBusy("parse"); setProgress(0);
    const out: Parsed[] = [];
    let done = 0, failed = 0;
    const categories = PRODUCT_SPEC_CATEGORIES.map((c) => ({ name: c.name, fields: c.fields.filter((f) => f.kind !== "vendor") }));
    const run = async (j: (typeof jobs)[number]) => {
      const { data, error } = await supabase.functions.invoke("parse-products", { body: { ...j, categories } });
      if (error || data?.error) { failed++; toast({ title: `Couldn't read part of "${j.sheet}"`, description: data?.error || error?.message, variant: "destructive" }); }
      else out.push(...(data.products || []).map((p: any) => {
        const cat = specCategory(p.spec_type);
        const raw = { ...(p.specs || {}), vendor_sku_item_number: p.model_number, ...(p.price != null ? { our_cost: String(p.price) } : {}) };
        return { ...p, sheet: j.sheet, include: true, brand_name: p.brand_name || "", spec_type: cat ? cat.name : "", rawSpecs: raw, specs: cat ? normalizeSpecs(cat, raw) : {} };
      }));
      setProgress(Math.round((++done / jobs.length) * 100));
    };
    for (let i = 0; i < jobs.length; i += 4) await Promise.all(jobs.slice(i, i + 4).map(run));
    // flag models already in Products
    const models = [...new Set(out.map((p) => p.model_number).filter(Boolean))];
    const existing = new Set<string>();
    for (let i = 0; i < models.length; i += 200) {
      const { data } = await supabase.from("products").select("model_number").in("model_number", models.slice(i, i + 200));
      data?.forEach((d) => d.model_number && existing.add(d.model_number));
    }
    setItems(out.map((p) => ({ ...p, exists: existing.has(p.model_number), include: !existing.has(p.model_number) })));
    setBusy("");
    toast({ title: `Found ${out.length} products`, description: failed ? `${failed} part(s) failed — try again for those.` : "Review below, then import." });
  };

  const upd = (i: number, patch: Partial<Parsed>) => setItems((a) => a.map((p, k) => (k === i ? { ...p, ...patch } : p)));

  const save = async () => {
    const chosen = items.filter((p) => p.include && p.product_name);
    if (!chosen.length) return;
    setBusy("save");
    const rows = chosen.map((p) => {
      const cat = PRODUCT_SPEC_CATEGORIES.find((c) => c.name === p.spec_type);
      const specs: Record<string, unknown> = {};
      if (cat) Object.assign(specs, normalizeSpecs(cat, { ...(p.rawSpecs || {}), ...(p.specs || {}), vendor_sku_item_number: p.model_number, ...(p.price != null ? { our_cost: String(p.price) } : {}) }));
      return {
        company_id: companyId || null, product_name: p.product_name, model_number: p.model_number || null,
        brand_name: p.brand_name || null, spec_type: p.spec_type || null, specifications: specs as any,
        category: p.spec_type || null, spot_text: p.description || null,
        tons_btu: p.tons_btu || null, seer_rating: p.seer_rating || null, refrigerant_type: p.refrigerant_type || null,
        voltage: p.voltage || null, afue: p.afue || null, stages: p.stages || null,
        status: "active_not_showing" as const, invoice_unit_price_text: p.price != null ? String(p.price) : "",
      };
    });
    let ok = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from("products").insert(rows.slice(i, i + 200));
      if (error) { toast({ title: "Import stopped", description: error.message, variant: "destructive" }); break; }
      ok += rows.slice(i, i + 200).length;
    }
    setBusy("");
    if (ok) { toast({ title: `Imported ${ok} products`, description: "They're hidden from the website until you set them to showing." }); navigate("/admin/products/list"); }
  };

  const chosenCount = items.filter((p) => p.include).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Add Products</h1>
        <p className="text-muted-foreground">Upload any CSV or Excel price list. AI reads each row and fills the product fields for you to review.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">1. Upload file</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-6 hover:bg-muted/50">
            <Upload className="h-5 w-5" />
            <span>{fileName || "Choose a .csv, .xlsx or .xls file"}</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {sheets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sheets to read</p>
              {sheets.map((s, i) => (
                <label key={s.name} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={s.use} onCheckedChange={(v) => setSheets((a) => a.map((x, k) => (k === i ? { ...x, use: !!v } : x)))} />
                  {s.name} <span className="text-muted-foreground">({Math.max(0, s.rows.length - 1)} rows)</span>
                </label>
              ))}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Select value={companyId || NONE} onValueChange={(v) => setCompanyId(v === NONE ? "" : v)}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Company (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No company</SelectItem>
                    {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={parse} disabled={!!busy || !sheets.some((s) => s.use)}>
                  {busy === "parse" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Read with AI
                </Button>
              </div>
              {busy === "parse" && <Progress value={progress} />}
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">2. Review ({chosenCount} of {items.length} selected)</CardTitle>
            <Button onClick={save} disabled={!!busy || !chosenCount}>
              {busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Import {chosenCount} products
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                <th className="p-2"><Checkbox checked={chosenCount === items.length} onCheckedChange={(v) => setItems((a) => a.map((p) => ({ ...p, include: !!v })))} /></th>
                <th className="p-2">Model</th><th className="p-2">Product name</th><th className="p-2">Brand</th>
                <th className="p-2">Product Type</th><th className="p-2">Price</th><th className="p-2">Product filter fields</th>
              </tr></thead>
              <tbody>
                {items.map((p, i) => (
                  <tr key={i} className="border-b align-top">
                    <td className="p-2"><Checkbox checked={p.include} onCheckedChange={(v) => upd(i, { include: !!v })} /></td>
                    <td className="p-2 min-w-40"><Input value={p.model_number} onChange={(e) => upd(i, { model_number: e.target.value })} />
                      {p.exists && <p className="mt-1 text-xs text-destructive">Already in Products</p>}</td>
                    <td className="p-2 min-w-72"><Input value={p.product_name} onChange={(e) => upd(i, { product_name: e.target.value })} /></td>
                    <td className="p-2 min-w-32"><Input value={p.brand_name} onChange={(e) => upd(i, { brand_name: e.target.value })} /></td>
                    <td className="p-2 min-w-40">
                      <Select value={p.spec_type || NONE} onValueChange={(v) => { const c = specCategory(v); upd(i, { spec_type: c ? c.name : "", specs: c ? normalizeSpecs(c, { ...(p.rawSpecs || {}), ...(p.specs || {}) }) : {} }); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Other</SelectItem>
                          {PRODUCT_SPEC_CATEGORIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 min-w-24"><Input type="number" value={p.price ?? ""} onChange={(e) => upd(i, { price: e.target.value === "" ? undefined : Number(e.target.value) })} /></td>
                    <td className="p-2 min-w-80 text-xs">
                      {(() => { const c = specCategory(p.spec_type); if (!c) return <span className="text-muted-foreground">No filter fields for Other</span>;
                        const filled = c.fields.filter((f) => p.specs?.[f.key] != null);
                        return <><p className="mb-1 font-medium">{filled.length} of {c.fields.length} filter fields filled</p>
                          {filled.map((f) => { const v = p.specs![f.key]; return <div key={f.key}><span className="text-muted-foreground">{f.label}:</span> {Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</div>; })}</>; })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
