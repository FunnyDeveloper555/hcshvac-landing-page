import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowLeftRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 50;

function fmtDuration(s: number | null) {
  if (!s && s !== 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function DirIcon({ d }: { d: string }) {
  if (d === "inbound") return <PhoneIncoming className="h-4 w-4 text-green-600" />;
  if (d === "outbound") return <PhoneOutgoing className="h-4 w-4 text-blue-600" />;
  if (d === "internal") return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />;
  return <PhoneMissed className="h-4 w-4 text-muted-foreground" />;
}

export default function CallLogsList() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["call_logs_3cx", search, direction, page],
    queryFn: async () => {
      let q = supabase
        .from("call_logs_3cx")
        .select("*", { count: "exact" })
        .order("started_at", { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (direction !== "all") q = q.eq("direction", direction);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(
          `from_number.ilike.${s},to_number.ilike.${s},agent_extension.ilike.${s},caller_name.ilike.${s}`
        );
      }
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
    staleTime: 30_000,
  });

  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Call Log (3CX)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search number, extension, name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="max-w-xs"
            />
            <Select value={direction} onValueChange={(v) => { setDirection(v); setPage(0); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : (data?.rows.length ?? 0) === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No calls yet. They will appear here as 3CX posts CDR data.</TableCell></TableRow>
                ) : data!.rows.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("callpop:show", { detail: r }))}
                        title="Open screen pop"
                        className="p-1 rounded hover:bg-muted"
                      >
                        <DirIcon d={r.direction} />
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.started_at ? format(new Date(r.started_at), "yyyy-MM-dd HH:mm:ss") : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.from_number || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.to_number || "—"}</TableCell>
                    <TableCell>{r.agent_extension || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "answered" ? "default" : "secondary"}>
                        {r.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtDuration(r.duration_seconds)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {r.raw_payload?.reason_terminated || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {total} call{total === 1 ? "" : "s"} · Page {page + 1} of {totalPages}
            </span>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
