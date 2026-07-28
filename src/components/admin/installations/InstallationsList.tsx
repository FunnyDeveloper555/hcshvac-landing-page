import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CATEGORY_LABEL, InstallCategory } from "./installationOptions";

interface Row {
  id: string;
  customer_id: string | null;
  category: InstallCategory;
  item_type: string;
  brand_name: string | null;
  model_number: string | null;
  serial_number: string | null;
  install_date: string | null;
  labor_warranty_years: number | null;
  equipment_warranty_years: number | null;
  completed_by_name: string | null;
  customer?: { ship_to_first_name?: string | null; ship_to_last_name?: string | null; ship_to_business_name?: string | null; account_number?: string | null } | null;
}

export default function InstallationsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("installation_records")
      .select("*, customer:customer_registrations(ship_to_first_name, ship_to_last_name, ship_to_business_name, account_number)")
      .order("install_date", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this installation record?")) return;
    const { error } = await supabase.from("installation_records").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    load();
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const name = `${r.customer?.ship_to_business_name || ""} ${r.customer?.ship_to_first_name || ""} ${r.customer?.ship_to_last_name || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        r.item_type.toLowerCase().includes(q) ||
        (r.brand_name || "").toLowerCase().includes(q) ||
        (r.model_number || "").toLowerCase().includes(q) ||
        (r.serial_number || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, category]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Installation History</h2>
          <p className="text-sm text-muted-foreground">HVAC & plumbing equipment installed at customer sites.</p>
        </div>
        <Button onClick={() => navigate("/admin/installations/add")}>
          <Plus className="w-4 h-4 mr-1" /> Add Installation
        </Button>
      </div>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by customer, item, brand, model, serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="residential_hvac">Residential HVAC</SelectItem>
            <SelectItem value="commercial_hvac">Commercial HVAC</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} record(s)</span>
      </Card>

      <Card className="overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Category</th>
              <th className="p-2">Item</th>
              <th className="p-2">Brand</th>
              <th className="p-2">Model / Serial</th>
              <th className="p-2">Warranty (L/E)</th>
              <th className="p-2">Tech</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No installation records yet.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{r.install_date || "—"}</td>
                <td className="p-2">
                  {r.customer?.ship_to_business_name ? <div className="font-medium">{r.customer.ship_to_business_name}</div> : null}
                  <div>{r.customer?.ship_to_first_name} {r.customer?.ship_to_last_name}</div>
                  {r.customer?.account_number && <div className="text-xs text-muted-foreground">{r.customer.account_number}</div>}
                </td>
                <td className="p-2"><Badge variant="secondary">{CATEGORY_LABEL[r.category]}</Badge></td>
                <td className="p-2">{r.item_type}</td>
                <td className="p-2">{r.brand_name || "—"}</td>
                <td className="p-2">
                  <div>{r.model_number || "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.serial_number || ""}</div>
                </td>
                <td className="p-2 whitespace-nowrap">{(r.labor_warranty_years ?? 0)}y / {(r.equipment_warranty_years ?? 0)}y</td>
                <td className="p-2">{r.completed_by_name || "—"}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button asChild size="sm" variant="ghost"><Link to={`/admin/installations/add?id=${r.id}`}><Pencil className="w-4 h-4" /></Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
