import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Trash2, Loader2, Pencil, Plus, ArrowUp, ArrowDown, ArrowUpDown, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";

type SortField = "product_name" | "category" | "company" | "brand" | "weight" | "stick_count" | "status";
type SortDirection = "asc" | "desc" | null;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const ProductsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Column filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          companies:company_id (name),
          brands:brand_id (name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, productName: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product deleted successfully" });
      logAction("delete", "vendor", id, { product_name: productName });
      refetch();
    }
  };

  // Derive unique filter options
  const filterOptions = useMemo(() => {
    if (!products) return { categories: [], companies: [], brands: [] };
    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
    const companies = [...new Set(products.map((p) => (p.companies as any)?.name).filter(Boolean))] as string[];
    const brands = [...new Set(products.map((p) => (p.brands as any)?.name).filter(Boolean))] as string[];
    return { categories: categories.sort(), companies: companies.sort(), brands: brands.sort() };
  }, [products]);

  // Apply search, filters, sorting
  const processedProducts = useMemo(() => {
    if (!products) return [];
    let filtered = [...products];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.product_name?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          (p.companies as any)?.name?.toLowerCase().includes(term) ||
          (p.brands as any)?.name?.toLowerCase().includes(term) ||
          p.spot_text?.toLowerCase().includes(term)
      );
    }

    // Column filters
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (statusFilter !== "all") {
      const pub = statusFilter === "published";
      filtered = filtered.filter((p) => p.is_published === pub);
    }
    if (companyFilter !== "all") {
      filtered = filtered.filter((p) => (p.companies as any)?.name === companyFilter);
    }
    if (brandFilter !== "all") {
      filtered = filtered.filter((p) => (p.brands as any)?.name === brandFilter);
    }

    // Sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortField) {
          case "product_name":
            valA = a.product_name?.toLowerCase() ?? "";
            valB = b.product_name?.toLowerCase() ?? "";
            break;
          case "category":
            valA = a.category?.toLowerCase() ?? "";
            valB = b.category?.toLowerCase() ?? "";
            break;
          case "company":
            valA = (a.companies as any)?.name?.toLowerCase() ?? "";
            valB = (b.companies as any)?.name?.toLowerCase() ?? "";
            break;
          case "brand":
            valA = (a.brands as any)?.name?.toLowerCase() ?? "";
            valB = (b.brands as any)?.name?.toLowerCase() ?? "";
            break;
          case "weight":
            valA = a.weight ?? 0;
            valB = b.weight ?? 0;
            break;
          case "stick_count":
            valA = a.stick_count ?? 0;
            valB = b.stick_count ?? 0;
            break;
          case "status":
            valA = a.is_published ? 1 : 0;
            valB = b.is_published ? 1 : 0;
            break;
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, statusFilter, companyFilter, brandFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedProducts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = processedProducts.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  // Reset page on filter/search change
  const resetPage = () => setCurrentPage(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortDirection === "asc") return <ArrowUp className="h-3 w-3 ml-1 text-primary" />;
    return <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button
        className="flex items-center gap-0.5 hover:text-foreground transition-colors font-medium"
        onClick={() => handleSort(field)}
      >
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  const handleClearAll = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCompanyFilter("all");
    setBrandFilter("all");
    setSortField(null);
    setSortDirection(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || categoryFilter !== "all" || statusFilter !== "all" || companyFilter !== "all" || brandFilter !== "all";

  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => setCurrentPage(1)} isActive={safeCurrentPage === 1}>1</PaginationLink>
        </PaginationItem>
      );
      if (start > 2) items.push(<PaginationItem key="e1"><PaginationEllipsis /></PaginationItem>);
    }
    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => setCurrentPage(i)} isActive={safeCurrentPage === i}>{i}</PaginationLink>
        </PaginationItem>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) items.push(<PaginationItem key="e2"><PaginationEllipsis /></PaginationItem>);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={safeCurrentPage === totalPages}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Products</h2>
        <Button onClick={() => navigate("/admin/products/add")}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filterOptions.categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {filterOptions.companies.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {filterOptions.brands.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearAll}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {paginatedProducts.length} of {processedProducts.length} products
          {products && processedProducts.length !== products.length && ` (${products.length} total)`}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead field="product_name">Product Name</SortableHead>
              <SortableHead field="category">Category</SortableHead>
              <SortableHead field="company">Company</SortableHead>
              <SortableHead field="brand">Brand</SortableHead>
              <SortableHead field="weight">Weight</SortableHead>
              <SortableHead field="stick_count">Sticks</SortableHead>
              <SortableHead field="status">Status</SortableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.product_name}</TableCell>
                <TableCell>{product.category || "—"}</TableCell>
                <TableCell>{(product.companies as any)?.name || "—"}</TableCell>
                <TableCell>{(product.brands as any)?.name || "—"}</TableCell>
                <TableCell>{product.weight ?? "—"}</TableCell>
                <TableCell>{product.stick_count ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={product.is_published ? "default" : "secondary"}>
                    {product.is_published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/products/add?id=${product.id}`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id, product.product_name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {hasActiveFilters ? "No products match your filters." : "No products found. Add your first one!"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={safeCurrentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={safeCurrentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
