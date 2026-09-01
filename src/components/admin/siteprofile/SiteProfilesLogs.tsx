import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Eye, History, Building2 } from "lucide-react";

function fmtAddr(st: any) {
  if (!st) return "";
  const parts = [st.address, st.city, st.state, st.zip].filter(Boolean);
  return parts.join(", ");
}

export default function SiteProfilesLogs() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["site-profiles-logs"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_profiles")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data;
    },
  });

  // Group by revision key (address + unit_label); keep groups with 2+ entries and
  // return only the older revisions (everything except the latest per group).
  const historical = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const p of profiles) {
      const addr = (fmtAddr(p.ship_to) || fmtAddr(p.bill_to) || p.id).toLowerCase();
      const key = `${addr}||${(p.unit_label || "").toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    const out: any[] = [];
    for (const rows of groups.values()) {
      if (rows.length < 2) continue;
      rows.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );
      // skip the first (latest = shown in List)
      for (let i = 1; i < rows.length; i++) out.push(rows[i]);
    }
    return out;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return historical;
    return historical.filter((p: any) => {
      const hay = [
        p.report_number, p.session_id, p.unit_label,
        p.ship_to?.name, p.bill_to?.name,
        fmtAddr(p.ship_to), fmtAddr(p.bill_to),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [historical, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of filtered) {
      const key = fmtAddr(p.ship_to) || fmtAddr(p.bill_to) || "(no address)";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Site Profile Logs (historical revisions)
        </CardTitle>
        <Input
          className="h-8 text-xs max-w-xs"
          placeholder="Search report #, unit, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : grouped.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No historical revisions yet. Once a location has more than one report, older versions appear here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report #</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map(([address, rows]) => (
                <Fragment key={address}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={7} className="py-1 text-xs font-medium text-muted-foreground">
                      <Building2 className="h-3 w-3 inline mr-1" />
                      {address}
                      <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {rows.length} older revision{rows.length > 1 ? "s" : ""}
                      </span>
                    </TableCell>
                  </TableRow>
                  {rows.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.report_number || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {p.unit_label ? (
                          <Badge variant="secondary" className="text-[10px]">{p.unit_label}</Badge>
                        ) : ""}
                      </TableCell>
                      <TableCell>{p.ship_to?.name || p.bill_to?.name || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(p.updated_at || p.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="capitalize text-xs">{p.location_type}</TableCell>
                      <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/site-profiles/edit?id=${p.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
