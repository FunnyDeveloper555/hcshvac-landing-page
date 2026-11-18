import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { BundleItems, PACKAGE_LABELS, PackageKey, bundleTotals, emptyBundleItems, toBundleItems } from "@/lib/bundles";
import { BundleEditor, money } from "./bundle/BundleEditor";
import { FinanceButton } from "./bundle/FinanceCalculator";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Part 1: build reusable bundles for the Products page and for estimates. */
export default function BundleMaker() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ name: "", description: "", image_url: "", company_id: "", price_override: "", is_showing: false });
  const [items, setItems] = useState<BundleItems>(emptyBundleItems());
  const [pkg, setPkg] = useState<PackageKey>("b3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
  }, []);
  useEffect(() => {
    if (!id) return;
    supabase.from("product_bundles").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setForm({ name: data.name, description: data.description || "", image_url: data.image_url || "", company_id: data.company_id || "",
        price_override: data.price_override != null ? String(data.price_override) : "", is_showing: data.is_showing });
      setItems(toBundleItems(data.items)); setPkg((data.package as PackageKey) || "b3");
    });
  }, [id]);

  const totals = useMemo(() => bundleTotals(items)[pkg], [items, pkg]);
  const price = form.price_override ? Number(form.price_override) : totals.listed;
  const autoImage = items.furnace.product?.spot_images?.[0] || items.condenser.product?.spot_images?.[0] || "";

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Give the bundle a name", variant: "destructive" });
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const row = {
        name: form.name.trim(), slug: slugify(form.name), description: form.description || null,
        image_url: form.image_url || autoImage || null, company_id: form.company_id || null,
        package: pkg, items: items as never, total_our_cost: totals.ourCost, total_listed: totals.listed,
        price_override: form.price_override ? Number(form.price_override) : null, is_showing: form.is_showing,
        ...(id ? {} : { created_by: u.user?.id }),
      };
      const res = id
        ? await supabase.from("product_bundles").update(row).eq("id", id).select("id").single()
        : await supabase.from("product_bundles").insert(row).select("id").single();
      if (res.error) throw res.error;
      qc.invalidateQueries({ queryKey: ["product-bundles"] });
      toast({ title: "Bundle saved" });
      if (!id) navigate(`/admin/products/bundle-maker?id=${res.data.id}`, { replace: true });
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold">{id ? "Edit Bundle" : "Bundle Maker"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/products/bundles")}>All bundles</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Bundle</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div><Label>Bundle name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rheem 80% Furnace + 3-Ton AC + Coil" /></div>
            <div><Label>Short description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Company</Label>
              <Select value={form.company_id || "all"} onValueChange={(v) => setForm({ ...form, company_id: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All companies</SelectItem>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Leave blank to use the furnace picture" /></div>
            {(form.image_url || autoImage) && <img src={form.image_url || autoImage} alt="" className="h-24 object-contain rounded bg-muted" />}
            <div className="rounded-md border p-3 text-sm space-y-1">
              <div className="font-medium">{PACKAGE_LABELS[pkg]}</div>
              <div className="flex justify-between"><span>Total Our Cost</span><span>{money(totals.ourCost)}</span></div>
              <div className="flex justify-between"><span>Calculated price</span><span>{money(totals.listed)}</span></div>
              <div className="flex items-center justify-between gap-2"><span>Override price ($)</span>
                <Input className="w-32 h-8" type="number" step="0.01" value={form.price_override} onChange={(e) => setForm({ ...form, price_override: e.target.value })} placeholder="Optional" /></div>
              <div className="flex justify-between font-semibold"><span>Bundle price</span><span>{money(price)}</span></div>
              <div className="pt-1"><FinanceButton amount={price} title={form.name || "This bundle"} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_showing} onCheckedChange={(c) => setForm({ ...form, is_showing: c })} />Show on website Products page</label>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">Pick the products, then choose which package (Bundle 2, 3 or 4) this bundle sells as.</p>
      <BundleEditor value={items} onChange={setItems} pkg={pkg} onPkgChange={setPkg} />
    </div>
  );
}
