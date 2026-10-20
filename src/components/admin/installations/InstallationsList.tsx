import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { warrantyStatus, WARRANTY_CLASS, WARRANTY_LABEL, WarrantyColor } from "./warrantyStatus";

interface Row {
  id: string;
  customer_id: string | null;
  item_type: string;
  brand_name: string | null;
  model_number: string | null;
  serial_number: string | null;
  install_date: string | null;
  last_maintenance_date: string | null;
  maintenance_interval_months: number | null;
  labor_warranty_years: number | null;
  equipment_warranty_years: number | null;
  completed_by_name: string | null;
  customer?: { ship_to_first_name?: string | null; ship_to_last_name?: string | null; ship_to_business_name?: string | null; account_number?: string | null; ship_to_address?: string | null; ship_to_city?: string | null; ship_to_state?: string | null; status?: string | null } | null;
  appointment?: { appointment_number?: string | null; visit_type?: string | null } | null;
}

const fmt = (d: string | null) => (d ? `${d.slice(5, 7)}-${d.slice(8, 10)}-${d.slice(0, 4)}` : "—");

export default function InstallationsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const today = new Date().toISOString().slice(0, 10);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("installation_records")
      .select("*, customer:customer_registrations(ship_to_first_name, ship_to_last_name, ship_to_business_name, account_number, ship_to_address, ship_to_city, ship_to_state, status), appointment:appointments(appointment_number, visit_type)")
      .order("install_date", { ascending: false, nullsFirst: false })
      .limit(1000);
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as any) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this installation record?")) return;
    const { error } = await supabase.from("installation_records").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    load();
  }

  async function logMaintenance(id: string) {
    const d = prompt("Maintenance completed on (YYYY-MM-DD):", today);
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const { error } = await supabase.from("installation_records").update({ last_maintenance_date: d }).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Maintenance logged" });
    load();
  }

  const groups = useMemo(() => {
    const q = search.toLowerCase();
    const out: Record<string, { key: string; customer: Row["customer"]; items: (Row & { color: WarrantyColor })[] }> = {};
    rows.forEach((r) => {
      const color = warrantyStatus(r, today).color;
      if (statusFilter !== "all" && color !== statusFilter) return;
      const c = r.customer;
      const hay = `${c?.ship_to_business_name || ""} ${c?.ship_to_first_name || ""} ${c?.ship_to_last_name || ""} ${c?.account_number || ""} ${r.item_type} ${r.brand_name || ""} ${r.model_number || ""} ${r.serial_number || ""} ${r.appointment?.appointment_number || ""}`.toLowerCase();
      if (q && !hay.includes(q)) return;
      const key = r.customer_id || "none";
      (out[key] ||= { key, customer: c, items: [] }).items.push({ ...r, color });
    });
    return Object.values(out);
  }, [rows, search, statusFilter, today]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">We Installed — History Report</h2>
          <p className="text-sm text-muted-foreground">Green = warranty active · Yellow = maintenance overdue under 90 days · Red = over 90 days, warranty VOID · Magenta = expired</p>
        </div>
        <Button onClick={() => navigate("/admin/installations/add")}><Plus className="w-4 h-4 mr-1" /> We Installed</Button>
      </div>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Input placeholder="Search customer, ID, item, job #, serial..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(WARRANTY_LABEL) as WarrantyColor[]).map((k) => <SelectItem key={k} value={k}>{WARRANTY_LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{groups.length} customer(s)</span>
      </Card>

      {loading ? (
        <Card className="p-6 text-center text-muted-foreground">Loading...</Card>
      ) : groups.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">No installation records found.</Card>
      ) : groups.map((g) => {
        const c = g.customer;
        const blacklisted = /black/i.test(c?.status || "");
        return (
          <Card key={g.key} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 border-b">
              <span className="font-mono text-sm font-semibold">{c?.account_number || "No ID"}</span>
              <span className="font-medium">
                {c?.ship_to_business_name ? `${c.ship_to_business_name} — ` : ""}{c?.ship_to_first_name} {c?.ship_to_last_name}
                {c?.ship_to_address ? `: ${c.ship_to_address}${c.ship_to_city ? `, ${c.ship_to_city}` : ""}${c.ship_to_state ? `, ${c.ship_to_state}` : ""}` : ""}
              </span>
              <Badge variant={blacklisted ? "destructive" : "secondary"} className="ml-auto">{blacklisted ? "Black Listed Customer" : "Active Customer"}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="p-2">Installation Date</th>
                    <th className="p-2">Item</th>
                    <th className="p-2">Job Number</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Installed By</th>
                    <th className="p-2">Next Maintenance</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 whitespace-nowrap">{fmt(r.install_date)}</td>
                      <td className="p-2">{r.item_type}{r.brand_name ? <div className="text-xs text-muted-foreground">{r.brand_name} {r.model_number || ""}</div> : null}</td>
                      <td className="p-2 font-mono text-xs">{r.appointment?.appointment_number || "—"}</td>
                      <td className="p-2">{r.appointment?.visit_type || `${r.item_type} Installation`}</td>
                      <td className="p-2">{r.completed_by_name || "—"}</td>
                      <td className="p-2 whitespace-nowrap">{fmt(warrantyStatus(r, today).dueDate)}</td>
                      <td className="p-2"><Badge className={WARRANTY_CLASS[r.color]}>{WARRANTY_LABEL[r.color]}</Badge></td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" title="Log maintenance" onClick={() => logMaintenance(r.id)}><Wrench className="w-4 h-4" /></Button>
                        <Button asChild size="sm" variant="ghost"><Link to={`/admin/installations/add?id=${r.id}`}><Pencil className="w-4 h-4" /></Link></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
