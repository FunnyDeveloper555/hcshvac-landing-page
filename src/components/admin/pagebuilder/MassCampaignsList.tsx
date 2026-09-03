import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";
import { isMassTemplatePath, massTemplateLabel } from "@/lib/massPages";

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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allRows.filter((r) =>
      kind === "master" ? isMassTemplatePath(r.page_path) : !isMassTemplatePath(r.page_path),
    );
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (q) {
      list = list.filter(
        (r) =>
          r.page_path.toLowerCase().includes(q) || titleFor(r).toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "updated_at") cmp = a.updated_at.localeCompare(b.updated_at);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else cmp = titleFor(a).localeCompare(titleFor(b));
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [allRows, kind, search, statusFilter, sortKey, sortAsc]);

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
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => toggleSort(k)}
      >
        {label}
        {sortKey === k &&
          (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">
            {company?.name ? `${company.name} — ` : ""}
            {meta.description}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/mass-pages`)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{meta.title}</CardTitle>
          <CardDescription>
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-8 h-9"
                placeholder="Search name or path..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s === "new" ? "Draft" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[110px]">
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

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : paged.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No {kind === "master" ? "master campaigns" : "campaigns"} found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortHead label="Campaign / Path" k="title" className="w-[300px]" />
                      <SortHead label="Status" k="status" />
                      <SortHead label="Last Updated" k="updated_at" />
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((row) => {
                      const isTemplate = isMassTemplatePath(row.page_path);
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div
                              className="font-medium truncate max-w-[280px]"
                              title={titleFor(row)}
                            >
                              {titleFor(row)}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground break-all">
                              {isTemplate ? "All counties & cities" : row.page_path}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === "active"
                                  ? "default"
                                  : row.status === "deleted"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {row.status === "new" ? "draft" : row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formattedDate(row.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
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
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Open page"
                                  onClick={() =>
                                    window.open(urlFor(row.page_path), "_blank", "noopener,noreferrer")
                                  }
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                              {row.status === "active" ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Suspend"
                                  onClick={() => setStatus(row.id, "suspended")}
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
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
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Delete"
                                  onClick={() => setStatus(row.id, "deleted")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Delete permanently"
                                  onClick={() => hardDelete(row.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-sm">
                <span className="text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
