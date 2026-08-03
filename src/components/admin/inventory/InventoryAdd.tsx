import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Save, ArrowLeft } from "lucide-react";

interface ProductRow {
  id: string;
  product_name: string | null;
  category: string | null;
  brand_name: string | null;
  tons_btu: string | null;
  seer_rating: string | number | null;
  model_number: string | null;
}

interface CustomerOpt { id: string; first: string; last: string; business?: string | null; account?: string | null; }
interface CompanyOpt { id: string; name: string }
interface VendorOpt { id: string; name: string }

const itemTypeOf = (category?: string | null) => {
  if (!category) return "Other";
  const parts = category.split(" - ");
  return (parts[parts.length - 1] || category).trim();
};

const uniq = (arr: (string | null | undefined)[]) =>
  Array.from(new Set(arr.map((v) => (v ?? "").toString().trim()).filter(Boolean))).sort();

export default function InventoryAdd() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [vendors, setVendors] = useState<VendorOpt[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    item_type: "",
    brand_name: "",
    tons_btu: "",
    seer_rating: "",
    product_id: "",
    model_number: "",
    serial_number: "",
    quantity: 1,
    assign_type: "company",
    customer_id: "",
    company_id: "",
    supply_vendor_id: "",
    received_date: new Date().toISOString().slice(0, 10),
    po_number: "",
    status: "received",
    notes: "",
  });

  const set = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    (async () => {
      const [p, c, co, v] = await Promise.all([
        supabase
          .from("products")
          .select("id, product_name, category, brand_name, tons_btu, seer_rating, model_number")
          .order("product_name")
          .limit(2000),
        supabase
          .from("customer_registrations")
          .select("id, ship_to_first_name, ship_to_last_name, ship_to_business_name, account_number")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("vendors").select("id, vendor_name").order("vendor_name"),
      ]);
      setProducts((p.data as ProductRow[]) || []);
      setCustomers(
        (c.data || []).map((r: any) => ({
          id: r.id,
          first: r.ship_to_first_name || "",
          last: r.ship_to_last_name || "",
          business: r.ship_to_business_name,
          account: r.account_number,
        }))
      );
      setCompanies((co.data as CompanyOpt[]) || []);
      setVendors((v.data || []).map((r: any) => ({ id: r.id, name: r.vendor_name })));
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await supabase.from("inventory_items").select("*").eq("id", editId).single();
      if (!data) return;
      setForm({
        item_type: data.item_type || "",
        brand_name: data.brand_name || "",
        tons_btu: data.tons_btu || "",
        seer_rating: data.seer_rating || "",
        product_id: data.product_id || "",
        model_number: data.model_number || "",
        serial_number: data.serial_number || "",
        quantity: data.quantity || 1,
        assign_type: data.assign_type || "company",
        customer_id: data.customer_id || "",
        company_id: data.company_id || "",
        supply_vendor_id: data.supply_vendor_id || "",
        received_date: data.received_date || new Date().toISOString().slice(0, 10),
        po_number: data.po_number || "",
        status: data.status || "received",
        notes: data.notes || "",
      });
    })();
  }, [editId]);

  /* ---- cascading options from the Products database ---- */
  const itemTypes = useMemo(() => uniq(products.map((p) => itemTypeOf(p.category))), [products]);

  const byType = useMemo(
    () => products.filter((p) => !form.item_type || itemTypeOf(p.category) === form.item_type),
    [products, form.item_type]
  );
  const brands = useMemo(() => uniq(byType.map((p) => p.brand_name)), [byType]);

  const byBrand = useMemo(
    () => byType.filter((p) => !form.brand_name || (p.brand_name || "") === form.brand_name),
    [byType, form.brand_name]
  );
  const tonsOptions = useMemo(() => uniq(byBrand.map((p) => p.tons_btu)), [byBrand]);

  const byTons = useMemo(
    () => byBrand.filter((p) => !form.tons_btu || (p.tons_btu || "") === form.tons_btu),
    [byBrand, form.tons_btu]
  );
  const seerOptions = useMemo(
    () => uniq(byTons.map((p) => (p.seer_rating == null ? "" : String(p.seer_rating)))),
    [byTons]
  );

  const modelCandidates = useMemo(
    () =>
      byTons.filter(
        (p) => !form.seer_rating || String(p.seer_rating ?? "") === form.seer_rating
      ),
    [byTons, form.seer_rating]
  );

  async function handleSave(addAnother = false) {
    if (!form.item_type) {
      toast({ title: "Item Type required", variant: "destructive" });
      return;
    }
    if (form.assign_type === "customer" && !form.customer_id) {
      toast({ title: "Select a customer to assign to", variant: "destructive" });
      return;
    }
    if (form.assign_type === "company" && !form.company_id) {
      toast({ title: "Select a company to assign to", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      item_type: form.item_type,
      brand_name: form.brand_name || null,
      tons_btu: form.tons_btu || null,
      seer_rating: form.seer_rating || null,
      product_id: form.product_id || null,
      model_number: form.model_number || null,
      serial_number: form.serial_number || null,
      quantity: Number(form.quantity) || 1,
      assign_type: form.assign_type,
      customer_id: form.assign_type === "customer" ? form.customer_id : null,
      company_id: form.assign_type === "company" ? form.company_id : null,
      supply_vendor_id: form.supply_vendor_id || null,
      received_date: form.received_date || null,
      po_number: form.po_number || null,
      status: form.status,
      notes: form.notes || null,
    };
    const { error } = editId
      ? await supabase.from("inventory_items").update(payload).eq("id", editId)
      : await supabase.from("inventory_items").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editId ? "Inventory item updated" : "Inventory item received" });
    if (addAnother) {
      set({ serial_number: "", model_number: "", product_id: "" });
      return;
    }
    navigate("/admin/inventory/receiving");
  }

  const customerLabel = (c: CustomerOpt) =>
    `${c.business ? c.business + " — " : ""}${c.first} ${c.last}${c.account ? ` (${c.account})` : ""}`.trim();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editId ? "Edit Inventory Item" : "Add New Inventory"}</h2>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/inventory/receiving")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Equipment (from Products database)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Item Type</Label>
            <Select
              value={form.item_type}
              onValueChange={(v) =>
                set({ item_type: v, brand_name: "", tons_btu: "", seer_rating: "", model_number: "", product_id: "" })
              }
            >
              <SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger>
              <SelectContent>
                {itemTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Brand Name</Label>
            <Select
              value={form.brand_name}
              onValueChange={(v) => set({ brand_name: v, tons_btu: "", seer_rating: "", model_number: "", product_id: "" })}
              disabled={!form.item_type}
            >
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>BTU / Tons</Label>
            <Select
              value={form.tons_btu}
              onValueChange={(v) => set({ tons_btu: v, seer_rating: "", model_number: "", product_id: "" })}
              disabled={!form.brand_name || tonsOptions.length === 0}
            >
              <SelectTrigger><SelectValue placeholder={tonsOptions.length ? "Select BTU / Tons" : "N/A"} /></SelectTrigger>
              <SelectContent>
                {tonsOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>SEER</Label>
            <Select
              value={form.seer_rating}
              onValueChange={(v) => set({ seer_rating: v, model_number: "", product_id: "" })}
              disabled={!form.brand_name || seerOptions.length === 0}
            >
              <SelectTrigger><SelectValue placeholder={seerOptions.length ? "Select SEER" : "N/A"} /></SelectTrigger>
              <SelectContent>
                {seerOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Please Choose Model Number</Label>
            <Select
              value={form.product_id}
              onValueChange={(v) => {
                const p = products.find((x) => x.id === v);
                set({
                  product_id: v,
                  model_number: p?.model_number || "",
                  brand_name: p?.brand_name || form.brand_name,
                  tons_btu: p?.tons_btu || form.tons_btu,
                  seer_rating: p?.seer_rating != null ? String(p.seer_rating) : form.seer_rating,
                });
              }}
              disabled={!form.item_type}
            >
              <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
              <SelectContent>
                {modelCandidates.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.model_number || p.product_name || "Unnamed product"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!form.product_id && (
              <Input
                className="mt-1"
                placeholder="Or type model number"
                value={form.model_number}
                onChange={(e) => set({ model_number: e.target.value })}
              />
            )}
          </div>

          <div>
            <Label>Serial Number</Label>
            <Input
              value={form.serial_number}
              onChange={(e) => set({ serial_number: e.target.value })}
              placeholder="Enter serial number"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Receiving & Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Assign To</Label>
            <Select
              value={form.assign_type}
              onValueChange={(v) => set({ assign_type: v, customer_id: "", company_id: "" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer (sold job)</SelectItem>
                <SelectItem value="company">Company (stock, no job)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.assign_type === "customer" ? (
            <div className="md:col-span-2">
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={(v) => set({ customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{customerLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="md:col-span-2">
              <Label>Company</Label>
              <Select value={form.company_id} onValueChange={(v) => set({ company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Supply Vendor</Label>
            <Select value={form.supply_vendor_id} onValueChange={(v) => set({ supply_vendor_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Received Date</Label>
            <Input type="date" value={form.received_date} onChange={(e) => set({ received_date: e.target.value })} />
          </div>

          <div>
            <Label>PO / Invoice #</Label>
            <Input value={form.po_number} onChange={(e) => set({ po_number: e.target.value })} />
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set({ quantity: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" disabled={saving} onClick={() => handleSave(false)}>
          <Save className="h-3.5 w-3.5 mr-1" /> {editId ? "Update Item" : "Save Item"}
        </Button>
        {!editId && (
          <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSave(true)}>
            Save & Add Another
          </Button>
        )}
      </div>
    </div>
  );
}
