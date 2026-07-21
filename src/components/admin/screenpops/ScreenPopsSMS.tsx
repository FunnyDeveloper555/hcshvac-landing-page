import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { MessageSquare, Mail, ExternalLink, Clock, CheckCircle, Send, Eye, XCircle } from "lucide-react";

interface Invitation {
  id: string;
  company_id: string | null;
  invitation_type: string;
  customer_type: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  token: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
  notes: string | null;
  companies?: { name: string } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  sent: { label: "Sent", variant: "default", icon: Send },
  opened: { label: "Opened", variant: "outline", icon: Eye },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
  expired: { label: "Expired", variant: "destructive", icon: XCircle },
};

export default function ScreenPopsSMS() {
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["screenpops-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_invitations")
        .select("*, companies:company_id (name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Invitation[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("screenpops-invitations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_invitations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["screenpops-invitations"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Screen Pops — SMS / Email Invitations
        </h2>
        <p className="text-sm text-muted-foreground">
          Live updates for invitations sent to customers. Rows update automatically when a customer opens or completes the form.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No invitations yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.companies?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{inv.invitation_type}</Badge>
                      <span className="ml-1 text-xs text-muted-foreground capitalize">({inv.customer_type})</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {inv.recipient_phone && (
                          <div className="flex items-center gap-1 text-xs"><MessageSquare className="h-3 w-3" />{inv.recipient_phone}</div>
                        )}
                        {inv.recipient_email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{inv.recipient_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-xs">{inv.sent_at ? format(new Date(inv.sent_at), "MMM d, h:mm a") : "-"}</TableCell>
                    <TableCell className="text-xs">{inv.opened_at ? format(new Date(inv.opened_at), "MMM d, h:mm a") : "-"}</TableCell>
                    <TableCell className="text-xs">{inv.completed_at ? format(new Date(inv.completed_at), "MMM d, h:mm a") : "-"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/book/${inv.token}`, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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
