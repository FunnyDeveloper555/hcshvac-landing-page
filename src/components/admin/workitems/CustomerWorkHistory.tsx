import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Loader2 } from "lucide-react";

interface HistoryItem {
  id: string;
  kind: "ticket" | "task";
  number: string | null;
  title: string;
  status: string;
  created_at: string;
}

interface Note {
  id: string;
  item_id: string;
  item_type: string;
  author_name: string | null;
  message: string;
  created_at: string;
}

/** Tickets and tasks linked to a customer, each with its stamped note log. */
export default function CustomerWorkHistory({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["customer-work-history", customerId],
    staleTime: 30_000,
    queryFn: async () => {
      const [t, k] = await Promise.all([
        supabase.from("tickets").select("id, ticket_number, title, status, created_at").eq("customer_id", customerId),
        supabase.from("tasks").select("id, task_number, title, status, created_at").eq("customer_id", customerId),
      ]);
      const items: HistoryItem[] = [
        ...((t.data as any[]) || []).map((r) => ({ id: r.id, kind: "ticket" as const, number: r.ticket_number, title: r.title, status: r.status, created_at: r.created_at })),
        ...((k.data as any[]) || []).map((r) => ({ id: r.id, kind: "task" as const, number: r.task_number, title: r.title, status: r.status, created_at: r.created_at })),
      ].sort((a, b) => b.created_at.localeCompare(a.created_at));
      let notes: Note[] = [];
      if (items.length) {
        const { data: n } = await supabase
          .from("work_item_replies")
          .select("*")
          .in("item_id", items.map((i) => i.id))
          .order("created_at");
        notes = (n as Note[]) || [];
      }
      return { items, notes };
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Tickets & Tasks History</CardTitle>
        <CardDescription>Every ticket and task for this customer, with each stamped note.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && !data?.items.length && <p className="text-sm text-muted-foreground">No tickets or tasks yet.</p>}
        {data?.items.map((it) => {
          const notes = data.notes.filter((n) => n.item_id === it.id);
          return (
            <div key={it.id} className="rounded-md border p-3">
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-2 text-left"
                onClick={() => navigate(`/admin/${it.kind === "ticket" ? "tickets" : "tasks"}/add?id=${it.id}`)}
              >
                <Badge variant={it.kind === "ticket" ? "destructive" : "secondary"}>{it.kind === "ticket" ? "Ticket" : "Task"}</Badge>
                <span className="font-mono text-xs">{it.number}</span>
                <span className="font-medium hover:underline">{it.title}</span>
                <Badge variant="outline" className="ml-auto capitalize">{it.status.replace("_", " ")}</Badge>
              </button>
              <div className="mt-1 text-xs text-muted-foreground">Created {new Date(it.created_at).toLocaleString()}</div>
              {notes.length > 0 && (
                <div className="mt-2 space-y-1 border-l-2 pl-3">
                  {notes.map((n) => (
                    <div key={n.id} className="text-sm">
                      <span className="text-xs text-muted-foreground">{n.author_name || "Staff"} • {new Date(n.created_at).toLocaleString()}: </span>
                      <span className="whitespace-pre-wrap">{n.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
