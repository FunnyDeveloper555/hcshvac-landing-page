import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { WorkItemKind } from "./workItems";

/** Read-only history of ticket/task activity, taken from the admin activity log. */
export default function WorkItemsLogs({ kind }: { kind: WorkItemKind }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["work-item-logs", kind],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("id, created_at, user_email, action, entity_id, details")
        .eq("entity_type", kind)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const describe = (details: unknown): string => {
    if (!details || typeof details !== "object") return "—";
    return Object.entries(details as Record<string, unknown>)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
      .join(" • ");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{kind === "task" ? "Task" : "Ticket"} Logs</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">When</TableHead>
                  <TableHead className="w-[220px]">Who</TableHead>
                  <TableHead className="w-[130px]">Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No activity recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {(logs || []).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{l.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {String(l.action).replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{describe(l.details)}</TableCell>
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
