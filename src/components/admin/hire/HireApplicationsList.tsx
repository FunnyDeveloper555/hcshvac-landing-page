import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function HireApplicationsList() {
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["hire-invitations"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hire_invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["hire-applications"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hire_applications")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Sent Application Links</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : invitations.length === 0 ? (
            <p className="text-muted-foreground">No links sent yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell>{format(new Date(inv.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>{inv.recipient_name || "—"}</TableCell>
                    <TableCell>{inv.recipient_phone || "—"}</TableCell>
                    <TableCell>{inv.recipient_email || "—"}</TableCell>
                    <TableCell className="uppercase text-xs">{inv.send_method}</TableCell>
                    <TableCell><Badge variant="outline">{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Submitted Applications</CardTitle></CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground">No applications submitted yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{format(new Date(a.submitted_at), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>{a.first_name} {a.last_name}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.phone}</TableCell>
                    <TableCell>
                      {[a.address_street, a.address_city, a.address_state, a.address_zip].filter(Boolean).join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
