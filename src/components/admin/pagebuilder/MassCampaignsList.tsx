import { useMemo, useState } from "react";
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
  LayoutList,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { isMassTemplatePath, massTemplateLabel, massTemplateKey } from "@/lib/massPages";
import { ChevronDown } from "lucide-react";


export type CampaignKind = "master" | "page";

const META: Record<CampaignKind, { title: string; description: string }> = {
  master: {
    title: "Master Campaigns",
    description:
      "Templates that apply to every county / city page matching their criteria.",
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

  const setStatus = async (id: string, next: string) => {
    const { error } = await supabase
      .from("mass_page_content")
      .update({ status: next })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Moved to ${next}`);
    refresh();
  };

  const hardDelete = async (id: string) => {
    const { error } = await supabase.from("mass_page_content").delete().eq("id", id);
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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const masterKeys = new Set(
      allRows
        .filter((r) => isMassTemplatePath(r.page_path))
        .map((r) => massTemplateKey(r.page_path))
        .filter(Boolean) as string[],
    );
    // top-level = master campaigns + orphan pages that have no master row
    let list = allRows.filter((r) => {
      if (isMassTemplatePath(r.page_path)) return true;
      const key = massTemplateKey(r.page_path);
      return !key || !masterKeys.has(key);
    });
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
  }, [allRows, childrenByMaster, search, statusFilter, sortKey, sortAsc]);



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

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Active</Badge>;
      case "new":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600 bg-blue-50">
            Draft
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
            Suspended
          </Badge>
        );
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderRow = (row: CampaignRow, isChild: boolean): JSX.Element[] => {
    const isTemplate = isMassTemplatePath(row.page_path);
    const title = isChild ? locationLabel(row.page_path) : titleFor(row);
    const kids = childrenOf(row);
    const isOpen = !!expanded[row.id];

    const out: JSX.Element[] = [
      <TableRow key={row.id} className="group transition-colors hover:bg-muted/40">
        <TableCell className="align-top">
          <div className={isChild ? "pl-7 border-l-2 border-muted ml-1" : ""}>
            <div className="flex items-start gap-1.5">
              {kids.length > 0 ? (
                <button
                  className="p-0.5 mt-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                  title={isOpen ? "Collapse campaigns" : "Expand campaigns"}
                  onClick={() => setExpanded((e) => ({ ...e, [row.id]: !e[row.id] }))}
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : null}
              <div className="min-w-0">
                <span
                  className={`font-medium break-words whitespace-normal ${
                    isChild ? "text-foreground/90 text-sm" : "text-foreground"
                  }`}
                >
                  {title}
                </span>
                {kids.length > 0 && (
                  <Badge variant="secondary" className="ml-2 align-middle text-[11px]">
                    {kids.length} page{kids.length === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1 break-all">
              {isTemplate ? "All counties & cities" : row.page_path}
            </div>

          </div>
        </TableCell>
        <TableCell className="align-top">{statusBadge(row.status)}</TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap align-top text-sm">
          {formattedDate(row.updated_at)}
        </TableCell>
        <TableCell className="text-right align-top">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit"
              onClick={() =>
                navigate(
                  `/admin/page-builder/company/${companyId}/mass-pages?path=${encodeURIComponent(
                    row.page_path,
                  )}`,
                )
              }
            >
              <Pencil className="w-4 h-4" />
            </Button>
            {!isTemplate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Open page"
                onClick={() => window.open(urlFor(row.page_path), "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Separator orientation="vertical" className="h-5 mx-0.5" />
            {row.status === "active" ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title="Suspend"
                onClick={() => setStatus(row.id, "suspended")}
              >
                <Pause className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                title={row.status === "deleted" ? "Restore" : "Activate"}
                onClick={() => setStatus(row.id, "active")}
              >
                {row.status === "deleted" ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            )}
            {row.status !== "deleted" ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete"
                onClick={() => setStatus(row.id, "deleted")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete permanently"
                onClick={() => hardDelete(row.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>,
    ];

    if (isOpen) for (const kid of kids) out.push(...renderRow(kid, true));
    return out;
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

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <SortHead label="Campaign / Path" k="title" className="w-[360px]" />
                  <SortHead label="Status" k="status" className="w-[130px]" />
                  <SortHead label="Last Updated" k="updated_at" className="w-[180px]" />
                  <TableHead className="text-right w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-[260px]" />
                        <Skeleton className="h-3 w-[180px] mt-2" />
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
                    <TableCell colSpan={4} className="h-32 text-center">
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
                  paged.flatMap((row) => renderRow(row, false))
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
