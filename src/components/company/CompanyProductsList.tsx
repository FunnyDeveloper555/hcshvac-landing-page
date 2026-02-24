import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface CompanyProductsListProps {
  companyId: string;
  onProductClick: (productId: string) => void;
}

const CompanyProductsList = ({ companyId, onProductClick }: CompanyProductsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["company-products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name)")
        .eq("company_id", companyId)
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.product_name.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          (p.brands as any)?.name?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter && categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    return list;
  }, [products, searchTerm, categoryFilter]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card animate-pulse h-72" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Our Products</h1>
      <p className="text-muted-foreground mb-8">Browse our selection of quality products and supplies.</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {categories.length > 1 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => {
            const images = product.spot_images as string[] | null;
            const thumbnail = images?.[0];
            return (
              <div
                key={product.id}
                onClick={() => onProductClick(product.id)}
                className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate">{product.product_name}</h3>
                  {product.category && (
                    <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                  )}
                  {(product.brands as any)?.name && (
                    <p className="text-sm text-muted-foreground mt-1">{(product.brands as any).name}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyProductsList;
