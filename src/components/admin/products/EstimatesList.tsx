import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const money = (n: any) => Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function EstimatesList() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["product-estimates"], staleTime: 30000,
    queryFn: async () => (await supabase.from("product_estimates").select("id, estimate_number, data, total_our_cost, total_listed, created_at").order("created_at", { ascending: false }).range(0, 99)).data || [],
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Estimates</h2>
        <Button onClick={() => navigate("/admin/products/bundle-maker")}><Plus className="h-4 w-4 mr-2" />New Estimate</Button>
      </div>
      <table className="w-full text-sm border rounded-md">
        <thead><tr className="border-b text-left bg-muted/50"><th className="p-2">Estimate #</th><th>Customer</th><th>Date</th><th className="text-right">Our Cost (B4)</th><th className="text-right p-2">Listed (B4)</th></tr></thead>
        <tbody>
          {isLoading ? <tr><td className="p-3" colSpan={5}>Loading…</td></tr> : data.length === 0 ? <tr><td className="p-3 text-muted-foreground" colSpan={5}>No estimates yet.</td></tr> :
            data.map((e: any) => (
              <tr key={e.id} className="border-b cursor-pointer hover:bg-muted" onClick={() => navigate(`/admin/products/bundle-maker?id=${e.id}`)}>
                <td className="p-2 font-medium">{e.estimate_number}</td>
                <td>{[e.data?.customer?.bill_to_first_name, e.data?.customer?.bill_to_last_name].filter(Boolean).join(" ") || "—"}</td>
                <td>{e.data?.estDate || e.created_at.slice(0, 10)}</td>
                <td className="text-right">{money(e.total_our_cost)}</td>
                <td className="text-right p-2">{money(e.total_listed)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
