import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Loader2, Pencil, Users } from "lucide-react";
import { statusDotClass, teamNames, WorkItemStatus } from "./workItems";

interface BoardItem {
  kind: "ticket" | "task";
  id: string;
  number: string | null;
  title: string;
  subtitle: string | null;
  customer_name: string | null;
  date: string | null;
  time: string | null;
  status: string;
  team: string[];
}

const todayKey = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export default function WorkItemsBoard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [person, setPerson] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["work-items-board"],
    queryFn: async () => {
      const [ticketsRes, tasksRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("id, ticket_number, subject, reason, customer_name, scheduled_date, scheduled_time, expected_completion_date, status, assigned_team")
          .in("status", ["open", "in_progress"]),
        supabase
          .from("tasks")
          .select("id, task_number, title, task_type, customer_name, scheduled_date, scheduled_time, due_date, status, assigned_team")
          .in("status", ["open", "in_progress"]),
      ]);
      if (ticketsRes.error) throw ticketsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const tickets: BoardItem[] = (ticketsRes.data || []).map((t) => ({
        kind: "ticket",
        id: t.id,
        number: t.ticket_number,
        title: t.subject,
        subtitle: t.reason,
        customer_name: t.customer_name,
        date: t.scheduled_date || t.expected_completion_date,
        time: t.scheduled_time,
        status: t.status,
        team: teamNames(t.assigned_team),
      }));
      const tasks: BoardItem[] = (tasksRes.data || []).map((t) => ({
        kind: "task",
        id: t.id,
        number: t.task_number,
        title: t.title,
        subtitle: t.task_type,
        customer_name: t.customer_name,
        date: t.scheduled_date || t.due_date,
        time: t.scheduled_time,
        status: t.status,
        team: teamNames(t.assigned_team),
      }));
      return [...tickets, ...tasks].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
    },
    staleTime: 15_000,
  });

  const people = useMemo(() => {
    const names = new Set<string>();
    (items || []).forEach((i) => i.team.forEach((n) => names.add(n)));
    return Array.from(names).sort();
  }, [items]);

  const visible = useMemo(
    () => (items || []).filter((i) => person === "all" || i.team.includes(person)),
    [items, person],
  );

  const groups = useMemo(() => {
    const today = todayKey();
    const weekEnd = addDays(7);
    return {
      overdue: visible.filter((i) => i.date && i.date < today),
      today: visible.filter((i) => i.date === today),
      week: visible.filter((i) => i.date && i.date > today && i.date <= weekEnd),
      later: visible.filter((i) => !i.date || i.date > weekEnd),
    };
  }, [visible]);

  const complete = async (item: BoardItem) => {
    setBusyId(item.id);
    const { error } = await supabase
      .from(item.kind === "task" ? "tasks" : "tickets")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", item.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["work-items-board"] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Marked complete");
  };

  const ItemRow = ({ item }: { item: BoardItem }) => (
    <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
      <span className={`h-2 w-2 rounded-full ${statusDotClass[item.status as WorkItemStatus] || "bg-gray-400"}`} />
      <Badge variant={item.kind === "ticket" ? "default" : "secondary"} className="text-[10px] uppercase">
        {item.kind}
      </Badge>
      <span className="font-mono text-[11px] text-muted-foreground">{item.number}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[item.subtitle, item.customer_name, item.date ? `${item.date}${item.time ? ` ${item.time}` : ""}` : null]
            .filter(Boolean)
            .join(" • ")}
        </div>
        {item.team.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" /> {item.team.join(", ")}
          </div>
        )}
      </div>
      <Button size="sm" variant="outline" className="h-7 px-2"
        onClick={() => navigate(`/admin/${item.kind === "task" ? "tasks" : "tickets"}/add?id=${item.id}`)}>
        <Pencil className="h-3 w-3" />
      </Button>
      <Button size="sm" className="h-7 px-2" disabled={busyId === item.id} onClick={() => complete(item)}>
        {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
        <span className="ml-1 text-xs">Done</span>
      </Button>
    </div>
  );

  const Group = ({ title, list }: { title: string; list: BoardItem[] }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          {title} <span className="text-muted-foreground">({list.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing here.</p>
        ) : (
          list.map((i) => <ItemRow key={`${i.kind}-${i.id}`} item={i} />)
        )}
      </CardContent>
    </Card>
  );

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
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ClipboardList className="h-5 w-5" /> Tickets &amp; Tasks Board
        </h2>
        <Select value={person} onValueChange={setPerson}>
          <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Staff member" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {people.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Group title="Overdue" list={groups.overdue} />
        <Group title="Today" list={groups.today} />
        <Group title="This week" list={groups.week} />
        <Group title="Later / no date" list={groups.later} />
      </div>
    </div>
  );
}
