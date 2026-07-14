import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Eye } from "lucide-react";

export default function SiteProfilesList() {
  const navigate = useNavigate();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["site-profiles"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Site Location Profiles</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="text-muted-foreground text-sm">No profiles yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                  <TableCell className="font-mono text-xs">{p.session_id}</TableCell>
                  <TableCell>{(p.ship_to?.name || p.bill_to?.name || "—")}</TableCell>
                  <TableCell className="capitalize">{p.location_type}</TableCell>
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
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
