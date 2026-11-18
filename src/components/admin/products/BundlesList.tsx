import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2 } from "lucide-react";
import { PACKAGE_LABELS, PackageKey } from "@/lib/bundles";
import { money } from "./bundle/BundleEditor";

export const bundlePrice = (b: { price_override: number | null; total_listed: number }) => Number(b.price_override ?? b.total_listed ?? 0);

export function useBundles() {
  return useQuery({
    queryKey: ["product-bundles"], staleTime: 30000,
    queryFn: async () => (await supabase.from("product_bundles").select("*").order("name").range(0, 199)).data || [],
  });
}

export default function BundlesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useBundles();
  const rows = data.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
  const refresh = () => qc.invalidateQueries({ queryKey: ["product-bundles"] });
  const duplicate = async (b: (typeof data)[number]) => {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = b;
    const { error } = await supabase.from("product_bundles").insert({ ...rest, name: `${b.name} (copy)`, is_showing: false });
    if (error) return toast({ title: "Could not duplicate", description: error.message, variant: "destructive" });
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this bundle? Estimates that used it keep their saved copy.")) return;
    const { error } = await supabase.from("product_bundles").delete().eq("id", id);
    if (error) return toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    refresh();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold">Bundles</h2>
        <div className="flex gap-2">
          <Input className="w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bundles" />
          <Button onClick={() => navigate("/admin/products/bundle-maker")}><Plus className="h-4 w-4 mr-2" />New Bundle</Button>
        </div>
      </div>
      <table className="w-full text-sm border rounded-md">
        <thead><tr className="border-b text-left bg-muted/50"><th className="p-2">Name</th><th>Package</th><th className="text-right">Our Cost</th><th className="text-right">Price</th><th className="pl-4">Website</th><th /></tr></thead>
        <tbody>
          {isLoading ? <tr><td className="p-3" colSpan={6}>Loading…</td></tr> : rows.length === 0 ? <tr><td className="p-3 text-muted-foreground" colSpan={6}>No bundles yet.</td></tr> :
            rows.map((b) => (
              <tr key={b.id} className="border-b hover:bg-muted cursor-pointer" onClick={() => navigate(`/admin/products/bundle-maker?id=${b.id}`)}>
                <td className="p-2 font-medium">{b.name}</td>
                <td>{PACKAGE_LABELS[b.package as PackageKey] || b.package}</td>
                <td className="text-right">{money(Number(b.total_our_cost))}</td>
                <td className="text-right font-semibold">{money(bundlePrice(b))}</td>
                <td className="pl-4">{b.is_showing ? <Badge>Showing</Badge> : <Badge variant="secondary">Hidden</Badge>}</td>
                <td className="text-right p-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicate(b)}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
