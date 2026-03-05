import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown, ChevronRight, ChevronUp, Search, Columns3, Eye, Pencil, Loader2,
  Globe, Hash, Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Company {
  id: string;
  name: string;
  slug?: string | null;
  company_phone?: string | null;
  company_email_primary?: string | null;
  company_support_email?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_state?: string | null;
  company_zip_code?: string | null;
  is_active: boolean | null;
  logo_url?: string | null;
  created_at: string;
  display_order: number;
  primary_color?: string | null;
  theme_style?: string | null;
  website_title?: string | null;
  website_tagline?: string | null;
  website_description?: string | null;
  hero_image_url?: string | null;
  financing_enabled?: boolean | null;
  financing_provider?: string | null;
  financing_url?: string | null;
  poc_first_name?: string | null;
  poc_last_name?: string | null;
  poc_phone?: string | null;
  poc_email?: string | null;
  poc_title?: string | null;
  secondary_poc_first_name?: string | null;
  secondary_poc_last_name?: string | null;
  secondary_poc_phone?: string | null;
  secondary_poc_email?: string | null;
  secondary_poc_title?: string | null;
  services_provided?: any;
  service_areas?: any;
  brands_installed?: any;
  brands_serviced?: any;
  hvac_equipment_install?: any;
  hvac_equipment_service?: any;
  hvac_equipment_repair?: any;
  plumbing_equipment_install?: any;
  plumbing_equipment_service?: any;
  plumbing_equipment_repair?: any;
  coupons?: any;
}

type SortKey = "name" | "company_city" | "company_state" | "company_phone" | "created_at" | "display_order";
type SortDir = "asc" | "desc";

interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Company Name", defaultVisible: true },
  { key: "company_city", label: "City", defaultVisible: true },
  { key: "company_state", label: "State", defaultVisible: true },
  { key: "company_phone", label: "Phone", defaultVisible: true },
  { key: "slug", label: "Slug", defaultVisible: true },
  { key: "company_email_primary", label: "Email", defaultVisible: false },
  { key: "display_order", label: "Order", defaultVisible: false },
  { key: "created_at", label: "Created", defaultVisible: true },
];

const SORTABLE_KEYS: SortKey[] = ["name", "company_city", "company_state", "company_phone", "created_at", "display_order"];

interface Props {
  companies: Company[];
  loading: boolean;
  onRefresh: () => void;
  showActivateAction?: boolean;
  showDeactivateAction?: boolean;
  showDeleteAction?: boolean;
}

const jsonLength = (val: any): number => {
  if (!val) return 0;
  if (Array.isArray(val)) return val.length;
  if (typeof val === "object") return Object.keys(val).length;
  return 0;
};

const CompanyDataTable = ({
  companies,
  loading,
  onRefresh,
  showActivateAction,
  showDeactivateAction,
  showDeleteAction,
}: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    () => new Set(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = (key: string) => {
    if (!SORTABLE_KEYS.includes(key as SortKey)) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = [...companies];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.company_city?.toLowerCase().includes(q) ||
          c.company_state?.toLowerCase().includes(q) ||
          c.company_phone?.includes(q) ||
          c.slug?.toLowerCase().includes(q) ||
          c.company_email_primary?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? "";
      const bVal = (b as any)[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [companies, search, sortKey, sortDir]);

  const toggleCol = (key: string) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleActivate = async (id: string) => {
    const { error } = await supabase.from("companies").update({ is_active: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to activate company", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Company activated" });
      onRefresh();
    }
  };

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase.from("companies").update({ is_active: false }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to deactivate company", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Company deactivated" });
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this company?")) return;
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete company", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Company deleted" });
      onRefresh();
    }
  };

  const renderCellValue = (company: Company, key: string) => {
    switch (key) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            {company.logo_url && (
              <img src={company.logo_url} alt="" className="w-8 h-8 object-contain rounded" />
            )}
            <span className="font-medium">{company.name}</span>
          </div>
        );
      case "slug":
        return company.slug ? (
          <Badge variant="secondary" className="font-mono text-xs">{company.slug}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case "created_at":
        return new Date(company.created_at).toLocaleDateString();
      default:
        return (company as any)[key] || <span className="text-muted-foreground text-xs">—</span>;
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCols = ALL_COLUMNS.filter((c) => visibleCols.has(c.key));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, city, state, phone, slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {ALL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleCols.has(col.key)}
                  onCheckedChange={() => toggleCol(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} of {companies.length} companies
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              {activeCols.map((col) => (
                <TableHead
                  key={col.key}
                  className={SORTABLE_KEYS.includes(col.key as SortKey) ? "cursor-pointer select-none" : ""}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  <SortIcon colKey={col.key} />
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeCols.length + 2} className="text-center py-12 text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((company) => (
                <>
                  <TableRow key={company.id} className="group">
                    <TableCell className="w-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                      >
                        {expandedId === company.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    {activeCols.map((col) => (
                      <TableCell key={col.key}>{renderCellValue(company, col.key)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/companies/view/${company.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/companies/add?edit=${company.id}`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {showActivateAction && (
                          <Button variant="outline" size="sm" onClick={() => handleActivate(company.id)}>
                            Activate
                          </Button>
                        )}
                        {showDeactivateAction && (
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeactivate(company.id)}>
                            Deactivate
                          </Button>
                        )}
                        {showDeleteAction && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(company.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expandable detail row */}
                  {expandedId === company.id && (
                    <TableRow key={`${company.id}-detail`}>
                      <TableCell colSpan={activeCols.length + 2} className="bg-muted/30 p-0">
                        <CompanyExpandedDetails company={company} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

/* ─── Expanded Detail Panel ─── */

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value || "—"}</p>
  </div>
);

const JsonBadgeList = ({ label, data }: { label: string; data: any }) => {
  const items: string[] = Array.isArray(data) ? data : [];
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None configured</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {items.slice(0, 12).map((item, i) => (
            <Badge key={i} variant="outline" className="text-xs">{typeof item === "string" ? item : JSON.stringify(item)}</Badge>
          ))}
          {items.length > 12 && <Badge variant="secondary" className="text-xs">+{items.length - 12} more</Badge>}
        </div>
      )}
    </div>
  );
};

const CompanyExpandedDetails = ({ company }: { company: Company }) => {
  return (
    <div className="p-4">
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailItem label="Address" value={company.company_address} />
            <DetailItem label="City" value={company.company_city} />
            <DetailItem label="State" value={company.company_state} />
            <DetailItem label="Zip" value={company.company_zip_code} />
            <DetailItem label="Phone" value={company.company_phone} />
            <DetailItem label="Primary Email" value={company.company_email_primary} />
            <DetailItem label="Support Email" value={company.company_support_email} />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary POC</p>
              <div className="grid grid-cols-2 gap-2">
                <DetailItem label="Name" value={[company.poc_first_name, company.poc_last_name].filter(Boolean).join(" ") || null} />
                <DetailItem label="Title" value={company.poc_title} />
                <DetailItem label="Phone" value={company.poc_phone} />
                <DetailItem label="Email" value={company.poc_email} />
              </div>
            </div>
            <div className="rounded-md border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secondary POC</p>
              <div className="grid grid-cols-2 gap-2">
                <DetailItem label="Name" value={[company.secondary_poc_first_name, company.secondary_poc_last_name].filter(Boolean).join(" ") || null} />
                <DetailItem label="Title" value={company.secondary_poc_title} />
                <DetailItem label="Phone" value={company.secondary_poc_phone} />
                <DetailItem label="Email" value={company.secondary_poc_email} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailItem label="Website Title" value={company.website_title} />
            <DetailItem label="Tagline" value={company.website_tagline} />
            <DetailItem label="Theme" value={company.theme_style} />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Primary Color</p>
              <div className="flex items-center gap-2">
                {company.primary_color && (
                  <span className="w-5 h-5 rounded border" style={{ backgroundColor: company.primary_color }} />
                )}
                <span className="text-sm font-medium">{company.primary_color || "—"}</span>
              </div>
            </div>
            <DetailItem label="Financing" value={company.financing_enabled ? `${company.financing_provider || "Enabled"}` : "Disabled"} />
            <DetailItem label="Slug" value={company.slug} />
          </div>
          {company.website_description && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm mt-0.5">{company.website_description}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold">HVAC</p>
              <JsonBadgeList label="Install" data={company.hvac_equipment_install} />
              <JsonBadgeList label="Service" data={company.hvac_equipment_service} />
              <JsonBadgeList label="Repair" data={company.hvac_equipment_repair} />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Plumbing</p>
              <JsonBadgeList label="Install" data={company.plumbing_equipment_install} />
              <JsonBadgeList label="Service" data={company.plumbing_equipment_service} />
              <JsonBadgeList label="Repair" data={company.plumbing_equipment_repair} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <JsonBadgeList label="Services Provided" data={company.services_provided} />
            <JsonBadgeList label="Service Areas" data={company.service_areas} />
            <JsonBadgeList label="Brands Installed" data={company.brands_installed} />
            <JsonBadgeList label="Brands Serviced" data={company.brands_serviced} />
          </div>
          {company.coupons && jsonLength(company.coupons) > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Coupons</p>
              <Badge variant="secondary">{jsonLength(company.coupons)} configured</Badge>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDataTable;
