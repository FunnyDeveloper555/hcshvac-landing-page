import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PRODUCT_SPEC_CATEGORIES } from "@/lib/productSpecs";
import { computeSellingPrice, pickRule, PricingRule } from "@/lib/pricingRules";

type Row = PricingRule & { id: string; notes?: string | null };
const ALL = "__all__";
const blank: Row = { id: "", name: "", product_type: null, company_id: null, markup: 1.8, labor_cost: 0, round_to: 0, is_active: true, notes: "" };
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function PricingRulesAdmin() {
  const db = supabase as any;
  const [rules, setRules] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<Row | null>(null);
  const [testCost, setTestCost] = useState("1053.66");
  const [testType, setTestType] = useState<string>("Evaporator Coil");
  const [testCompany, setTestCompany] = useState<string>(ALL);

  const load = async () => {
    const { data, error } = await db.from("pricing_rules").select("*").order("created_at");
    if (error) toast.error(error.message);
    setRules((data || []).map((r: any) => ({ ...r, markup: Number(r.markup), labor_cost: Number(r.labor_cost), round_to: Number(r.round_to) })));
  };
  useEffect(() => {
    load();
    supabase.from("companies").select("id,name").order("name").then(({ data }) => setCompanies((data as any) || []));
  }, []);

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("Rule name is required");
    if (!(form.markup > 0)) return toast.error("Markup must be greater than 0");
    const payload = {
      name: form.name.trim(), product_type: form.product_type || null, company_id: form.company_id || null,
      markup: form.markup, labor_cost: form.labor_cost || 0, round_to: form.round_to || 0,
      is_active: form.is_active !== false, notes: form.notes || null,
    };
    const { error } = form.id ? await db.from("pricing_rules").update(payload).eq("id", form.id) : await db.from("pricing_rules").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Pricing rule saved");
    setForm(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this pricing rule?")) return;
    const { error } = await db.from("pricing_rules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const tested = useMemo(() => {
    const rule = pickRule(rules, testType === ALL ? null : testType, testCompany === ALL ? null : testCompany);
    return rule ? { rule, price: computeSellingPrice(Number(testCost) || 0, rule) } : null;
  }, [rules, testCost, testType, testCompany]);

  const companyName = (id?: string | null) => (id ? companies.find((c) => c.id === id)?.name || "—" : "All companies");
  const formPreview = form ? computeSellingPrice(1000, form) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Rules</h1>
          <p className="text-sm text-muted-foreground">Selling Price = (Our Cost × Markup) + Labor. The most specific active rule wins.</p>
        </div>
        <Button onClick={() => setForm({ ...blank })}><Plus className="mr-1 h-4 w-4" />New Rule</Button>
      </div>

      {form && (
        <Card>
          <CardHeader><CardTitle>{form.id ? "Edit rule" : "New rule"}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1"><Label>Rule name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Coil replacement" /></div>
            <div className="space-y-1"><Label>Product type</Label>
              <Select value={form.product_type || ALL} onValueChange={(v) => setForm({ ...form, product_type: v === ALL ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All product types (default)</SelectItem>
                  {PRODUCT_SPEC_CATEGORIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  <SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select></div>
            <div className="space-y-1"><Label>Company</Label>
              <Select value={form.company_id || ALL} onValueChange={(v) => setForm({ ...form, company_id: v === ALL ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All companies</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-1"><Label>Markup (MU) ×</Label><Input type="number" step="0.01" value={form.markup} onChange={(e) => setForm({ ...form, markup: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Labor cost ($)</Label><Input type="number" step="1" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Round up to nearest ($, 0 = none)</Label><Input type="number" step="1" value={form.round_to} onChange={(e) => setForm({ ...form, round_to: Number(e.target.value) })} /></div>
            <div className="space-y-1 md:col-span-2"><Label>Notes</Label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active !== false} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
            <p className="text-sm text-muted-foreground md:col-span-3">Example: $1,000.00 cost → <span className="font-semibold text-foreground">{money(formPreview)}</span></p>
            <div className="flex gap-2 md:col-span-3"><Button onClick={save}>Save rule</Button><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Product type</TableHead><TableHead>Company</TableHead><TableHead>Formula</TableHead><TableHead>Status</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
            <TableBody>
              {rules.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No pricing rules yet.</TableCell></TableRow>}
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.product_type || "All"}</TableCell>
                  <TableCell>{companyName(r.company_id)}</TableCell>
                  <TableCell>(OC × {r.markup}) + {money(r.labor_cost)}{r.round_to > 0 ? `, round up to $${r.round_to}` : ""}</TableCell>
                  <TableCell>{r.is_active !== false ? "Active" : "Inactive"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setForm({ ...r })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Price calculator</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1"><Label>Our Cost (OC)</Label><Input type="number" step="0.01" value={testCost} onChange={(e) => setTestCost(e.target.value)} /></div>
          <div className="space-y-1"><Label>Product type</Label>
            <Select value={testType} onValueChange={setTestType}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRODUCT_SPEC_CATEGORIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}<SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
          <div className="space-y-1"><Label>Company</Label>
            <Select value={testCompany} onValueChange={setTestCompany}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>Any</SelectItem>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1"><Label>Selling price</Label>
            <div className="rounded-md border bg-muted px-3 py-2 font-semibold">{tested ? money(tested.price) : "No matching rule"}</div>
            {tested && <p className="text-xs text-muted-foreground">Using “{tested.rule.name}”</p>}</div>
        </CardContent>
      </Card>
    </div>
  );
}
