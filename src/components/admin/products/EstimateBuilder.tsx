import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Boxes, Loader2, Mail, Package, Printer, Save, Trash2, Wrench } from "lucide-react";
import { estimateValidUntil } from "@/lib/bundleMath";
import {
  BundleItems, EstimateLine, PACKAGE_LABELS, PackageKey, bundleTotals, emptyBundleItems, estimateTotals,
  legacyEstimateLines, lineTotal, packageProducts, productLine, toBundleItems,
} from "@/lib/bundles";
import { BundleEditor, ProductPicker, money } from "./bundle/BundleEditor";
import { FinanceButton, PickedPlan, planName } from "./bundle/FinanceCalculator";
import { monthlyPayment } from "@/lib/bundleMath";
import { bundlePrice, useBundles } from "./BundlesList";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Part 2: custom estimate for a client — single products, saved bundles or a custom bundle. */
export default function EstimateBuilder() {
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
  const [lines, setLines] = useState<EstimateLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [totalFinance, setTotalFinance] = useState<PickedPlan[]>([]);
  const [emailing, setEmailing] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customItems, setCustomItems] = useState<BundleItems>(emptyBundleItems());
  const [customPkg, setCustomPkg] = useState<PackageKey>("b3");
  const [customName, setCustomName] = useState("");
  const [saveReusable, setSaveReusable] = useState(false);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const { data: bundles = [] } = useBundles();

  useEffect(() => {
    supabase.from("companies").select("id, name, logo_url, company_phone").order("name").then(({ data }) => setCompanies(data || []));
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || estId) return;
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setRep((r) => ({ ...r, name: (prof as any)?.full_name || (prof as any)?.display_name || r.name, email: data.user!.email || "" }));
    });
  }, []);

  useEffect(() => {
    if (!estId) return;
    supabase.from("product_estimates").select("*").eq("id", estId).maybeSingle().then(({ data }) => {
      if (!data) return;
      const d: any = data.data || {};
      setEstimateNumber(data.estimate_number || ""); setCompanyId(data.company_id || "");
      setCustomer(d.customer || null); setEstDate(d.estDate || estDate); setRep(d.rep || rep); setSiteProfile(d.siteProfile || "");
      setLines(legacyEstimateLines(d)); setDiscount(Number(d.discount || 0)); setTotalFinance(Array.isArray(d.totalFinance) ? d.totalFinance : []);
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

  const totals = useMemo(() => estimateTotals(lines, discount), [lines, discount]);
  const company = companies.find((c) => c.id === companyId);
  const updLine = (id: string, patch: Partial<EstimateLine>) => setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const addProduct = (p: any) => {
    const pl = productLine(p)!;
    setLines([...lines, { id: uid(), type: "product", title: p.product_name, description: p.model_number ? `Model ${p.model_number}` : "", qty: 1, unitOurCost: pl.ourCost, unitPrice: pl.listed, product: p }]);
  };
  const addBundle = (b: any) => {
    const items = toBundleItems(b.items);
    setLines([...lines, { id: uid(), type: "bundle", title: b.name, description: b.description || PACKAGE_LABELS[b.package as PackageKey], qty: 1,
      unitOurCost: Number(b.total_our_cost || 0), unitPrice: bundlePrice(b), bundle_id: b.id, package: b.package, items }]);
    setBundleOpen(false);
  };
  const openCustom = (line?: EstimateLine) => {
    setEditingLine(line?.id || null);
    setCustomItems(line?.items ? toBundleItems(line.items) : emptyBundleItems());
    setCustomPkg(line?.package || "b3"); setCustomName(line?.title || ""); setSaveReusable(false); setCustomOpen(true);
  };
  const saveCustom = async () => {
    const t = bundleTotals(customItems)[customPkg];
    const title = customName.trim() || `Custom ${PACKAGE_LABELS[customPkg]}`;
    const base = { type: "custom_bundle" as const, title, description: PACKAGE_LABELS[customPkg], unitOurCost: t.ourCost, unitPrice: t.listed, package: customPkg, items: customItems };
    if (editingLine) setLines(lines.map((l) => (l.id === editingLine ? { ...l, ...base } : l)));
    else setLines([...lines, { id: uid(), qty: 1, ...base }]);
    if (saveReusable) {
      const { error } = await supabase.from("product_bundles").insert({ name: title, package: customPkg, items: customItems as never, total_our_cost: t.ourCost, total_listed: t.listed, company_id: companyId || null, is_showing: false });
      if (error) toast({ title: "Bundle not saved to list", description: error.message, variant: "destructive" });
      else toast({ title: "Also saved to Bundles" });
    }
    setCustomOpen(false);
  };

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
        total_our_cost: totals.ourCost, total_listed: totals.total,
        data: { customer, estDate, rep, siteProfile, lines, discount, totalFinance },
      };
      const res = estId
        ? await supabase.from("product_estimates").update(row as any).eq("id", estId).select().single()
        : await supabase.from("product_estimates").insert(row as any).select().single();
      if (res.error) throw res.error;
      setEstimateNumber(number);
      if (!estId) setParams({ id: res.data.id });
      toast({ title: "Estimate saved", description: number });
      return number;
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const emailEstimate = async () => {
    const to = customer?.email;
    if (!to) return toast({ title: "The customer has no email on file", variant: "destructive" });
    if (!lines.length) return toast({ title: "Add something to the estimate first", variant: "destructive" });
    setEmailing(true);
    try {
      const num = (await save()) || estimateNumber;
      const fin = (amount: number, plans: PickedPlan[]) => plans.map((p) => ({ name: planName(p), months: p.months, apr: p.apr, monthly: monthlyPayment(amount, p.apr, p.months), understanding: p.understanding || null }));
      const { data: co } = companyId ? await supabase.from("companies").select("name, company_email_primary").eq("id", companyId).maybeSingle() : { data: null };
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "customer-estimate", recipientEmail: to,
          idempotencyKey: `estimate-${num}-${Date.now()}`,
          fromEmail: co?.company_email_primary || "master@hcshvac.com", fromName: co?.name || "HCS Inc.",
          templateData: {
            companyName: co?.name, customerName: [customer.bill_to_first_name, customer.bill_to_last_name].filter(Boolean).join(" "),
            estimateNumber: num, estDate, validUntil: estimateValidUntil(new Date(estDate + "T12:00")).toLocaleDateString(),
            rep, lines: lines.map((l) => ({
              title: l.title, description: l.description, qty: l.qty, total: lineTotal(l),
              included: l.items && l.package ? packageProducts(l.items, l.package).map((p: any) => p.product_name) : [],
              finance: fin(lineTotal(l), l.finance || []),
            })),
            subtotal: totals.subtotal, discount: totals.discount, total: totals.total, totalFinance: fin(totals.total, totalFinance),
          },
        },
      });
      if (error) throw error;
      toast({ title: "Estimate emailed", description: to });
    } catch (e: any) {
      toast({ title: "Could not email", description: e.message, variant: "destructive" });
    } finally { setEmailing(false); }
  };

  const addr = (c: any, k: "bill_to" | "ship_to") => c ? [
    [c[`${k}_first_name`], c[`${k}_last_name`]].filter(Boolean).join(" "), c[`${k}_business_name`],
    [c[`${k}_address`], c[`${k}_suite_number`]].filter(Boolean).join(" "),
    [c[`${k}_city`], c[`${k}_state`], c[`${k}_zip_code`]].filter(Boolean).join(", "),
  ].filter(Boolean) : [];

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="text-3xl font-bold">Estimate</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print / PDF</Button>
          <Button variant="outline" onClick={emailEstimate} disabled={emailing || saving}>{emailing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}Email Estimate</Button>
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

      <Card className="print:hidden">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Add to estimate</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1"><Label className="flex items-center gap-1"><Package className="h-4 w-4" />Single product</Label><ProductPicker onPick={addProduct} seeAllTerm="" /></div>
          <div className="space-y-1"><Label className="flex items-center gap-1"><Boxes className="h-4 w-4" />Pre-made bundle</Label>
            <Button variant="outline" className="w-full" onClick={() => setBundleOpen(true)}>Pick a bundle</Button></div>
          <div className="space-y-1"><Label className="flex items-center gap-1"><Wrench className="h-4 w-4" />Custom bundle</Label>
            <Button variant="outline" className="w-full" onClick={() => openCustom()}>Build a custom bundle</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg">Estimate items</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 && <p className="text-sm text-muted-foreground">Nothing added yet.</p>}
          {lines.map((l) => {
            const included = l.items && l.package ? packageProducts(l.items, l.package) : [];
            return (
              <div key={l.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase text-muted-foreground">{l.type === "product" ? "Product" : l.type === "bundle" ? "Bundle" : "Custom bundle"}</div>
                    <div className="font-semibold">{l.title}</div>
                    {l.description && <div className="text-sm text-muted-foreground">{l.description}</div>}
                  </div>
                  <div className="flex items-end gap-2">
                    <div><Label className="text-xs">Qty</Label><Input className="h-8 w-16" type="number" min={1} value={l.qty} onChange={(e) => updLine(l.id, { qty: Math.max(1, Number(e.target.value)) })} /></div>
                    <div><Label className="text-xs">Price ($)</Label><Input className="h-8 w-28" type="number" step="0.01" value={l.unitPrice} onChange={(e) => updLine(l.id, { unitPrice: Number(e.target.value) })} /></div>
                    <div className="text-right w-28"><div className="text-xs text-muted-foreground">Line total</div><div className="font-semibold">{money(lineTotal(l))}</div></div>
                  </div>
                </div>
                <FinanceSummary amount={lineTotal(l)} plans={l.finance || []} />
                {included.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">{included.map((p: any, i: number) => <li key={(p.id || "") + i}>{p.model_number ? `${p.model_number} · ` : ""}{p.product_name}</li>)}</ul>
                )}
                <div className="flex flex-wrap gap-2 print:hidden">
                  <FinanceButton amount={lineTotal(l)} title={l.title} selected={l.finance || []} onSelectedChange={(f) => updLine(l.id, { finance: f })} />
                  {l.type === "custom_bundle" && <Button size="sm" variant="outline" onClick={() => openCustom(l)}>Edit bundle</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setLines(lines.filter((x) => x.id !== l.id))}><Trash2 className="h-4 w-4 mr-1 text-destructive" />Remove</Button>
                </div>
              </div>
            );
          })}
          <div className="ml-auto w-full max-w-sm space-y-1 text-sm pt-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
            <div className="flex items-center justify-between gap-2"><span>Discount ($)</span>
              <Input className="h-8 w-28 print:hidden" type="number" step="0.01" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} />
              <span className="hidden print:inline">{money(totals.discount)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-1"><span>Total</span><span>{money(totals.total)}</span></div>
            <div className="flex justify-between text-muted-foreground print:hidden"><span>Our cost</span><span>{money(totals.ourCost)}</span></div>
            <div className="pt-1 print:hidden"><FinanceButton amount={totals.total} label="Finance the total" title={`Estimate ${estimateNumber || ""} total`} selected={totalFinance} onSelectedChange={setTotalFinance} /></div>
            <FinanceSummary amount={totals.total} plans={totalFinance} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={bundleOpen} onOpenChange={setBundleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Pick a bundle</DialogTitle></DialogHeader>
          {bundles.length === 0 ? <p className="text-sm text-muted-foreground">No saved bundles yet. Make one in Bundle Maker.</p> :
            bundles.filter((b) => !companyId || !b.company_id || b.company_id === companyId).map((b) => (
              <button key={b.id} type="button" onClick={() => addBundle(b)} className="flex w-full items-center justify-between gap-4 border-b px-2 py-2 text-left text-sm hover:bg-muted">
                <span><span className="font-medium">{b.name}</span><span className="block text-xs text-muted-foreground">{PACKAGE_LABELS[b.package as PackageKey]}</span></span>
                <span className="font-semibold whitespace-nowrap">{money(bundlePrice(b))}</span>
              </button>
            ))}
        </DialogContent>
      </Dialog>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Custom bundle</DialogTitle></DialogHeader>
          <div><Label>Name on estimate</Label><Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Furnace & AC replacement" /></div>
          <BundleEditor value={customItems} onChange={setCustomItems} pkg={customPkg} onPkgChange={setCustomPkg} />
          <DialogFooter className="items-center gap-3 sm:justify-between">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={saveReusable} onCheckedChange={(c) => setSaveReusable(!!c)} />Also save as a reusable bundle</label>
            <Button onClick={saveCustom}>{editingLine ? "Update estimate" : "Add to estimate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Customer-facing list of the financing picked: one plan = chosen, several = options. */
function FinanceSummary({ amount, plans }: { amount: number; plans: PickedPlan[] }) {
  if (!plans.length || !amount) return null;
  return (
    <div className="rounded-md bg-muted/50 p-2 text-sm">
      <div className="font-medium mb-1">{plans.length === 1 ? "Financing chosen" : "Financing options"}</div>
      <ul className="space-y-0.5">
        {plans.map((p) => (
          <li key={p.key} className="flex justify-between gap-4">
            <span>{planName(p)} · {p.apr}% APR</span><span className="font-semibold">{money(monthlyPayment(amount, p.apr, p.months))}/mo</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
