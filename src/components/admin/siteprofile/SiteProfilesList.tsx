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
import { Eye, Building2 } from "lucide-react";

function fmtAddr(st: any) {
  if (!st) return "";
  const parts = [st.address, st.city, st.state, st.zip].filter(Boolean);
  return parts.join(", ");
}

export default function SiteProfilesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["site-profiles"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p: any) => {
      const hay = [
        p.report_number, p.session_id, p.unit_label,
        p.ship_to?.name, p.bill_to?.name,
        fmtAddr(p.ship_to), fmtAddr(p.bill_to),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [profiles, search]);

  // Group by address so multi-unit profiles cluster
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
        <CardTitle className="text-sm">Site Location Profiles</CardTitle>
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
          <p className="text-muted-foreground text-sm">No profiles yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report #</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Created</TableHead>
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
                      {rows.length > 1 && (
                        <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {rows.length} units
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  {rows.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.report_number || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {p.unit_label ? (
                          <Badge variant="secondary" className="text-[10px]">{p.unit_label}</Badge>
                        ) : p.mdu ? <span className="text-muted-foreground">—</span> : ""}
                      </TableCell>
                      <TableCell>{p.ship_to?.name || p.bill_to?.name || "—"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(p.created_at), "MMM d, yyyy h:mm a")}</TableCell>
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
