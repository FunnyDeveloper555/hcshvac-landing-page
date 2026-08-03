import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Row {
  id: string;
  item_type: string | null;
  brand_name: string | null;
  model_number: string | null;
  serial_number: string | null;
  tons_btu: string | null;
  seer_rating: string | null;
  assign_type: string;
  customer_id: string | null;
  company_id: string | null;
  received_date: string | null;
  status: string;
  quantity: number;
}

interface Props {
  mode: "receiving" | "history";
}

export default function InventoryList({ mode }: Props) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("inventory_items").select("*").order("created_at", { ascending: false }).limit(500);
    if (mode === "receiving") query = query.in("status", ["received", "assigned"]);
    const { data } = await query;
    const list = (data as Row[]) || [];
    setRows(list);

    const custIds = Array.from(new Set(list.map((r) => r.customer_id).filter(Boolean))) as string[];
    const compIds = Array.from(new Set(list.map((r) => r.company_id).filter(Boolean))) as string[];
    const map: Record<string, string> = {};
    if (custIds.length) {
      const { data: cs } = await supabase
        .from("customer_registrations")
        .select("id, ship_to_first_name, ship_to_last_name, ship_to_business_name")
        .in("id", custIds);
      (cs || []).forEach((c: any) => {
        map[c.id] = c.ship_to_business_name || `${c.ship_to_first_name || ""} ${c.ship_to_last_name || ""}`.trim();
      });
    }
    if (compIds.length) {
      const { data: cos } = await supabase.from("companies").select("id, name").in("id", compIds);
      (cos || []).forEach((c: any) => { map[c.id] = c.name; });
    }
    setNames(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [mode]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Item removed" });
    load();
  };

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [r.item_type, r.brand_name, r.model_number, r.serial_number]
      .some((v) => (v || "").toLowerCase().includes(s));
  });

  const assignedTo = (r: Row) =>
    r.assign_type === "customer"
      ? names[r.customer_id || ""] || "—"
      : names[r.company_id || ""] || "—";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {mode === "receiving" ? "Inventory Receiving" : "Inventory History"}
        </h2>
        <div className="flex items-center gap-2">
          <Input
            className="h-8 w-48"
            placeholder="Search type, brand, serial…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button size="sm" onClick={() => navigate("/admin/inventory/add")}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add New Inventory
          </Button>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-muted-foreground">No inventory items yet.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="p-2">Item Type</th>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Model</th>
                      <th className="p-2">Serial</th>
                      <th className="p-2">Specs</th>
                      <th className="p-2">Assigned To</th>
                      <th className="p-2">Received</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="p-2">{r.item_type || "—"}</td>
                        <td className="p-2">{r.brand_name || "—"}</td>
                        <td className="p-2">{r.model_number || "—"}</td>
                        <td className="p-2">{r.serial_number || "—"}</td>
                        <td className="p-2 text-muted-foreground">
                          {[r.tons_btu, r.seer_rating ? `${r.seer_rating} SEER` : ""].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="p-2">
                          <span className="capitalize text-muted-foreground mr-1">{r.assign_type}:</span>
                          {assignedTo(r)}
                        </td>
                        <td className="p-2">{r.received_date || "—"}</td>
                        <td className="p-2"><Badge variant="secondary" className="capitalize">{r.status}</Badge></td>
                        <td className="p-2 text-right whitespace-nowrap">
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/inventory/add?id=${r.id}`)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {filtered.map((r) => (
                  <div key={r.id} className="p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{r.item_type || "—"} · {r.brand_name || "—"}</p>
                        <p className="text-muted-foreground">{r.model_number || "—"}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{r.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">Serial: {r.serial_number || "—"}</p>
                    <p className="text-muted-foreground capitalize">{r.assign_type}: {assignedTo(r)}</p>
                    <p className="text-muted-foreground">Received: {r.received_date || "—"}</p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/inventory/add?id=${r.id}`)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(r.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
