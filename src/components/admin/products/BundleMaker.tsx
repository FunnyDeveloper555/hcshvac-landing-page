import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Printer, Save, Search, Trash2, X } from "lucide-react";
import { productOurCost } from "@/lib/pricingRules";
import { DEFAULT_FINANCE_PLANS, FinancePlan, PricedLine, contractorCost, estimateValidUntil, monthlyPayment, sumLines } from "@/lib/bundleMath";

const PRODUCT_COLS = "id, product_name, model_number, spot_images, bullet_points, specifications, invoice_unit_price_text, selling_price, wi_price, spec_type, category, is_part";
type P = any;
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const line = (p: P | null, useWi = false): PricedLine | null =>
  p ? { ourCost: productOurCost(p) ?? 0, listed: Number((useWi && p.wi_price) || p.selling_price || 0) } : null;

function ProductPicker({ onPick, placeholder = "SKU / model / name", seeAllTerm }: { onPick: (p: P) => void; placeholder?: string; seeAllTerm?: string }) {
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

function ProductRow({ p, onRemove, useWi }: { p: P; onRemove: () => void; useWi?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
      <div className="text-sm"><span className="font-medium">{p.model_number || "—"}</span> · {p.product_name}</div>
      <div className="flex items-center gap-2"><PriceCells p={p} useWi={useWi} />
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}><X className="h-4 w-4" /></Button></div>
    </div>
  );
}

interface Slot { product: P | null; comesWith: P[] }
const emptySlot = (): Slot => ({ product: null, comesWith: [] });

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

export default function BundleMaker() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const estId = params.get("id");
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [customer, setCustomer] = useState<any | null>(null);
  const [custQ, setCustQ] = useState("");
  const [custRes, setCustRes] = useState<any[]>([]);
  const [estimateNumber, setEstimateNumber] = useState("");
  const [estDate, setEstDate] = useState(new Date().toISOString().slice(0, 10));
  const [rep, setRep] = useState({ name: "", phone: "", email: "" });
  const [siteProfile, setSiteProfile] = useState("");
  const [furnace, setFurnace] = useState<Slot>(emptySlot());
  const [condenser, setCondenser] = useState<Slot>(emptySlot());
  const [coil, setCoil] = useState<Slot>(emptySlot());
  const [wh40, setWh40] = useState<Slot>(emptySlot());
  const [wh50, setWh50] = useState<Slot>(emptySlot());
  const [whChoice, setWhChoice] = useState<"40" | "50">("40");
  const [comfort, setComfort] = useState<P[]>([]);
  const [addons, setAddons] = useState<P[]>([]);
  const [plans, setPlans] = useState<FinancePlan[]>(DEFAULT_FINANCE_PLANS);
  const [financeBundle, setFinanceBundle] = useState<"b2" | "b3" | "b4">("b3");

  useEffect(() => {
    supabase.from("companies").select("id, name, logo_url, company_phone").order("name").then(({ data }) => setCompanies(data || []));
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || estId) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setRep((r) => ({ ...r, name: (prof as any)?.full_name || r.name, email: data.user!.email || "" }));
    });
  }, []);

  useEffect(() => {
    if (!estId) return;
    supabase.from("product_estimates").select("*").eq("id", estId).maybeSingle().then(({ data }) => {
      if (!data) return;
      const d: any = data.data || {};
      setEstimateNumber(data.estimate_number || ""); setCompanyId(data.company_id || "");
      setCustomer(d.customer || null); setEstDate(d.estDate || estDate); setRep(d.rep || rep); setSiteProfile(d.siteProfile || "");
      setFurnace(d.furnace || emptySlot()); setCondenser(d.condenser || emptySlot()); setCoil(d.coil || emptySlot());
      setWh40(d.wh40 || emptySlot()); setWh50(d.wh50 || emptySlot()); setWhChoice(d.whChoice || "40");
      setComfort(d.comfort || []); setAddons(d.addons || []); setPlans(d.plans || DEFAULT_FINANCE_PLANS); setFinanceBundle(d.financeBundle || "b3");
    });
  }, [estId]);

  useEffect(() => {
    const t = custQ.trim().replace(/[%,()]/g, "");
    if (t.length < 2) { setCustRes([]); return; }
    const h = setTimeout(async () => {
      let q = supabase.from("customer_registrations").select("*")
        .or(`bill_to_first_name.ilike.%${t}%,bill_to_last_name.ilike.%${t}%,ship_to_last_name.ilike.%${t}%,account_number.ilike.%${t}%,phone.ilike.%${t}%,bill_to_business_name.ilike.%${t}%`).limit(8);
      if (companyId) q = q.eq("company_id", companyId);
      const { data } = await q; setCustRes(data || []);
    }, 250);
    return () => clearTimeout(h);
  }, [custQ, companyId]);

  const slotLines = (s: Slot) => [line(s.product), ...s.comesWith.map((c) => line(c))];
  const extras = [...comfort.map((c) => line(c, true)), ...addons.map((a) => line(a))];
  const wh = whChoice === "40" ? wh40 : wh50;
  const totals = useMemo(() => {
    const b2 = sumLines([...slotLines(furnace), ...slotLines(coil), ...extras]);
    const b3 = sumLines([...slotLines(furnace), ...slotLines(condenser), ...slotLines(coil), ...extras]);
    const b4 = sumLines([...slotLines(furnace), ...slotLines(condenser), ...slotLines(coil), ...slotLines(wh), ...extras]);
    const all = sumLines([furnace, condenser, coil, wh40, wh50].flatMap(slotLines).concat(extras));
    return { b2, b3, b4, all };
  }, [furnace, condenser, coil, wh40, wh50, whChoice, comfort, addons]);
  const financed = totals[financeBundle].listed;
  const company = companies.find((c) => c.id === companyId);

  const save = async () => {
    setSaving(true);
    try {
      let number = estimateNumber;
      if (!number) {
        const { count } = await supabase.from("product_estimates").select("id", { count: "exact", head: true });
        number = `EST-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;
      }
      const row = {
        estimate_number: number, company_id: companyId || null, customer_id: customer?.id || null,
        total_our_cost: totals.b4.ourCost, total_listed: totals.b4.listed,
        data: { customer, estDate, rep, siteProfile, furnace, condenser, coil, wh40, wh50, whChoice, comfort, addons, plans, financeBundle },
      };
      const res = estId
        ? await supabase.from("product_estimates").update(row as any).eq("id", estId).select().single()
        : await supabase.from("product_estimates").insert(row as any).select().single();
      if (res.error) throw res.error;
      setEstimateNumber(number);
      if (!estId) setParams({ id: res.data.id });
      toast({ title: "Estimate saved", description: number });
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const addr = (c: any, k: "bill_to" | "ship_to") => c ? [
    [c[`${k}_first_name`], c[`${k}_last_name`]].filter(Boolean).join(" "), c[`${k}_business_name`],
    [c[`${k}_address`], c[`${k}_suite_number`]].filter(Boolean).join(" "),
    [c[`${k}_city`], c[`${k}_state`], c[`${k}_zip_code`]].filter(Boolean).join(", "),
  ].filter(Boolean) : [];

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="text-3xl font-bold">Bundle Maker</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print / PDF</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Estimate</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              {company?.logo_url && <img src={company.logo_url} alt={company.name} className="h-14 object-contain" />}
              <div className="print:hidden w-64">
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="font-semibold">{company?.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm min-w-[320px]">
              <Label className="self-center">Estimate #</Label><div className="self-center font-medium">{estimateNumber || "Assigned on save"}</div>
              <Label className="self-center">Date</Label><Input type="date" value={estDate} onChange={(e) => setEstDate(e.target.value)} />
              <Label className="self-center">Valid until</Label><div className="self-center">{estimateValidUntil(new Date(estDate + "T12:00")).toLocaleDateString()}</div>
              <Label className="self-center">Site Profile</Label><Input value={siteProfile} onChange={(e) => setSiteProfile(e.target.value)} placeholder="Report #" />
              <Label className="self-center">Location Type</Label><div className="self-center">{customer?.location_type || "—"}</div>
              <Label className="self-center">Rep</Label><Input value={rep.name} onChange={(e) => setRep({ ...rep, name: e.target.value })} placeholder="Name" />
              <Label className="self-center">Rep Phone</Label><Input value={rep.phone} onChange={(e) => setRep({ ...rep, phone: e.target.value })} />
              <Label className="self-center">Rep Email</Label><Input value={rep.email} onChange={(e) => setRep({ ...rep, email: e.target.value })} />
            </div>
          </div>

          <div className="relative print:hidden max-w-md">
            <Label>Customer</Label>
            <Input value={custQ} onChange={(e) => setCustQ(e.target.value)} placeholder="Search name, account #, phone" />
            {custRes.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md">
                {custRes.map((c) => (
                  <button key={c.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => { setCustomer(c); setCustQ(""); setCustRes([]); }}>
                    {c.bill_to_first_name} {c.bill_to_last_name} {c.account_number ? `· ${c.account_number}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {(["bill_to", "ship_to"] as const).map((k) => (
              <div key={k} className="rounded-md border p-3 text-sm">
                <div className="font-semibold mb-1">{k === "bill_to" ? "Bill To" : "Ship To"}</div>
                {customer ? <>
                  {addr(customer, k === "ship_to" && customer.bill_to_same_as_ship_to ? "bill_to" : k).map((l) => <div key={l}>{l}</div>)}
                  <div>{customer.phone}</div><div>{customer.email}</div>
                  {customer.account_number && <div className="text-muted-foreground">Account # {customer.account_number}</div>}
                </> : <div className="text-muted-foreground">No customer selected</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EquipmentSlot title="Furnace" slot={furnace} onChange={setFurnace} />
      <EquipmentSlot title="Condenser / AC" slot={condenser} onChange={setCondenser} />
      <EquipmentSlot title="Evaporator Coil" slot={coil} onChange={setCoil} />

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Item 4 Option: Water Heater</CardTitle>
          <Select value={whChoice} onValueChange={(v) => setWhChoice(v as any)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="40">Use 40-Gal in Bundle 4</SelectItem><SelectItem value="50">Use 50-Gal in Bundle 4</SelectItem></SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="grid lg:grid-cols-2 gap-4">
          <EquipmentSlot title="40-Gal Standard Vent" slot={wh40} onChange={setWh40} />
          <EquipmentSlot title="50-Gal Standard Vent" slot={wh50} onChange={setWh50} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Comfort Accessories (WI= pricing)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {comfort.map((c, i) => <ProductRow key={c.id + i} p={c} useWi onRemove={() => setComfort(comfort.filter((_, j) => j !== i))} />)}
          <ProductPicker placeholder="UV light, humidifier, thermostat…" seeAllTerm="" onPick={(p) => setComfort([...comfort, p])} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Required Installation Add-Ons</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {addons.map((c, i) => <ProductRow key={c.id + i} p={c} onRemove={() => setAddons(addons.filter((_, j) => j !== i))} />)}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 print:hidden">
            {ADDON_GROUPS.map((g) => (
              <div key={g}><Label className="text-xs">{g}</Label>
                <ProductPicker placeholder={`Search ${g.toLowerCase()}`} seeAllTerm={g} onPick={(p) => setAddons([...addons, p])} /></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Package Pricing</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2">Package</th><th className="text-right">Total Our Cost</th><th className="text-right">Total Listed Price</th></tr></thead>
            <tbody>
              {([["b2", "Bundle 2 — Furnace & Coil"], ["b3", "Bundle 3 — Furnace, Condenser & Coil"], ["b4", `Bundle 4 — Complete System + ${whChoice}-Gal Water Heater`]] as const).map(([k, l]) => (
                <tr key={k} className="border-b"><td className="py-2">{l}</td><td className="text-right text-muted-foreground">{money(totals[k].ourCost)}</td><td className="text-right font-semibold">{money(totals[k].listed)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">Comfort accessories and required add-ons are included in every bundle. Products without a selling price count as $0 listed.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">FTL Financing</CardTitle>
          <Select value={financeBundle} onValueChange={(v) => setFinanceBundle(v as any)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="b2">Finance Bundle 2</SelectItem><SelectItem value="b3">Finance Bundle 3</SelectItem><SelectItem value="b4">Finance Bundle 4</SelectItem></SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="mb-3 text-sm">Cash / Check / Card: <span className="font-semibold">{money(financed)}</span></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="py-2">Plan</th><th>Months</th><th>APR %</th><th>BDr %</th><th className="text-right">Monthly</th><th className="text-right">CC</th><th className="print:hidden" /></tr></thead>
            <tbody>
              {plans.map((pl, i) => {
                const upd = (patch: Partial<FinancePlan>) => setPlans(plans.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                return (
                  <tr key={i} className="border-b">
                    <td className="py-1 pr-2"><Input className="h-8" value={pl.label || ""} placeholder={`Option ${i + 1}`} onChange={(e) => upd({ label: e.target.value })} /></td>
                    <td className="pr-2"><Input className="h-8 w-20" type="number" value={pl.months} onChange={(e) => upd({ months: Number(e.target.value) })} /></td>
                    <td className="pr-2"><Input className="h-8 w-20" type="number" step="0.01" value={pl.apr} onChange={(e) => upd({ apr: Number(e.target.value) })} /></td>
                    <td className="pr-2"><Input className="h-8 w-20" type="number" step="0.01" value={pl.dealerFee} onChange={(e) => upd({ dealerFee: Number(e.target.value) })} /></td>
                    <td className="text-right font-medium">{money(monthlyPayment(financed, pl.apr, pl.months))}</td>
                    <td className="text-right text-muted-foreground">{money(contractorCost(financed, pl.dealerFee))}</td>
                    <td className="text-right print:hidden"><Button size="icon" variant="ghost" onClick={() => setPlans(plans.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Button className="mt-2 print:hidden" size="sm" variant="outline" onClick={() => setPlans([...plans, { months: 12, apr: 0, dealerFee: 0, label: "SAC 12" }])}><Plus className="h-4 w-4 mr-1" />Add plan</Button>
          <p className="mt-2 text-xs text-muted-foreground">CC = amount the bank shorts us (financed amount × BDr %). Use APR 0 for Same-As-Cash plans.</p>
        </CardContent>
      </Card>
    </div>
  );
}
