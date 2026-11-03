import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, Package } from "lucide-react";

type Row = { id: string; product_name: string | null; brand_name: string | null; category: string | null; status: string | null; spot_images: unknown };

export default function ProductsPageSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["website-products-page"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, brand_name, category, status, spot_images")
        .in("status", ["active_showing", "discontinued_showing"])
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("product_name");
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            The website's Products page lists these items from the Products module. Products set to a "showing" status appear automatically.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/products"><Package className="mr-2 h-4 w-4" />Manage in Products module</Link>
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-2 text-sm text-muted-foreground">{data?.length ?? 0} products on the website</div>
          <ul className="divide-y">
            {data?.map((p) => {
              const img = Array.isArray(p.spot_images) ? (p.spot_images[0] as string | undefined) : undefined;
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                    {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.product_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{[p.brand_name, p.category].filter(Boolean).join(" · ")}</div>
                  </div>
                  {p.status === "discontinued_showing" && <Badge variant="secondary">Discontinued</Badge>}
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/admin/products/add?edit=${p.id}`}><ExternalLink className="h-4 w-4" /></Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
