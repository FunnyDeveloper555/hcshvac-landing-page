import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  CalendarCheck, Loader2, MessageSquare, Pencil, Plus, RefreshCw, Search, Trash2, Users,
} from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";
import {
  WORK_ITEM_STATUSES, WorkItemKind, WorkItemStatus, notifyWorkItemTeam,
  statusDotClass, statusLabel, syncWorkItemCalendar, teamNames,
} from "./workItems";

interface Row {
  id: string;
  number: string | null;
  title: string;
  subtitle: string | null;
  customer_name: string | null;
  due: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  assigned_team: unknown;
  google_event_id: string | null;
  created_by_name: string | null;
  created_at: string;
}

export default function WorkItemsList({ kind }: { kind: WorkItemKind }) {
  const table = kind === "task" ? "tasks" : "tickets";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          number: (kind === "task" ? row.task_number : row.ticket_number) as string | null,
          title: (kind === "task" ? row.title : row.subject) as string,
          subtitle: (kind === "task" ? row.task_type : row.reason) as string | null,
          customer_name: (row.customer_name as string) || null,
          due: (kind === "task" ? row.due_date : row.expected_completion_date) as string | null,
          scheduled_date: (row.scheduled_date as string) || null,
          scheduled_time: (row.scheduled_time as string) || null,
          status: row.status as string,
          assigned_team: row.assigned_team,
          google_event_id: (row.google_event_id as string) || null,
          created_by_name: (row.created_by_name as string) || null,
          created_at: row.created_at as string,
        } as Row;
      });
    },
    staleTime: 30_000,
  });

  const assignees = useMemo(() => {
    const names = new Set<string>();
    (rows || []).forEach((r) => teamNames(r.assigned_team).forEach((n) => names.add(n)));
    return Array.from(names).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rows || []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (assigneeFilter !== "all" && !teamNames(r.assigned_team).includes(assigneeFilter)) return false;
      if (!term) return true;
      return [r.number, r.title, r.subtitle, r.customer_name, teamNames(r.assigned_team).join(" ")]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter, assigneeFilter]);

  const changeStatus = async (row: Row, status: WorkItemStatus) => {
    setBusyId(row.id);
    const { error } = await supabase
      .from(table)
      .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
      .eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    logAction("status_change", kind, row.id, { status });
    queryClient.invalidateQueries({ queryKey: [table] });
    queryClient.invalidateQueries({ queryKey: ["work-items-board"] });
    toast.success(`Marked ${statusLabel(status)}`);
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete ${row.number || "this item"}? This cannot be undone.`)) return;
    setBusyId(row.id);
    const { error } = await supabase.from(table).delete().eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    logAction("delete", kind, row.id, { number: row.number });
    queryClient.invalidateQueries({ queryKey: [table] });
    toast.success("Deleted");
  };

  const resync = async (row: Row) => {
    setBusyId(row.id);
    try {
      await syncWorkItemCalendar(kind, row.id);
      toast.success("Calendar updated");
      queryClient.invalidateQueries({ queryKey: [table] });
    } catch (e) {
      toast.error("Calendar sync failed: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const textTeam = async (row: Row) => {
    setBusyId(row.id);
    try {
      const res = await notifyWorkItemTeam(kind, row.id);
      const sent = (res?.results || []).filter((r: { status: string }) => r.status === "sent").length;
      toast.success(sent ? `Text sent (${sent})` : "No mobile numbers to text");
    } catch (e) {
      toast.error("Text failed: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const heading = kind === "task" ? "Tasks" : "Tickets";
  const addPath = kind === "task" ? "/admin/tasks/add" : "/admin/tickets/add";
  const editPath = (id: string) => `${addPath}?id=${id}`;

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{heading}</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(addPath)}>
            <Plus className="mr-1 h-4 w-4" /> New {kind === "task" ? "Task" : "Ticket"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: [table] })}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder="Search number, subject, customer, staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {WORK_ITEM_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Assigned to" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {assignees.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Number</TableHead>
                  <TableHead>{kind === "task" ? "Task" : "Subject"}</TableHead>
                  <TableHead className="w-[150px]">{kind === "task" ? "Type" : "Reason"}</TableHead>
                  <TableHead className="w-[170px]">Customer</TableHead>
                  <TableHead className="w-[150px]">Assigned</TableHead>
                  <TableHead className="w-[120px]">{kind === "task" ? "Due" : "Expected"}</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Nothing here yet.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.number}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.title}</div>
                      {r.scheduled_date && (
                        <div className="text-xs text-muted-foreground">
                          {r.scheduled_date} {r.scheduled_time || ""}
                        </div>
                      )}
                      {r.created_by_name && (
                        <div className="text-[11px] text-muted-foreground">by {r.created_by_name}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{r.subtitle || "—"}</TableCell>
                    <TableCell className="text-xs">{r.customer_name || "Internal"}</TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 text-xs text-muted-foreground">
                        <Users className="mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>{teamNames(r.assigned_team).join(", ") || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{r.due || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusDotClass[r.status as WorkItemStatus] || "bg-gray-400"}`} />
                        <Select value={r.status} onValueChange={(v) => changeStatus(r, v as WorkItemStatus)}>
                          <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WORK_ITEM_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {r.google_event_id && (
                        <Badge variant="outline" className="mt-1 text-[10px]">On calendar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => navigate(editPath(r.id))}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2" disabled={busyId === r.id}
                          onClick={() => resync(r)} title="Add to calendar">
                          {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarCheck className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2" disabled={busyId === r.id}
                          onClick={() => textTeam(r)} title="Text the assigned staff">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-destructive"
                          disabled={busyId === r.id} onClick={() => remove(r)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
