import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Trash2, X } from "lucide-react";
import { BundleItems, PACKAGE_LABELS, PackageKey, Slot, bundleTotals, emptySlot, productLine } from "@/lib/bundles";

export const PRODUCT_COLS = "id, product_name, model_number, spot_images, bullet_points, specifications, invoice_unit_price_text, selling_price, wi_price, spec_type, category, is_part";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type P = any;
export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const line = productLine;

export function ProductPicker({ onPick, placeholder = "SKU / model / name", seeAllTerm }: { onPick: (p: P) => void; placeholder?: string; seeAllTerm?: string }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<P[]>([]);
  const [allOpen, setAllOpen] = useState(false);
  const [all, setAll] = useState<P[]>([]);
  useEffect(() => {
    const t = q.trim().replace(/[%,()]/g, "");
    if (t.length < 2) { setRes([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase.from("products").select(PRODUCT_COLS)
        .or(`model_number.ilike.%${t}%,product_name.ilike.%${t}%,brand_name.ilike.%${t}%`).limit(10);
      setRes(data || []);
    }, 250);
    return () => clearTimeout(h);
  }, [q]);
  const openAll = async () => {
    setAllOpen(true);
    let qq = supabase.from("products").select(PRODUCT_COLS).order("product_name").limit(200);
    if (seeAllTerm) qq = qq.or(`category.ilike.%${seeAllTerm}%,spec_type.ilike.%${seeAllTerm}%,part_category.ilike.%${seeAllTerm}%,product_name.ilike.%${seeAllTerm}%`);
    const { data } = await qq; setAll(data || []);
  };
  const pick = (p: P) => { onPick(p); setQ(""); setRes([]); setAllOpen(false); };
  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
        </div>
        {seeAllTerm !== undefined && <Button type="button" variant="outline" size="sm" className="h-10" onClick={openAll}>See All</Button>}
      </div>
      {res.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md max-h-64 overflow-auto">
          {res.map((p) => (
            <button key={p.id} type="button" onClick={() => pick(p)} className="block w-full px-3 py-2 text-left text-sm hover:bg-muted">
              <span className="font-medium">{p.model_number || "—"}</span> · {p.product_name}
            </button>
          ))}
        </div>
      )}
      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Products{seeAllTerm ? `: ${seeAllTerm}` : ""}</DialogTitle></DialogHeader>
          {all.length === 0 ? <p className="text-sm text-muted-foreground">No matching products.</p> : all.map((p) => (
            <button key={p.id} type="button" onClick={() => pick(p)} className="flex w-full justify-between gap-4 border-b px-2 py-2 text-left text-sm hover:bg-muted">
              <span><span className="font-medium">{p.model_number || "—"}</span> · {p.product_name}</span>
              <span className="text-muted-foreground whitespace-nowrap">{p.selling_price ? money(Number(p.selling_price)) : "no price"}</span>
            </button>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriceCells({ p, useWi }: { p: P; useWi?: boolean }) {
  const l = line(p, useWi)!;
  return (
    <div className="text-sm text-right whitespace-nowrap">
      <div className="text-muted-foreground">Our Cost {money(l.ourCost)}</div>
      <div className="font-semibold">{useWi && p.wi_price ? "WI= " : "Listed "}{money(l.listed)}</div>
    </div>
  );
}

export function ProductRow({ p, onRemove, useWi }: { p: P; onRemove: () => void; useWi?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
      <div className="text-sm"><span className="font-medium">{p.model_number || "—"}</span> · {p.product_name}</div>
      <div className="flex items-center gap-2"><PriceCells p={p} useWi={useWi} />
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}><X className="h-4 w-4" /></Button></div>
    </div>
  );
}


function EquipmentSlot({ title, slot, onChange }: { title: string; slot: Slot; onChange: (s: Slot) => void }) {
  const p = slot.product;
  const bullets: string[] = p ? (p.bullet_points?.length ? p.bullet_points : Object.entries(p.specifications || {})
    .filter(([k, v]) => v && typeof v !== "object" && !/cost|price|sku|vendor/i.test(k)).slice(0, 6).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)) : [];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!p ? <ProductPicker onPick={(x) => onChange({ ...slot, product: x })} /> : (
          <div className="flex gap-4">
            {p.spot_images?.[0] ? <img src={p.spot_images[0]} alt={p.product_name} className="h-24 w-24 object-contain rounded bg-muted" /> : <div className="h-24 w-24 rounded bg-muted" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{p.product_name}</div>
              <div className="text-xs text-muted-foreground">Model {p.model_number || "—"}</div>
              <ul className="mt-1 list-disc pl-5 text-sm">{bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
            <div className="flex flex-col items-end gap-2"><PriceCells p={p} />
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(emptySlot())}><Trash2 className="h-4 w-4 mr-1" />Change</Button></div>
          </div>
        )}
        {p && (
          <div className="space-y-2">
            <Label>This {title} Comes With:</Label>
            {slot.comesWith.map((c, i) => <ProductRow key={c.id + i} p={c} onRemove={() => onChange({ ...slot, comesWith: slot.comesWith.filter((_, j) => j !== i) })} />)}
            <ProductPicker placeholder="Add included item" seeAllTerm="" onPick={(x) => onChange({ ...slot, comesWith: [...slot.comesWith, x] })} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}


const ADDON_GROUPS = ["Plenum", "Intake", "Valve", "Pipe", "Whip", "Disconnect", "Thermostat Wire", "Pad", "Filter"];

/** Shared bundle builder used by Bundle Maker and the estimate's custom bundle. */
export function BundleEditor({ value, onChange, pkg, onPkgChange }: {
  value: BundleItems; onChange: (v: BundleItems) => void; pkg?: PackageKey; onPkgChange?: (p: PackageKey) => void;
}) {
  const set = <K extends keyof BundleItems>(k: K, v: BundleItems[K]) => onChange({ ...value, [k]: v });
  const totals = useMemo(() => bundleTotals(value), [value]);
  const { comfort, addons } = value;
  return (
    <div className="space-y-6">
      <EquipmentSlot title="Furnace" slot={value.furnace} onChange={(s) => set("furnace", s)} />
      <EquipmentSlot title="Condenser / AC" slot={value.condenser} onChange={(s) => set("condenser", s)} />
      <EquipmentSlot title="Evaporator Coil" slot={value.coil} onChange={(s) => set("coil", s)} />

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Item 4 Option: Water Heater</CardTitle>
          <Select value={value.whChoice} onValueChange={(v) => set("whChoice", v as "40" | "50")}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="40">Use 40-Gal in Bundle 4</SelectItem><SelectItem value="50">Use 50-Gal in Bundle 4</SelectItem></SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-4">
          <EquipmentSlot title="40-Gal Standard Vent" slot={value.wh40} onChange={(s) => set("wh40", s)} />
          <EquipmentSlot title="50-Gal Standard Vent" slot={value.wh50} onChange={(s) => set("wh50", s)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Comfort Accessories (WI= pricing)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {comfort.map((c, i) => <ProductRow key={c.id + i} p={c} useWi onRemove={() => set("comfort", comfort.filter((_, j) => j !== i))} />)}
          <ProductPicker placeholder="UV light, humidifier, thermostat…" seeAllTerm="" onPick={(p) => set("comfort", [...comfort, p])} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Required Installation Add-Ons</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {addons.map((c, i) => <ProductRow key={c.id + i} p={c} onRemove={() => set("addons", addons.filter((_, j) => j !== i))} />)}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 print:hidden">
            {ADDON_GROUPS.map((g) => (
              <div key={g}><Label className="text-xs">{g}</Label>
                <ProductPicker placeholder={`Search ${g.toLowerCase()}`} seeAllTerm={g} onPick={(p) => set("addons", [...addons, p])} /></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Package Pricing</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left">{onPkgChange && <th className="py-2 w-16">Use</th>}<th className="py-2">Package</th><th className="text-right">Total Our Cost</th><th className="text-right">Total Listed Price</th></tr></thead>
            <tbody>
              {(Object.keys(PACKAGE_LABELS) as PackageKey[]).map((k) => (
                <tr key={k} className={`border-b ${pkg === k ? "bg-muted/60" : ""}`}>
                  {onPkgChange && <td className="py-2"><input type="radio" name="pkg" checked={pkg === k} onChange={() => onPkgChange(k)} aria-label={`Use ${PACKAGE_LABELS[k]}`} /></td>}
                  <td className="py-2">{k === "b4" ? `Bundle 4 — Complete System + ${value.whChoice}-Gal Water Heater` : PACKAGE_LABELS[k]}</td>
                  <td className="text-right text-muted-foreground">{money(totals[k].ourCost)}</td>
                  <td className="text-right font-semibold">{money(totals[k].listed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">Comfort accessories and required add-ons are included in every bundle. Products without a selling price count as $0 listed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
