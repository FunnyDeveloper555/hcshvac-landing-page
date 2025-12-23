import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, ExternalLink, Clock, CheckCircle, Send, Eye, XCircle } from "lucide-react";

interface BookingInvitation {
  id: string;
  company_id: string;
  invitation_type: string;
  customer_type: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  token: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
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

export default function SMSLinkList() {
  const navigate = useNavigate();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["booking-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_invitations")
        .select(`
          *,
          companies:company_id (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BookingInvitation[];
    },
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const copyBookingLink = (token: string) => {
    const url = `${window.location.origin}/book/${token}`;
    navigator.clipboard.writeText(url);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Link Invitations</h2>
          <p className="text-muted-foreground">Manage booking link invitations sent to customers</p>
        </div>
        <Button onClick={() => navigate("/admin/sms-link/send")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Send New Link
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Invitations
          </CardTitle>
          <CardDescription>
            Track the status of booking link invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations sent yet. Click "Send New Link" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.companies?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {invitation.invitation_type}
                      </Badge>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        ({invitation.customer_type})
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {invitation.recipient_phone && (
                          <div className="text-sm">{invitation.recipient_phone}</div>
                        )}
                        {invitation.recipient_email && (
                          <div className="text-sm text-muted-foreground">{invitation.recipient_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>
                      {invitation.sent_at 
                        ? format(new Date(invitation.sent_at), "MMM d, yyyy h:mm a")
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyBookingLink(invitation.token)}
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/book/${invitation.token}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
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
