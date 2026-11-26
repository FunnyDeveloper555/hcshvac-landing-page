import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { ImagePlus, Plus, Trash2, WandSparkles } from "lucide-react";
import { asObject, generatedProductName, type FormElement, type FormValues } from "@/lib/productForms";

interface Props { elements: FormElement[]; values: FormValues; onChange: (v: FormValues) => void; typeName: string }
export function ProductFormFields({ elements, values, onChange, typeName }: Props) {
  const [picker, setPicker] = useState<{ key: string; index?: number } | null>(null);
  const [vendorState, setVendorState] = useState("all");
  const { data: brands = [] } = useQuery({ queryKey: ["products-brands"], staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from("brands").select("id,name").eq("is_active", true).order("name"); if (error) throw error; return data || [];
  } });
  const { data: vendors = [] } = useQuery({ queryKey: ["form-maker-vendors"], staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from("vendors").select("id,vendor_name,state").order("vendor_name"); if (error) throw error; return data || [];
  } });
  const set = (key: string, value: unknown) => onChange({ ...values, [key]: value });
  const vendorOptions = vendors.filter(v => vendorState === "all" || (v.state || "").toUpperCase() === vendorState);
  const select = (id: string, value: unknown, options: string[], onSelect: (v: string) => void) => {
    const current = typeof value === "string" ? value : "";
    return <Select value={current || "__none"} onValueChange={v => onSelect(v === "__none" ? "" : v)}>
      <SelectTrigger id={id}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>
        <SelectItem value="__none">—</SelectItem>
        {[...new Set([...options, ...(current ? [current] : [])])].filter(Boolean).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>;
  };
  const render = (f: FormElement) => {
    const v = values[f.key]; const id = `field-${f.key}`;
    if (f.key === "product_name") return <div className="flex flex-wrap items-center gap-2"><Input id={id} className="min-w-[140px] flex-1" value={String(v ?? "")} onChange={e => set(f.key, e.target.value)} required /><Button type="button" size="sm" variant="outline" className="shrink-0" title="Generate Name" onClick={() => set("product_name", generatedProductName(typeName, values))}><WandSparkles className="h-4 w-4 mr-2" />Generate Name</Button></div>;
    if (f.kind === "generator") return <Button type="button" variant="outline" onClick={() => set("product_name", generatedProductName(typeName, values))}><WandSparkles className="h-4 w-4 mr-2" />Auto-Generate Name</Button>;
    if (f.kind === "brand") return <Select value={String(values.brand_id || "__none")} onValueChange={id => {
      const brand = brands.find(b => b.id === id); onChange({ ...values, brand_id: brand?.id || "", brand_name: brand?.name || "" });
    }}><SelectTrigger id={id}><SelectValue placeholder="Select brand" /></SelectTrigger><SelectContent>
      <SelectItem value="__none">{!values.brand_id && values.brand_name ? String(values.brand_name) : "—"}</SelectItem>
      {values.brand_id && !brands.some(b => b.id === values.brand_id) && <SelectItem value={String(values.brand_id)}>{String(values.brand_name || "Previous brand")}</SelectItem>}
      {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
    </SelectContent></Select>;
    if (f.kind === "vendor") return select(id, v, vendorOptions.map(o => o.vendor_name), val => set(f.key, val));
    if (f.kind === "select") return select(id, v, f.options || [], val => set(f.key, val));
    if (f.kind === "multi") return <div className="flex flex-wrap gap-3 pt-2">{(f.options || []).map(option => <label key={option} className="flex items-center gap-2 text-sm"><Checkbox checked={Array.isArray(v) && v.includes(option)} onCheckedChange={checked => {
      const previous = Array.isArray(v) ? v : []; set(f.key, checked === true ? [...previous, option] : previous.filter(o => o !== option));
    }} />{option}</label>)}</div>;
    if (f.kind === "radio") return <div className="flex flex-wrap gap-3 pt-2" role="radiogroup" aria-label={f.label}>{(f.options || []).map(option => <label key={option} className="flex items-center gap-2 text-sm"><input type="radio" name={id} value={option} checked={v === option} onChange={() => set(f.key, option)} />{option}</label>)}</div>;
    if (f.kind === "boolean") return <div className="pt-2"><Checkbox id={id} checked={v === true || v === "Yes"} onCheckedChange={checked => set(f.key, checked === true)} /></div>;
    if (f.kind === "textarea") return <Textarea id={id} value={String(v || "")} onChange={e => set(f.key, e.target.value)} rows={4} />;
    if (f.kind === "bullets") return <Textarea id={id} value={Array.isArray(v) ? v.join("\n") : String(v || "")} onChange={e => set(f.key, e.target.value.split("\n"))} rows={4} />;
    if (f.kind === "image" || f.kind === "images") {
      const images: string[] = f.kind === "image" ? (v ? [String(v)] : []) : (Array.isArray(v) ? v.map(String) : []);
      return <div className="flex flex-wrap gap-3">
        {images.map((url, i) => <div key={`${url}-${i}`} className="relative w-28 aspect-square border rounded-md overflow-hidden bg-muted"><img src={url} alt={`${typeName} ${f.kind === "image" ? "main image" : `thumbnail ${i + 1}`}`} className="h-full w-full object-contain" /><Button aria-label={`Remove ${f.label} ${i + 1}`} title="Remove image" size="icon" variant="secondary" className="absolute right-1 top-1 h-7 w-7" onClick={() => set(f.key, f.kind === "image" ? "" : images.filter((_, n) => n !== i))}><Trash2 className="h-3 w-3" /></Button></div>)}
        <Button type="button" variant="outline" onClick={() => setPicker({ key: f.key, index: f.kind === "images" ? images.length : undefined })}><ImagePlus className="h-4 w-4 mr-2" />{f.kind === "image" ? "Choose Main Image" : "Add Another Thumbnail"}</Button>
      </div>;
    }
    if (f.kind === "costs") {
      const costs = Array.isArray(v) ? v.map(asObject) : [{ supplier_name: "", our_cost: values.our_cost || "" }];
      const changeCost = (index: number, patch: FormValues) => set(f.key, costs.map((cost, i) => i === index ? { ...cost, ...patch } : cost));
      return <div className="space-y-3">{costs.map((cost, i) => <div key={i} className="grid sm:grid-cols-[1fr_160px_36px] gap-2 items-end">
        <div className="space-y-1"><Label htmlFor={`supplier-${i}`}>Vendor {i + 1}</Label>{select(`supplier-${i}`, cost.supplier_name, vendorOptions.map(o => o.vendor_name), val => changeCost(i, { supplier_name: val }))}</div>
        <div className="space-y-1"><Label htmlFor={`cost-${i}`}>Our Cost</Label><Input id={`cost-${i}`} type="number" min="0" step="0.01" value={String(cost.our_cost ?? "")} onChange={e => changeCost(i, { our_cost: e.target.value })} /></div>
        <Button type="button" size="icon" variant="ghost" aria-label={`Remove vendor ${i + 1}`} title="Remove vendor" onClick={() => set(f.key, costs.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button>
      </div>)}<Button type="button" variant="outline" size="sm" onClick={() => set(f.key, [...costs, { supplier_name: "", our_cost: "" }])}><Plus className="h-4 w-4 mr-2" />Add Vendor {costs.length + 1} (Our Cost)</Button></div>;
    }
    return <Input id={id} type={f.kind === "number" ? "number" : f.kind === "url" ? "url" : "text"} step={f.kind === "number" ? "0.01" : undefined} value={String(v ?? "")} onChange={e => set(f.key, e.target.value)} required={f.key === "product_name"} />;
  };
  // Keep the Form Maker layout order: consecutive elements of one section share a heading.
  const displayElements = elements.some(f => f.key === "product_name") ? elements.filter(f => f.kind !== "generator") : elements;
  const groups = displayElements.reduce<{ section: string; items: typeof elements }[]>((acc, f) => { const last = acc[acc.length - 1]; if (last && last.section === f.section) last.items.push(f); else acc.push({ section: f.section, items: [f] }); return acc; }, []);
  return <>
    {elements.some(f => f.kind === "vendor" || f.kind === "costs") && <div className="max-w-xs space-y-2"><Label htmlFor="form-vendor-state">Vendor State</Label>{select("form-vendor-state", vendorState, ["all", ...new Set(vendors.map(v => (v.state || "").toUpperCase()).filter(Boolean))], setVendorState)}</div>}
    {groups.map(({ section, items }, gi) => <section key={`${section}-${gi}`} className="space-y-4 border-t pt-5"><h3 className="font-semibold text-lg">{section}</h3><div className="grid md:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(f => <div key={f.key} className={`space-y-2 min-w-0 ${["textarea", "multi", "costs", "bullets", "images", "image"].includes(f.kind) ? "md:col-span-3 xl:col-span-4" : f.key === "product_name" ? "md:col-span-2" : ""}`}><Label htmlFor={`field-${f.key}`}>{f.label}{f.key === "product_name" ? " *" : ""}</Label>{render(f)}</div>)}
    </div></section>)}
    <FileManagerPicker open={!!picker} onOpenChange={open => { if (!open) setPicker(null); }} accept="image/*" title="Choose Product Image" onSelect={url => {
      if (!picker) return;
      if (picker.index != null) set(picker.key, [...(Array.isArray(values[picker.key]) ? values[picker.key] as unknown[] : []), url]); else set(picker.key, url);
      setPicker(null);
    }} />
  </>;
}