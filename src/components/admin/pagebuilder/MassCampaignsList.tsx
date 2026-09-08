import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ExternalLink,
  Pause,
  Play,
  Trash2,
  RotateCcw,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  LayoutList,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { isMassTemplatePath, massTemplateLabel, massTemplateKey, massTemplatePathOrdered } from "@/lib/massPages";
import { ChevronDown } from "lucide-react";


export type CampaignKind = "master" | "page";

const META: Record<CampaignKind, { title: string; description: string }> = {
  master: {
    title: "Active Campaigns",
    description:
      "Campaigns grouped by their master criteria — expand a row to see its individual city pages.",
  },
  page: {
    title: "Campaigns",
    description: "Single mass pages that override their master campaign template.",
  },
};


const STATUS_OPTIONS = ["all", "active", "new", "suspended", "deleted"] as const;
const PAGE_SIZES = [10, 25, 50, 100];

interface CampaignRow {
  id: string;
  page_path: string;
  status: string;
  updated_at: string;
  overrides: Record<string, unknown> | null;
}

type SortKey = "title" | "status" | "updated_at";

export default function MassCampaignsList({ kind }: { kind: CampaignKind }) {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear row selection whenever the search or status filter changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, statusFilter]);



  const { data: company } = useQuery({
    queryKey: ["mass-campaigns-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: allRows = [], isLoading } = useQuery({
    queryKey: ["mass-campaigns", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mass_page_content")
        .select("id, page_path, status, updated_at, overrides")
        .eq("company_id", companyId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CampaignRow[];
    },
    enabled: !!companyId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["mass-campaigns", companyId] });
  };

  const setStatus = async (ids: string[], next: string) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from("mass_page_content")
      .update({ status: next })
      .in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Moved to ${next}`);
    refresh();
  };

  const hardDelete = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase.from("mass_page_content").delete().in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Permanently deleted");
    refresh();
  };


  const meta = META[kind];

  const titleFor = (row: CampaignRow) =>
    isMassTemplatePath(row.page_path)
      ? massTemplateLabel(row.page_path)
      : (row.overrides?.heroTitle as string) ||
        (row.overrides?.heading as string) ||
        row.page_path.replace(/^\//, "");

  /** specific pages grouped under the master campaign they belong to (by key) */
  const childrenByMaster = useMemo(() => {
    const map = new Map<string, CampaignRow[]>();
    for (const r of allRows) {
      if (isMassTemplatePath(r.page_path)) continue;
      const key = massTemplateKey(r.page_path);
      if (!key) continue;
      map.set(key, [...(map.get(key) || []), r]);
    }
    for (const list of map.values())
      list.sort((a, b) => a.page_path.localeCompare(b.page_path));
    return map;
  }, [allRows]);

  const childrenOf = (row: CampaignRow) => {
    if (!isMassTemplatePath(row.page_path)) return [];
    const key = massTemplateKey(row.page_path);
    return (key && childrenByMaster.get(key)) || [];
  };

  /** top-level rows: real master rows + synthetic masters for orphan pages */
  const topLevel = useMemo(() => {
    const masters = allRows.filter((r) => isMassTemplatePath(r.page_path));
    const masterKeys = new Set(
      masters.map((r) => massTemplateKey(r.page_path)).filter(Boolean) as string[],
    );
    const synthetic: CampaignRow[] = [];
    const seen = new Set<string>();
    for (const [key, kids] of childrenByMaster.entries()) {
      if (masterKeys.has(key) || seen.has(key)) continue;
      const templatePath = massTemplatePathOrdered(kids[0].page_path);
      if (!templatePath) continue;
      seen.add(key);
      synthetic.push({
        id: `virtual:${key}`,
        page_path: templatePath,
        status: kids.some((k) => k.status === "active")
          ? "active"
          : kids[0].status,
        updated_at: kids
          .map((k) => k.updated_at)
          .sort()
          .slice(-1)[0],
        overrides: null,
      });
    }
    // orphan pages that could not be grouped at all
    const ungrouped = allRows.filter(
      (r) => !isMassTemplatePath(r.page_path) && !massTemplateKey(r.page_path),
    );
    return [...masters, ...synthetic, ...ungrouped];
  }, [allRows, childrenByMaster]);

  const idsFor = (row: CampaignRow) =>
    row.id.startsWith("virtual:")
      ? childrenOf({ ...row } as CampaignRow).map((k) => k.id)
      : [row.id];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = topLevel;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);

    if (q) {
      list = list.filter((r) => {
        const kids = childrenOf(r);
        return (
          r.page_path.toLowerCase().includes(q) ||
          titleFor(r).toLowerCase().includes(q) ||
          kids.some(
            (k) =>
              k.page_path.toLowerCase().includes(q) || titleFor(k).toLowerCase().includes(q),
          )
        );
      });
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "updated_at") cmp = a.updated_at.localeCompare(b.updated_at);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else cmp = titleFor(a).localeCompare(titleFor(b));
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [topLevel, childrenByMaster, search, statusFilter, sortKey, sortAsc]);



  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "title");
    }
  };

  const SortHead = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button
        className="inline-flex items-center gap-1.5 font-medium text-foreground/90 hover:text-foreground transition-colors"
        onClick={() => toggleSort(k)}
      >
        {label}
        {sortKey === k &&
          (sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
      </button>
    </TableHead>
  );

  const urlFor = (path: string) =>
    company?.slug
      ? `https://${company.slug}.hcshvac.com${path}`
      : `/company/${company?.slug ?? ""}${path}`;

  const formattedDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  /** Colored status dot, matching the Campaigns page table */
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

  /** Headline stats across all campaign rows (masters + pages) */
  const stats = useMemo(() => {
    const total = allRows.length;
    const active = allRows.filter((r) => r.status === "active").length;
    const suspended = allRows.filter((r) => r.status === "suspended").length;
    const deleted = allRows.filter((r) => r.status === "deleted").length;
    return { total, active, suspended, deleted };
  }, [allRows]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (kids: CampaignRow[]) => {
    const allSelected = kids.length > 0 && kids.every((k) => selectedIds.has(k.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) kids.forEach((k) => next.delete(k.id));
      else kids.forEach((k) => next.add(k.id));
      return next;
    });
  };

  const bulkSetStatus = async (next: string) => {
    await setStatus(Array.from(selectedIds), next);
    setSelectedIds(new Set());
  };

  const bulkHardDelete = async () => {
    await hardDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  /** "DuPage County · Carol Stream, IL 60108" from a specific page path */
  const locationLabel = (path: string) => {
    const parts = path.replace(/^\//, "").split("-").filter(Boolean);
    if (parts.length < 2) return path;
    const county = parts[parts.length - 2].replace(/([a-z])([A-Z])/g, "$1 $2");
    const raw = parts[parts.length - 1];
    const m = raw.match(/^(.*?)([A-Z]{2})(\d{5})?$/);
    const city = (m ? m[1] : raw).replace(/([a-z])([A-Z])/g, "$1 $2");
    const tail = m ? `${city}, ${m[2]}${m[3] ? ` ${m[3]}` : ""}` : city;
    return `${county} · ${tail}`;
  };

  /** Accordion header row for a master campaign; expands to show its child pages */
  const renderMasterGroup = (row: CampaignRow): JSX.Element[] => {
    const kids = childrenOf(row);
    const isOpen = !!expanded[row.id];
    const activeCount = kids.filter((k) => k.status === "active").length;
    const allSelected = kids.length > 0 && kids.every((k) => selectedIds.has(k.id));

    const out: JSX.Element[] = [
      <TableRow key={row.id} className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={5} className="py-1.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))}
              className="flex items-center gap-2 text-left min-w-0"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium break-words whitespace-normal">{titleFor(row)}</span>
              {statusBadge(row.status)}
              <Badge variant="outline" className="text-xs font-normal shrink-0">
                {activeCount} / {kids.length} active
              </Badge>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleSelectGroup(kids)}
              >
                {allSelected ? "Deselect" : "Select all"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Edit campaign template"
                onClick={() =>
                  navigate(
                    `/admin/page-builder/company/${companyId}/mass-pages/templates?path=${encodeURIComponent(row.page_path)}`,
                  )
                }
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="View activity history"
                onClick={() =>
                  navigate(
                    `/admin/page-builder/company/${companyId}/mass-pages/history?path=${encodeURIComponent(row.page_path)}`,
                  )
                }
              >
                <History className="w-3.5 h-3.5" />
              </Button>
              {row.status === "active" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                  title="Suspend campaign"
                  onClick={() => setStatus(idsFor(row), "suspended")}
                >
                  <Pause className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                  title={row.status === "deleted" ? "Restore campaign" : "Activate campaign"}
                  onClick={() => setStatus(idsFor(row), "active")}
                >
                  {row.status === "deleted" ? (
                    <RotateCcw className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                title={row.status === "deleted" ? "Delete permanently" : "Delete campaign"}
                onClick={() =>
                  row.status === "deleted" ? hardDelete(idsFor(row)) : setStatus(idsFor(row), "deleted")
                }
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>,
    ];

    if (isOpen) for (const kid of kids) out.push(renderPageRow(kid, row.status, true));
    return out;
  };

  /** A single campaign page row — child of a master group, or standalone */
  const renderPageRow = (row: CampaignRow, parentStatus?: string, isChild = false): JSX.Element => {
    const isTemplate = isMassTemplatePath(row.page_path);
    const isParentLocked = parentStatus === "suspended" || parentStatus === "deleted";
    const lockTitle = isParentLocked ? `Disabled because parent campaign is ${parentStatus}` : undefined;

    return (
      <TableRow key={row.id} className="hover:bg-muted/40">
        <TableCell className="px-3 align-top">
          <Checkbox
            checked={selectedIds.has(row.id)}
            onCheckedChange={() => toggleSelect(row.id)}
          />
        </TableCell>
        <TableCell className="align-top">
          <div className={isChild ? "pl-4 border-l-2 border-muted" : ""}>
            <span className="font-medium break-words whitespace-normal text-sm">
              {isTemplate ? titleFor(row) : locationLabel(row.page_path)}
            </span>
            {isTemplate && (
              <div className="font-mono text-xs text-muted-foreground mt-1">All counties &amp; cities</div>
            )}
          </div>
        </TableCell>
        <TableCell className="align-top">{statusBadge(row.status)}</TableCell>
        <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
          {formattedDate(row.updated_at)}
        </TableCell>
        <TableCell className="text-right align-top">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={lockTitle ?? (isTemplate ? "Edit campaign template" : "Edit content")}
              disabled={isParentLocked}
              onClick={() =>
                navigate(
                  isTemplate
                    ? `/admin/page-builder/company/${companyId}/mass-pages/templates?path=${encodeURIComponent(row.page_path)}`
                    : `/admin/page-builder/company/${companyId}/mass-pages?path=${encodeURIComponent(row.page_path)}`,
                )
              }
            >
              <Pencil className="w-4 h-4" />
            </Button>
            {!isTemplate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={lockTitle ?? "Open page"}
                disabled={isParentLocked}
                onClick={() => window.open(urlFor(row.page_path), "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="View activity history"
              onClick={() =>
                navigate(
                  `/admin/page-builder/company/${companyId}/mass-pages/history?path=${encodeURIComponent(row.page_path)}`,
                )
              }
            >
              <History className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-0.5" />
            {row.status === "active" ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                title={lockTitle ?? "Suspend"}
                disabled={isParentLocked}
                onClick={() => setStatus([row.id], "suspended")}
              >
                <Pause className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                title={lockTitle ?? (row.status === "deleted" ? "Restore" : "Activate")}
                disabled={isParentLocked}
                onClick={() => setStatus([row.id], "active")}
              >
                {row.status === "deleted" ? (
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
              title={lockTitle ?? (row.status === "deleted" ? "Delete permanently" : "Delete")}
              disabled={isParentLocked}
              onClick={() =>
                row.status === "deleted" ? hardDelete([row.id]) : setStatus([row.id], "deleted")
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };


  const startIdx = rows.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(currentPage * pageSize, rows.length);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <LayoutList className="w-4 h-4" />
            <span>{company?.name || "Company campaigns"}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{meta.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/mass-pages`)}
          className="self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                {meta.title}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {rows.length} record{rows.length === 1 ? "" : "s"}
                {statusFilter !== "all" && (
                  <span className="ml-1.5">
                    · filtered by <span className="font-medium text-foreground">{statusFilter}</span>
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <Badge variant="secondary" className="font-medium">
              Total {stats.total}
            </Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
              Active {stats.active}
            </Badge>
            <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 font-medium">
              Suspended {stats.suspended}
            </Badge>
            <Badge variant="destructive" className="font-medium">
              Deleted {stats.deleted}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9 bg-background"
                placeholder="Search name or path..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[150px] bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "all" ? "All statuses" : s === "new" ? "Draft" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[110px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-md border bg-muted/30">
              <span className="text-sm font-medium px-2">{selectedIds.size} selected</span>
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => bulkSetStatus("active")}
                title="Activate"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => bulkSetStatus("suspended")}
                title="Suspend"
              >
                <Pause className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                className="rounded-full w-8 h-8 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => bulkSetStatus("deleted")}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px] px-3" />
                  <SortHead label="Campaign / Path" k="title" />
                  <SortHead label="Status" k="status" className="w-[130px]" />
                  <SortHead label="Last Updated" k="updated_at" className="w-[180px]" />
                  <TableHead className="text-right w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
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
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <LayoutList className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-sm">
                          No {kind === "master" ? "master campaigns" : "campaigns"} found.
                        </p>
                        {search || statusFilter !== "all" ? (
                          <p className="text-xs mt-1">Try adjusting your filters.</p>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.flatMap((row) =>
                    childrenOf(row).length > 0
                      ? renderMasterGroup(row)
                      : [renderPageRow(row)],
                  )
                )}

              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm pt-1">
            <span className="text-muted-foreground">
              Showing <span className="font-medium text-foreground">{startIdx}</span>–
              <span className="font-medium text-foreground">{endIdx}</span> of{" "}
              <span className="font-medium text-foreground">{rows.length}</span> records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-muted-foreground text-xs px-1">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
