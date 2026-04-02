import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Trash2, Loader2, Pencil, Plus, ArrowUp, ArrowDown, ArrowUpDown, Search, X, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";
import ProductFilterSidebar from "@/components/company/ProductFilterSidebar";

type SortField = "product_name" | "category" | "company" | "brand" | "poise" | "afue" | "stages" | "voltage" | "refrigerant" | "tons_btu" | "seer_rating" | "status";
type SortDirection = "asc" | "desc" | null;

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const ProductsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, companies:company_id (name), brands:brand_id (name)`)
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

  // Build filter sections with counts from raw products
  // Subcategories shared by both parent equipment categories
  const EQUIPMENT_SUBCATEGORIES = [
    "Ac Condenser Only",
    "Boiler (Hot Water)",
    "Boiler (Steam)",
    "Boiler (Tankless)",
    "Coil (Only)",
    "Furnace Only",
    "Furnace and Coil",
    "Furnace, Coil, and Condenser",
    "Furnace, Coil, Condenser, and Water Heater",
    "Water Heater",
    "Tankless Water Heater",
    "Mini Splitt",
  ];

  const PARENT_CATEGORIES = [
    { label: "HVAC Equipment Residential", prefix: "HVAC Equipment Residential" },
    { label: "HVAC Equipment Commercial", prefix: "HVAC Equipment Commercial" },
  ];

  const filterSections = useMemo(() => {
    if (!products) return [];
    const catMap = new Map<string, number>();
    const compMap = new Map<string, number>();
    const brandMap = new Map<string, number>();
    const poiseMap = new Map<string, number>();
    const afueMap = new Map<string, number>();
    const widthMap = new Map<string, number>();
    const stagesMap = new Map<string, number>();
    const voltageMap = new Map<string, number>();
    const refrigerantMap = new Map<string, number>();
    const tonsBtuMap = new Map<string, number>();
    const seerMap = new Map<string, number>();
    const statusMap = new Map<string, number>();

    products.forEach((p: any) => {
      if (p.category) catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
      const comp = (p.companies as any)?.name;
      if (comp) compMap.set(comp, (compMap.get(comp) || 0) + 1);
      if (p.brand_name) brandMap.set(p.brand_name, (brandMap.get(p.brand_name) || 0) + 1);
      if (p.poise) poiseMap.set(p.poise, (poiseMap.get(p.poise) || 0) + 1);
      if (p.afue) afueMap.set(p.afue, (afueMap.get(p.afue) || 0) + 1);
      if (p.width_size) widthMap.set(p.width_size, (widthMap.get(p.width_size) || 0) + 1);
      if (p.stages) stagesMap.set(p.stages, (stagesMap.get(p.stages) || 0) + 1);
      if ((p as any).voltage) voltageMap.set((p as any).voltage, (voltageMap.get((p as any).voltage) || 0) + 1);
      if ((p as any).refrigerant_type) refrigerantMap.set((p as any).refrigerant_type, (refrigerantMap.get((p as any).refrigerant_type) || 0) + 1);
      if ((p as any).tons_btu) tonsBtuMap.set((p as any).tons_btu, (tonsBtuMap.get((p as any).tons_btu) || 0) + 1);
      if ((p as any).seer_rating) seerMap.set((p as any).seer_rating, (seerMap.get((p as any).seer_rating) || 0) + 1);
      const st = p.is_published ? "Published" : "Draft";
      statusMap.set(st, (statusMap.get(st) || 0) + 1);
    });

    const toOpts = (m: Map<string, number>) =>
      Array.from(m.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));

    // Build hierarchical category options (only HVAC Equipment categories)
    const categoryOptions: { value: string; label?: string; count: number; children?: { value: string; label?: string; count: number }[] }[] = [];

    PARENT_CATEGORIES.forEach(({ label, prefix }) => {
      const children = EQUIPMENT_SUBCATEGORIES.map((sub) => {
        const fullKey = `${prefix} - ${sub}`;
        return { value: fullKey, label: sub, count: catMap.get(fullKey) || 0 };
      });
      const parentCount = children.reduce((sum, c) => sum + c.count, 0);
      categoryOptions.push({ value: label, count: parentCount, children });
    });

    const POISE_OPTS = [{ value: "Upflow", count: poiseMap.get("Upflow") || 0 }, { value: "Downflow", count: poiseMap.get("Downflow") || 0 }];
    const AFUE_OPTS = ["80%", "92%", "95%", "96%", "97%", "98%"].map((v) => ({ value: v, count: afueMap.get(v) || 0 }));
    const WIDTH_OPTS = ['14.5"', '17.5"', '21"', '24.5"'].map((v) => ({ value: v, count: widthMap.get(v) || 0 }));
    const STAGES_OPTS = ["Single Stage", "Two Stage", "Two Stage Variable"].map((v) => ({ value: v, count: stagesMap.get(v) || 0 }));
    const VOLTAGE_OPTS = ["120V", "208V", "230V", "240V", "277V", "440V"].map((v) => ({ value: v, count: voltageMap.get(v) || 0 }));
    const REFRIGERANT_OPTS = ["R22", "R410a", "R32", "R454B", "R407C", "R134a"].map((v) => ({ value: v, count: refrigerantMap.get(v) || 0 }));
    const TONS_BTU_OPTS = ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton", "5 Ton", "7.5 Ton", "10 Ton", "12.5 Ton", "15 Ton", "20 Ton"].map((v) => ({ value: v, count: tonsBtuMap.get(v) || 0 }));
    const SEER_OPTS = ["13.2 SEER2", "14 SEER2", "14.3 SEER2", "15 SEER2", "15.2 SEER2", "16 SEER2", "17 SEER2", "18 SEER2", "19 SEER2", "20 SEER2", "21 SEER2"].map((v) => ({ value: v, count: seerMap.get(v) || 0 }));
    const BRAND_OPTS = ["Ameristar", "Durastar", "Rheem"].map((v) => ({ value: v, count: brandMap.get(v) || 0 }));

    return [
      { label: "Category", key: "category", options: categoryOptions },
      { label: "Brand", key: "brand", options: BRAND_OPTS },
      { label: "Poise", key: "poise", options: POISE_OPTS },
      { label: "AFUE", key: "afue", options: AFUE_OPTS },
      { label: "Width", key: "width", options: WIDTH_OPTS },
      { label: "Stages", key: "stages", options: STAGES_OPTS },
      { label: "Voltage", key: "voltage", options: VOLTAGE_OPTS },
      { label: "Refrigerant", key: "refrigerant", options: REFRIGERANT_OPTS },
      { label: "Company", key: "company", options: toOpts(compMap) },
      { label: "Status", key: "status", options: toOpts(statusMap) },
    ];
  }, [products]);

  const handleToggleFilter = (sectionKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[sectionKey] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [sectionKey]: next };
    });
    setCurrentPage(1);
  };

  const handleToggleGroup = (sectionKey: string, values: string[], select: boolean) => {
    setSelectedFilters((prev) => {
      const current = prev[sectionKey] || [];
      let next: string[];
      if (select) {
        next = [...new Set([...current, ...values])];
      } else {
        next = current.filter((v) => !values.includes(v));
      }
      return { ...prev, [sectionKey]: next };
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(selectedFilters).some((arr) => arr.length > 0) || searchTerm.trim() !== "";

  const handleClearAll = () => {
    setSelectedFilters({});
    setSearchTerm("");
    setSortField(null);
    setSortDirection(null);
    setCurrentPage(1);
  };

  const processedProducts = useMemo(() => {
    if (!products) return [];
    let filtered = [...products];

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

    const cats = selectedFilters.category || [];
    if (cats.length) filtered = filtered.filter((p) => cats.includes(p.category || ""));
    const comps = selectedFilters.company || [];
    if (comps.length) filtered = filtered.filter((p) => comps.includes((p.companies as any)?.name || ""));
    const brands = selectedFilters.brand || [];
    if (brands.length) filtered = filtered.filter((p: any) => brands.includes(p.brand_name || ""));
    const poises = selectedFilters.poise || [];
    if (poises.length) filtered = filtered.filter((p: any) => poises.includes(p.poise || ""));
    const afues = selectedFilters.afue || [];
    if (afues.length) filtered = filtered.filter((p: any) => afues.includes(p.afue || ""));
    const widths = selectedFilters.width || [];
    if (widths.length) filtered = filtered.filter((p: any) => widths.includes(p.width_size || ""));
    const stagesF = selectedFilters.stages || [];
    if (stagesF.length) filtered = filtered.filter((p: any) => stagesF.includes(p.stages || ""));
    const voltages = selectedFilters.voltage || [];
    if (voltages.length) filtered = filtered.filter((p: any) => voltages.includes(p.voltage || ""));
    const refrigerants = selectedFilters.refrigerant || [];
    if (refrigerants.length) filtered = filtered.filter((p: any) => refrigerants.includes(p.refrigerant_type || ""));
    const statuses = selectedFilters.status || [];
    if (statuses.length) filtered = filtered.filter((p) => statuses.includes(p.is_published ? "Published" : "Draft"));

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortField) {
          case "product_name": valA = a.product_name?.toLowerCase() ?? ""; valB = b.product_name?.toLowerCase() ?? ""; break;
          case "category": valA = a.category?.toLowerCase() ?? ""; valB = b.category?.toLowerCase() ?? ""; break;
          case "company": valA = (a.companies as any)?.name?.toLowerCase() ?? ""; valB = (b.companies as any)?.name?.toLowerCase() ?? ""; break;
          case "brand": valA = (a as any).brand_name?.toLowerCase() ?? ""; valB = (b as any).brand_name?.toLowerCase() ?? ""; break;
          case "poise": valA = (a as any).poise?.toLowerCase() ?? ""; valB = (b as any).poise?.toLowerCase() ?? ""; break;
          case "afue": valA = (a as any).afue ?? ""; valB = (b as any).afue ?? ""; break;
          case "stages": valA = (a as any).stages?.toLowerCase() ?? ""; valB = (b as any).stages?.toLowerCase() ?? ""; break;
          case "voltage": valA = (a as any).voltage?.toLowerCase() ?? ""; valB = (b as any).voltage?.toLowerCase() ?? ""; break;
          case "refrigerant": valA = (a as any).refrigerant_type?.toLowerCase() ?? ""; valB = (b as any).refrigerant_type?.toLowerCase() ?? ""; break;
          case "status": valA = a.is_published ? 1 : 0; valB = b.is_published ? 1 : 0; break;
        }
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [products, searchTerm, selectedFilters, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(processedProducts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = processedProducts.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else { setSortField(null); setSortDirection(null); }
    } else { setSortField(field); setSortDirection("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortDirection === "asc") return <ArrowUp className="h-3 w-3 ml-1 text-primary" />;
    return <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button className="flex items-center gap-0.5 hover:text-foreground transition-colors font-medium" onClick={() => handleSort(field)}>
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) {
      items.push(<PaginationItem key={1}><PaginationLink onClick={() => setCurrentPage(1)} isActive={safeCurrentPage === 1}>1</PaginationLink></PaginationItem>);
      if (start > 2) items.push(<PaginationItem key="e1"><PaginationEllipsis /></PaginationItem>);
    }
    for (let i = start; i <= end; i++) {
      items.push(<PaginationItem key={i}><PaginationLink onClick={() => setCurrentPage(i)} isActive={safeCurrentPage === i}>{i}</PaginationLink></PaginationItem>);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) items.push(<PaginationItem key="e2"><PaginationEllipsis /></PaginationItem>);
      items.push(<PaginationItem key={totalPages}><PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={safeCurrentPage === totalPages}>{totalPages}</PaginationLink></PaginationItem>);
    }
    return items;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Products</h2>
        <Button onClick={() => navigate("/admin/products/add")}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar filters – hidden on mobile/tablet */}
        <div className="hidden lg:block">
          <ProductFilterSidebar
            sections={filterSections}
            selected={selectedFilters}
            onToggle={handleToggleFilter}
            onToggleGroup={handleToggleGroup}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Right content */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Search bar + mobile filter trigger */}
          <div className="flex gap-3 items-center">
            {/* Mobile/Tablet filter drawer trigger */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden shrink-0 relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {Object.values(selectedFilters).some((a) => a.length > 0) && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {Object.values(selectedFilters).reduce((s, a) => s + a.length, 0)}
                    </span>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-6">
                  <ProductFilterSidebar
                    sections={filterSections}
                    selected={selectedFilters}
                    onToggle={handleToggleFilter}
                    onToggleGroup={handleToggleGroup}
                    onClearAll={handleClearAll}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>
              </DrawerContent>
            </Drawer>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearAll}><X className="h-4 w-4 mr-1" /> Clear All</Button>
            )}
          </div>

          {/* Active filter tags */}
          {Object.entries(selectedFilters).some(([, v]) => v.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedFilters).flatMap(([key, values]) =>
                values.map((v) => (
                  <Badge key={`${key}-${v}`} variant="secondary" className="gap-1 cursor-pointer" onClick={() => handleToggleFilter(key, v)}>
                    {v} <X className="h-3 w-3" />
                  </Badge>
                ))
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Showing {paginatedProducts.length} of {processedProducts.length} products
            {products && processedProducts.length !== products.length && ` (${products.length} total)`}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <SortableHead field="product_name">Product Name</SortableHead>
                  <SortableHead field="category">Category</SortableHead>
                  <SortableHead field="company">Company</SortableHead>
                  <SortableHead field="brand">Brand</SortableHead>
                  <SortableHead field="poise">Poise</SortableHead>
                  <SortableHead field="afue">AFUE</SortableHead>
                  <SortableHead field="stages">Stages</SortableHead>
                  <SortableHead field="voltage">Voltage</SortableHead>
                  <SortableHead field="refrigerant">Refrigerant</SortableHead>
                  <SortableHead field="status">Status</SortableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {(product.spot_images as string[] | null)?.length ? (
                        <img src={(product.spot_images as string[])[0]} alt={product.product_name} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell>{product.category || "—"}</TableCell>
                    <TableCell>{(product.companies as any)?.name || "—"}</TableCell>
                    <TableCell>{product.brand_name || "—"}</TableCell>
                    <TableCell>{product.poise || "—"}</TableCell>
                    <TableCell>{product.afue || "—"}</TableCell>
                    <TableCell>{(product as any).stages || "—"}</TableCell>
                    <TableCell>{(product as any).voltage || "—"}</TableCell>
                    <TableCell>{(product as any).refrigerant_type || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_published ? "default" : "secondary"}>
                        {product.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/products/add?id=${product.id}`)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id, product.product_name)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
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
                  <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (<SelectItem key={s} value={String(s)}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className={safeCurrentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className={safeCurrentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsList;
