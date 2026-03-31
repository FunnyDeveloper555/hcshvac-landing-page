import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useCallback } from "react";
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight, X } from "lucide-react";
import ProductFilterSidebar from "@/components/company/ProductFilterSidebar";
import ProductListItem from "@/components/company/ProductListItem";
import ProductCardItem from "@/components/company/ProductCardItem";

const ITEMS_PER_PAGE = 12;

const Products = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("name_asc");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), companies(name), product_variants(sku, price, variant_name, attributes)")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filterSections = useMemo(() => {
    const catMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    products.forEach((p) => {
      if (p.category) catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
      const bn = (p.brands as any)?.name;
      if (bn) brandMap.set(bn, (brandMap.get(bn) || 0) + 1);
    });
    const sections = [];
    if (catMap.size > 0) {
      sections.push({
        label: "Category",
        key: "category",
        options: Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).map(([v, c]) => ({ value: v, count: c })),
      });
    }
    if (brandMap.size > 0) {
      sections.push({
        label: "Brand",
        key: "brand",
        options: Array.from(brandMap.entries()).sort((a, b) => b[1] - a[1]).map(([v, c]) => ({ value: v, count: c })),
      });
    }
    return sections;
  }, [products]);

  const hasActiveFilters = Object.values(selectedFilters).some((v) => v.length > 0);

  const activeFilterTags = useMemo(() => {
    const tags: { section: string; label: string; value: string }[] = [];
    Object.entries(selectedFilters).forEach(([key, values]) => {
      const section = filterSections.find((s) => s.key === key);
      values.forEach((v) => tags.push({ section: section?.label || key, label: v, value: v }));
    });
    return tags;
  }, [selectedFilters, filterSections]);

  const handleToggleFilter = useCallback((sectionKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[sectionKey] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [sectionKey]: next };
    });
    setCurrentPage(1);
  }, []);

  const handleClearAll = useCallback(() => { setSelectedFilters({}); setCurrentPage(1); }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((p) =>
        p.product_name.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        (p.brands as any)?.name?.toLowerCase().includes(term) ||
        p.spot_text?.toLowerCase().includes(term)
      );
    }
    const cats = selectedFilters.category || [];
    if (cats.length > 0) list = list.filter((p) => p.category && cats.includes(p.category));
    const brands = selectedFilters.brand || [];
    if (brands.length > 0) list = list.filter((p) => { const bn = (p.brands as any)?.name; return bn && brands.includes(bn); });

    switch (sortBy) {
      case "name_asc": list.sort((a, b) => a.product_name.localeCompare(b.product_name)); break;
      case "name_desc": list.sort((a, b) => b.product_name.localeCompare(a.product_name)); break;
      case "newest": list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return list;
  }, [products, searchTerm, selectedFilters, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Our Products</h1>
          <p className="text-muted-foreground mb-6">Browse our selection of quality HVAC products and supplies.</p>

          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search within results..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Active filter tags */}
          {activeFilterTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {activeFilterTags.map((tag) => (
                <span key={`${tag.section}-${tag.value}`} className="inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                  {tag.section}: {tag.label}
                  <button onClick={() => handleToggleFilter(filterSections.find((s) => s.label === tag.section)?.key || "", tag.value)} className="hover:bg-primary-foreground/20 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <p className="text-sm text-muted-foreground font-medium">{filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px] h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Display Order</SelectItem>
                    <SelectItem value="name_asc">Name A–Z</SelectItem>
                    <SelectItem value="name_desc">Name Z–A</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-0.5 text-muted-foreground">
                <span className="text-sm mr-1">View</span>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${viewMode === "list" ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`} onClick={() => setViewMode("list")} aria-label="List view"><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${viewMode === "card" ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : ""}`} onClick={() => setViewMode("card")} aria-label="Grid view"><LayoutGrid className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            {filterSections.length > 0 && (
              <div className="hidden md:block">
                <ProductFilterSidebar sections={filterSections} selected={selectedFilters} onToggle={handleToggleFilter} onClearAll={handleClearAll} hasActiveFilters={hasActiveFilters} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card animate-pulse h-40" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">No products found.</div>
              ) : (
                <>
                  {viewMode === "list" ? (
                    <div className="space-y-3">
                      {paginated.map((product) => (
                        <ProductListItem key={product.id} product={product} onClick={() => navigate(`/products/${product.id}`)} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {paginated.map((product) => (
                        <ProductCardItem key={product.id} product={product} onClick={() => navigate(`/products/${product.id}`)} />
                      ))}
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            return Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev && page - prev > 1;
                            return (
                              <span key={page} className="flex items-center">
                                {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
                                <Button variant={page === currentPage ? "default" : "ghost"} size="sm" className="w-9 h-9 p-0" onClick={() => setCurrentPage(page)}>{page}</Button>
                              </span>
                            );
                          })}
                      </div>
                      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
