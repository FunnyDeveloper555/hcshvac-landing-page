import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HireApplicationsList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  const { data: accounts = [] } = useQuery({
    queryKey: ["applicant-accounts"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_accounts")
        .select("id, application_id, status");
      if (error) throw error;
      return data;
    },
  });
  const accountByApp = new Map<string, any>();
  accounts.forEach((a: any) => a.application_id && accountByApp.set(a.application_id, a));

  const createPortal = useMutation({
    mutationFn: async (application_id: string) => {
      const { data, error } = await supabase.functions.invoke("create-applicant-account", {
        body: { application_id, portal_base_url: window.location.origin },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Portal invite sent", description: "Applicant will receive an email to set up their account." });
      qc.invalidateQueries({ queryKey: ["applicant-accounts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
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
                  <TableHead>Portal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a: any) => {
                  const acct = accountByApp.get(a.id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{format(new Date(a.submitted_at), "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell>{a.first_name} {a.last_name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.phone}</TableCell>
                      <TableCell>
                        {acct ? <Badge variant="secondary">{acct.status}</Badge>
                              : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {acct ? (
                          <Button size="sm" variant="outline"
                            onClick={() => navigate(`/admin/new-hire/applicant/${acct.id}`)}>
                            <ExternalLink className="h-3 w-3 mr-1" /> Open
                          </Button>
                        ) : (
                          <Button size="sm" disabled={createPortal.isPending}
                            onClick={() => createPortal.mutate(a.id)}>
                            {createPortal.isPending
                              ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              : <UserPlus className="h-3 w-3 mr-1" />}
                            Create Portal Account
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
