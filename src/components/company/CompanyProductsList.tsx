import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";

interface CompanyProductsListProps {
  companyId: string;
  onProductClick: (productId: string) => void;
}

const ITEMS_PER_PAGE = 12;

const CompanyProductsList = ({ companyId, onProductClick }: CompanyProductsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [currentPage, setCurrentPage] = useState(1);

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
    return Array.from(cats).sort() as string[];
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
    if (selectedCategories.length > 0) {
      list = list.filter((p) => p.category && selectedCategories.includes(p.category));
    }
    return list;
  }, [products, searchTerm, selectedCategories]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page when filters change
  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Our Products</h1>
        <p className="text-muted-foreground">Browse our selection of quality products and supplies.</p>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-none h-9 w-9 ${viewMode === "card" ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
            onClick={() => setViewMode("card")}
            aria-label="Card view"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-none h-9 w-9 ${viewMode === "list" ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Category Sidebar */}
        {categories.length > 0 && (
          <aside className="hidden md:block w-52 shrink-0">
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {cat}
                  </span>
                </label>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <Button
                variant="link"
                size="sm"
                className="mt-3 px-0 text-xs"
                onClick={() => { setSelectedCategories([]); setCurrentPage(1); }}
              >
                Clear all
              </Button>
            )}
          </aside>
        )}

        {/* Products Content */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No products found.</div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              </p>

              {viewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginated.map((product) => {
                    const images = product.spot_images as string[] | null;
                    const thumbnail = images?.[0];
                    return (
                      <div
                        key={product.id}
                        onClick={() => onProductClick(product.id)}
                        className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="aspect-[4/3] bg-muted overflow-hidden">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={product.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-foreground truncate text-base group-hover:text-primary transition-colors">
                            {product.product_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {product.category && (
                              <span className="text-xs bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full font-medium">
                                {product.category}
                              </span>
                            )}
                            {(product.brands as any)?.name && (
                              <span className="text-xs text-muted-foreground">
                                {(product.brands as any).name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginated.map((product) => {
                    const images = product.spot_images as string[] | null;
                    const thumbnail = images?.[0];
                    return (
                      <div
                        key={product.id}
                        onClick={() => onProductClick(product.id)}
                        className="group cursor-pointer flex items-center gap-4 rounded-xl border border-border bg-card p-3 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="w-20 h-20 shrink-0 rounded-lg bg-muted overflow-hidden">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={product.product_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {product.product_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {product.category && (
                              <span className="text-xs bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full font-medium">
                                {product.category}
                              </span>
                            )}
                            {(product.brands as any)?.name && (
                              <span className="text-xs text-muted-foreground">
                                {(product.brands as any).name}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        if (totalPages <= 7) return true;
                        if (page === 1 || page === totalPages) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && page - prev > 1;
                        return (
                          <span key={page} className="flex items-center">
                            {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
                            <Button
                              variant={page === currentPage ? "default" : "ghost"}
                              size="sm"
                              className="w-9 h-9 p-0"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </span>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProductsList;
