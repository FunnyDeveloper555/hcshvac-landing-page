import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Search,
  LayoutList,
  ChevronDown,
  ChevronRight,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useMassPages } from "@/hooks/useMassPages";
import MassContentEditorDialog, {
  MassContentEditorTarget,
} from "@/components/admin/pagebuilder/MassContentEditorDialog";
import {
  LOCATION_TYPES,
  LocationType,
  VISIT_TYPES,
  VisitType,
  SERVICE_TYPES,
  ServiceType,
  customService,
  enabledServices,
  isMassTemplatePath,
  massPagePath,
  massPageSummary,
  compact,
  resolveMassPage,
  MassLocation,
} from "@/lib/massPages";

type SourceKind = "services" | "products";

interface PageRow {
  id: string;
  page_path: string;
  status: string;
  updated_at: string;
  overrides: Record<string, unknown> | null;
}

export default function MassPagesBuilder() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillPath = searchParams.get("path");
  const prefilled = useRef(false);
  const queryClient = useQueryClient();

  const [source, setSource] = useState<SourceKind>("services");
  const [item, setItem] = useState<string>("");
  const [visitType, setVisitType] = useState<VisitType | "">("");
  const [locationType, setLocationType] = useState<LocationType | "">("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [countyKey, setCountyKey] = useState<string>("");
  const [cityKeyValue, setCityKeyValue] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editorTarget, setEditorTarget] = useState<MassContentEditorTarget | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Clear row selection whenever any filter changes
  useEffect(() => {
    setSelectedPaths(new Set());
  }, [source, item, visitType, locationType, serviceType, countyKey, cityKeyValue, search]);

  const { data: company, isLoading } = useQuery({
    queryKey: ["mass-pages-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data as Record<string, unknown> & { name: string; slug: string | null };
    },
    enabled: !!companyId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["mass-pages-products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name")
        .in("status", ["active_showing", "active_not_showing"])
        .order("product_name")
        .limit(500);
      if (error) throw error;
      return (data || []).map((p) => ({ id: p.id, name: p.product_name }));
    },
  });

  const { data: rows = [], isLoading: rowsLoading } = useQuery({
    queryKey: ["mass-individual-pages", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mass_page_content")
        .select("id, page_path, status, updated_at, overrides")
        .eq("company_id", companyId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as unknown as PageRow[]).filter((r) => !isMassTemplatePath(r.page_path));
    },
    enabled: !!companyId,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["mass-individual-pages", companyId] });

  const serviceAreas = (company?.service_areas as string[] | null) || null;
  const { groups, loading: areasLoading } = useMassPages(serviceAreas);

  const services = useMemo(() => (company ? enabledServices(company) : []), [company]);
  const options = source === "services" ? services.map((s) => s.label) : products.map((p) => p.name);

  // Prefill the filters (and open the editor) when arriving with ?path=...
  useEffect(() => {
    if (prefilled.current || !prefillPath || !company || groups.length === 0) return;
    if (isMassTemplatePath(prefillPath)) return;
    const ref = resolveMassPage(prefillPath, company, groups);
    if (!ref) return;
    prefilled.current = true;
    setSource(services.some((s) => s.label === ref.service.label) ? "services" : "products");
    setItem(ref.service.label);
    setVisitType(ref.visitType || "");
    setLocationType(ref.locationType || "");
    setServiceType(ref.serviceType || "");
    setCountyKey(`${ref.location.county}|${ref.location.state}`);
    setCityKeyValue(`${ref.location.city}|${ref.location.zip}`);
    setEditorTarget({
      path: prefillPath,
      service: ref.service,
      location: ref.location,
      visitType: ref.visitType || null,
      locationType: ref.locationType || null,
      serviceType: ref.serviceType || null,
    });
  }, [prefillPath, company, groups, services]);

  const county = groups.find((g) => `${g.county}|${g.state}` === countyKey) || null;
  const location: MassLocation | null =
    county?.locations.find((l) => `${l.city}|${l.zip}` === cityKeyValue) || null;

  const service = item ? services.find((s) => s.label === item) || customService(item) : null;
  const opts = { visitType: visitType || null, locationType: locationType || null, serviceType: serviceType || null };

  const path = service && location ? massPagePath(service, location, opts) : "";
  const summary = service && location ? massPageSummary(service.label, location, opts) : "";
  const liveUrl = company?.slug && path ? `https://${company.slug}.hcshvac.com${path}` : "";
  const previewUrl = path ? `/company/${company?.slug ?? ""}${path}` : "";

  /** "Carol Stream, IL 60108" from a page path's trailing segment */
  const cityLabel = (p: string) => {
    const parts = p.replace(/^\//, "").split("-").filter(Boolean);
    const raw = parts[parts.length - 1] || p;
    const m = raw.match(/^(.*?)([A-Z]{2})(\d{5})?$/);
    const city = (m ? m[1] : raw).replace(/([a-z])([A-Z])/g, "$1 $2");
    return m ? `${city}, ${m[2]}${m[3] ? ` ${m[3]}` : ""}` : city;
  };

  /**
   * Table entries — empty until a county is picked. Once a county (and optionally a
   * city / ZIP) is chosen we list every campaign page for the selected criteria,
   * whether it has saved content yet or not.
   */
  const entries = useMemo(() => {
    if (!county) return [] as { path: string; label: string; row: PageRow | null }[];
    const q = search.trim().toLowerCase();
    const byPath = new Map(rows.map((r) => [r.page_path, r]));

    let list: { path: string; label: string; row: PageRow | null }[] = [];

    if (service) {
      const locs = location ? [location] : county.locations;
      list = locs.map((l) => {
        const p = massPagePath(service, l, opts);
        return {
          path: p,
          label: `${l.city}, ${l.state}${l.zip ? ` ${l.zip}` : ""}`,
          row: byPath.get(p) || null,
        };
      });
    } else {
      const tokens = [
        locationType ? compact(locationType) : "",
        visitType ? compact(visitType) : "",
        compact(county.county),
        location ? compact(location.city) : "",
      ].filter(Boolean);
      list = rows
        .filter((r) => tokens.every((t) => r.page_path.toLowerCase().includes(t.toLowerCase())))
        .map((r) => ({ path: r.page_path, label: cityLabel(r.page_path), row: r }));
    }

    return q ? list.filter((e) => e.path.toLowerCase().includes(q) || e.label.toLowerCase().includes(q)) : list;
  }, [rows, locationType, visitType, service, county, location, search, opts]);

  const filtered = entries;

  /** Entries grouped by the first letter of the city, e.g. "A4" = 4 cities starting with A */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const letter = (e.label[0] || "#").toUpperCase();
      map.set(letter, [...(map.get(letter) || []), e]);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, list]) => ({
        letter,
        rows: [...list].sort((a, b) => a.label.localeCompare(b.label)),
      }));
  }, [entries]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const active = filtered.filter((e) => e.row?.status === "active").length;
    const notCreated = filtered.filter((e) => !e.row).length;
    const suspended = filtered.filter((e) => e.row?.status === "suspended").length;
    const deleted = filtered.filter((e) => e.row?.status === "deleted").length;
    return { total, active, notCreated, suspended, deleted };
  }, [filtered]);




  const tableTitle = useMemo(() => {
    const bits = [locationType, visitType, service?.label].filter(Boolean).join(" ");
    return bits ? `${bits} in ${company?.name ?? ""}` : "Individual campaign pages";
  }, [locationType, visitType, service, company]);

  const exists = !!rows.find((r) => r.page_path === path);


  const setStatus = async (id: string, next: string) => {
    const { error } = await supabase.from("mass_page_content").update({ status: next }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Moved to ${next}`);
    refresh();
  };

  const hardDelete = async (id: string) => {
    const { error } = await supabase.from("mass_page_content").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Permanently deleted");
    refresh();
  };

  const toggleGroup = (letter: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return next;
    });
  };

  const toggleSelectGroup = (letter: string, groupRows: typeof entries) => {
    const groupPaths = new Set(groupRows.map((r) => r.path));
    const allSelected = groupRows.every((r) => selectedPaths.has(r.path));
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupPaths.forEach((p) => next.delete(p));
      } else {
        groupPaths.forEach((p) => next.add(p));
      }
      return next;
    });
  };

  const setBulkStatus = async (nextStatus: string) => {
    const targets = Array.from(selectedPaths)
      .map((p) => rows.find((r) => r.page_path === p))
      .filter(Boolean) as PageRow[];
    if (targets.length === 0) {
      toast.error("No existing pages selected");
      return;
    }
    const { error } = await supabase
      .from("mass_page_content")
      .update({ status: nextStatus })
      .in(
        "id",
        targets.map((t) => t.id)
      );
    if (error) return toast.error(error.message);
    toast.success(`Updated ${targets.length} page${targets.length === 1 ? "" : "s"}`);
    setSelectedPaths(new Set());
    refresh();
  };

  const bulkHardDelete = async () => {
    const targets = Array.from(selectedPaths)
      .map((p) => rows.find((r) => r.page_path === p))
      .filter(Boolean) as PageRow[];
    if (targets.length === 0) {
      toast.error("No existing pages selected");
      return;
    }
    const { error } = await supabase
      .from("mass_page_content")
      .delete()
      .in(
        "id",
        targets.map((t) => t.id)
      );
    if (error) return toast.error(error.message);
    toast.success(`Deleted ${targets.length} page${targets.length === 1 ? "" : "s"}`);
    setSelectedPaths(new Set());
    refresh();
  };

  const openEditorForPath = (p: string) => {
    if (!company) return;
    const ref = resolveMassPage(p, company, groups);
    if (!ref) {
      toast.error("This page path could not be resolved against the current service areas.");
      return;
    }
    setEditorTarget({
      path: p,
      service: ref.service,
      location: ref.location,
      visitType: ref.visitType || null,
      locationType: ref.locationType || null,
      serviceType: ref.serviceType || null,
    });
  };


  const statusBadge = (status: string) => {
    const configs: Record<string, { dot: string; text: string; label: string }> = {
      active: { dot: "bg-emerald-500", text: "text-emerald-700", label: "Active" },
      new: { dot: "bg-blue-500", text: "text-blue-700", label: "Draft" },
      suspended: { dot: "bg-amber-500", text: "text-amber-700", label: "Suspended" },
      deleted: { dot: "bg-red-500", text: "text-red-700", label: "Deleted" },
    };
    const cfg = configs[status];
    if (!cfg) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground capitalize">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          {status}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!company) {
    return <p className="text-muted-foreground py-10 text-center">Company not found</p>;
  }

  const totalCities = groups.reduce((n, g) => n + g.locations.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
        <p className="text-sm text-muted-foreground">
          Create individual mass pages for {company.name}. Use the filters to find or build a page,
          then edit its content in the popup editor.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            {areasLoading
              ? "Loading service areas…"
              : `${groups.length} counties · ${totalCities} cities`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1">
            <Label className="text-xs">Location type</Label>
            <Select
              value={locationType || "all"}
              onValueChange={(v) => setLocationType(v === "all" ? "" : (v as LocationType))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All location types</SelectItem>
                {LOCATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Visit type</Label>
            <Select
              value={visitType || "all"}
              onValueChange={(v) => setVisitType(v === "all" ? "" : (v as VisitType))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All visit types</SelectItem>
                {VISIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Source</Label>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v as SourceKind);
                setItem("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="services">Services we offer</SelectItem>
                <SelectItem value="products">Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">What is the page about?</Label>
            <Select value={item || "all"} onValueChange={(v) => setItem(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All {source}</SelectItem>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">County</Label>
            <Select
              value={countyKey || "all"}
              onValueChange={(v) => {
                setCountyKey(v === "all" ? "" : v);
                setCityKeyValue("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All counties</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={`${g.county}|${g.state}`} value={`${g.county}|${g.state}`}>
                    {g.county}, {g.state} ({g.locations.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Area we service (city / ZIP)</Label>
            <Select
              value={cityKeyValue || "all"}
              onValueChange={(v) => setCityKeyValue(v === "all" ? "" : v)}
              disabled={!county}
            >
              <SelectTrigger>
                <SelectValue placeholder={county ? "All cities" : "Pick a county first"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All cities</SelectItem>
                {(county?.locations || []).map((l) => (
                  <SelectItem key={`${l.city}|${l.zip}`} value={`${l.city}|${l.zip}`}>
                    {l.city}, {l.state}
                    {l.zip ? ` ${l.zip}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selected page summary + create */}
      {path && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selected page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-semibold">{summary}</span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs break-all">
              {liveUrl || previewUrl}
            </Badge>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  service &&
                  location &&
                  setEditorTarget({
                    path,
                    service,
                    location,
                    visitType: visitType || null,
                    locationType: locationType || null,
                    serviceType: serviceType || null,
                  })
                }
              >
                {exists ? (
                  <>
                    <Pencil className="w-4 h-4 mr-2" /> Edit this page
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Create campaign page
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(liveUrl || previewUrl);
                  toast.success("URL copied");
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(liveUrl || previewUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Open page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual pages table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutList className="w-4 h-4 text-muted-foreground" />
            {tableTitle}
          </CardTitle>
          <CardDescription>
            {!county
              ? "Select a county (and optionally a city / ZIP) to list campaign pages."
              : `${filtered.length} record${filtered.length === 1 ? "" : "s"} in ${county.county}, ${county.state}.`}
          </CardDescription>
          {county && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="secondary" className="font-medium">
                Total {stats.total}
              </Badge>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                Active {stats.active}
              </Badge>
              <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50 font-medium">
                Not created {stats.notCreated}
              </Badge>
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 font-medium">
                Suspended {stats.suspended}
              </Badge>
              <Badge variant="destructive" className="font-medium">
                Deleted {stats.deleted}
              </Badge>
            </div>
          )}
        </CardHeader>

        <Separator />
        <CardContent className="pt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 bg-background"
              placeholder="Search path..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selectedPaths.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-md border bg-muted/30">
              <span className="text-sm font-medium px-2">
                {selectedPaths.size} selected
              </span>
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setBulkStatus("active")}
                title="Activate"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => setBulkStatus("suspended")}
                title="Suspend"
              >
                <Pause className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setBulkStatus("deleted")}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPaths(new Set())}>
                Clear
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px] px-3" />
                  <TableHead>Page</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[180px]">Last Updated</TableHead>
                  <TableHead className="text-right w-[190px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[260px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-32 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !county ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-sm">
                      Select a county to list its campaign pages.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-sm">
                      No individual campaign pages yet for this selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  grouped.flatMap((g) => {
                    const activeInGroup = g.rows.filter((r) => r.row?.status === "active").length;
                    const expanded = expandedGroups.has(g.letter);
                    const allSelected = g.rows.every((r) => selectedPaths.has(r.path));
                    return [
                      <TableRow key={`grp-${g.letter}`} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={5} className="py-1.5">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => toggleGroup(g.letter)}
                              className="flex items-center gap-2 text-left"
                            >
                              {expanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-xs font-semibold tracking-widest text-muted-foreground">
                                {g.letter}
                                {g.rows.length}
                              </span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {activeInGroup} / {g.rows.length} active
                              </Badge>
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => toggleSelectGroup(g.letter, g.rows)}
                            >
                              {allSelected ? "Deselect" : "Select all"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>,
                      ...(expanded
                        ? g.rows.map((e) => (
                            <TableRow key={e.path} className="hover:bg-muted/40">
                              <TableCell className="px-3 align-top">
                                <Checkbox
                                  checked={selectedPaths.has(e.path)}
                                  onCheckedChange={() => {
                                    setSelectedPaths((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(e.path)) next.delete(e.path);
                                      else next.add(e.path);
                                      return next;
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="font-medium break-words">{e.label}</div>
                              </TableCell>

                              <TableCell className="align-top">
                                {e.row ? (
                                  statusBadge(e.row.status)
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                                    Not created
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                                {e.row
                                  ? new Date(e.row.updated_at).toLocaleString(undefined, {
                                      month: "short",
                                      day: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right align-top">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title={e.row ? "Edit content" : "Create page content"}
                                    onClick={() => openEditorForPath(e.path)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Open page"
                                    onClick={() =>
                                      window.open(
                                        company.slug
                                          ? `https://${company.slug}.hcshvac.com${e.path}`
                                          : `/company/${company.slug ?? ""}${e.path}`,
                                        "_blank",
                                        "noopener,noreferrer",
                                      )
                                    }
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="View activity history"
                                    onClick={() =>
                                      navigate(
                                        `/admin/page-builder/company/${companyId}/mass-pages/history?path=${encodeURIComponent(e.path)}`,
                                      )
                                    }
                                  >
                                    <History className="w-4 h-4" />
                                  </Button>
                                  {e.row && (
                                    <>
                                      <Separator orientation="vertical" className="h-5 mx-0.5" />
                                      {e.row.status === "active" ? (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                          title="Suspend"
                                          onClick={() => setStatus(e.row!.id, "suspended")}
                                        >
                                          <Pause className="w-4 h-4" />
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                          title={e.row.status === "deleted" ? "Restore" : "Activate"}
                                          onClick={() => setStatus(e.row!.id, "active")}
                                        >
                                          {e.row.status === "deleted" ? (
                                            <RotateCcw className="w-4 h-4" />
                                          ) : (
                                            <Play className="w-4 h-4" />
                                          )}
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        title={e.row.status === "deleted" ? "Delete permanently" : "Delete"}
                                        onClick={() =>
                                          e.row!.status === "deleted"
                                            ? hardDelete(e.row!.id)
                                            : setStatus(e.row!.id, "deleted")
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        : []),
                    ];
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MassContentEditorDialog
        open={!!editorTarget}
        onOpenChange={(o) => !o && setEditorTarget(null)}
        companyId={companyId!}
        company={company as Record<string, unknown> & { name: string; company_phone?: string | null }}
        target={editorTarget}
        onSaved={refresh}
      />
    </div>
  );
}
