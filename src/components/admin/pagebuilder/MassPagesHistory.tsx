import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { History, Search, X } from "lucide-react";

interface HistoryRow {
  id: string;
  page_path: string;
  action: string;
  status: string | null;
  previous_status: string | null;
  changed_by_email: string | null;
  changed_fields: string[] | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  create: { label: "Created", className: "bg-blue-50 text-blue-700 border-blue-200" },
  update: { label: "Updated", className: "bg-slate-50 text-slate-700 border-slate-200" },
  status_change: { label: "Status changed", className: "bg-amber-50 text-amber-700 border-amber-200" },
  delete: { label: "Deleted", className: "bg-red-50 text-red-700 border-red-200" },
};

const PAGE_SIZE = 25;

export default function MassPagesHistory() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const pathFilter = searchParams.get("path") ?? "";
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: company } = useQuery({
    queryKey: ["company-basic", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, company_name")
        .eq("id", companyId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["mass-page-history", companyId, pathFilter],
    enabled: !!companyId,
    staleTime: 30_000,
    queryFn: async () => {
      let query = supabase
        .from("mass_page_history")
        .select("id, page_path, action, status, previous_status, changed_by_email, changed_fields, created_at")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (pathFilter) query = query.eq("page_path", pathFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "all" && r.action !== action) return false;
      if (!term) return true;
      return (
        r.page_path.toLowerCase().includes(term) ||
        (r.changed_by_email ?? "").toLowerCase().includes(term)
      );
    });
  }, [rows, search, action]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-4 h-4" />
              Campaign Page History
            </CardTitle>
            <CardDescription>
              Activity for {company?.company_name ?? "this company"}
              {pathFilter ? ` — ${pathFilter}` : ""}
            </CardDescription>
          </div>
          {pathFilter && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("path");
                setSearchParams(next);
              }}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Show all pages
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by page URL or user"
              className="h-9 pl-8"
            />
          </div>
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="status_change">Status changed</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="h-7 px-2 text-xs">
            {filtered.length} entries
          </Badge>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Changed</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No activity recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => {
                  const style = ACTION_STYLES[r.action] ?? {
                    label: r.action,
                    className: "bg-slate-50 text-slate-700 border-slate-200",
                  };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-medium ${style.className}`}>
                          {style.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm break-all max-w-[340px]">{r.page_path}</TableCell>
                      <TableCell className="text-sm">
                        {r.previous_status && r.previous_status !== r.status
                          ? `${r.previous_status} → ${r.status ?? "—"}`
                          : r.status ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(r.changed_fields ?? []).length ? (r.changed_fields ?? []).join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{r.changed_by_email ?? "system"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {current + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={current >= totalPages - 1}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
