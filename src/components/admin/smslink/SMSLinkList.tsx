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
  link_type?: string | null;
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

const linkTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  registration: { label: "Registration", variant: "secondary" },
  booking: { label: "Booking", variant: "default" },
  both: { label: "Registration + Booking", variant: "outline" },
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">SMS Link Invitations</h2>
          <p className="text-muted-foreground">Manage booking link invitations sent to customers</p>
        </div>
        <Button onClick={() => navigate("/admin/sms-link/send")} className="flex w-full items-center gap-2 sm:w-auto">
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
        <CardContent className="px-3 sm:px-6">
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invitations sent yet. Click "Send New Link" to get started.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="space-y-3 rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold">
                          {invitation.companies?.name || "Unknown"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant={linkTypeConfig[invitation.link_type || ""]?.variant || "outline"}>
                            {linkTypeConfig[invitation.link_type || ""]?.label || "Booking"}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {invitation.invitation_type}
                          </Badge>
                          <span className="text-xs capitalize text-muted-foreground">
                            {invitation.customer_type}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(invitation.status)}</div>
                    </div>

                    <dl className="grid gap-2 text-sm">
                      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                        <dt className="text-muted-foreground">Recipient</dt>
                        <dd className="min-w-0">
                          {invitation.recipient_phone && <div>{invitation.recipient_phone}</div>}
                          {invitation.recipient_email && (
                            <div className="break-all text-muted-foreground">{invitation.recipient_email}</div>
                          )}
                          {!invitation.recipient_phone && !invitation.recipient_email && "—"}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                        <dt className="text-muted-foreground">Sent</dt>
                        <dd>
                          {invitation.sent_at
                            ? format(new Date(invitation.sent_at), "MMM d, yyyy h:mm a")
                            : "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="grid grid-cols-[1fr_auto] gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyBookingLink(invitation.token)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Open booking link"
                        aria-label="Open booking link"
                        onClick={() => window.open(`/book/${invitation.token}`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[1000px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[24%]">Company</TableHead>
                      <TableHead className="w-[12%]">Type</TableHead>
                      <TableHead className="w-[26%]">Recipient</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[14%] whitespace-nowrap">Sent At</TableHead>
                      <TableHead className="w-[14%] whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          <span className="block truncate" title={invitation.companies?.name || "Unknown"}>
                            {invitation.companies?.name || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={linkTypeConfig[invitation.link_type || ""]?.variant || "outline"}>
                            {linkTypeConfig[invitation.link_type || ""]?.label || "Booking"}
                          </Badge>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge variant="outline" className="capitalize">
                              {invitation.invitation_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              ({invitation.customer_type})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="break-all">
                          <div className="space-y-1">
                            {invitation.recipient_phone && (
                              <div className="whitespace-nowrap text-sm">{invitation.recipient_phone}</div>
                            )}
                            {invitation.recipient_email && (
                              <div className="break-all text-sm text-muted-foreground">{invitation.recipient_email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invitation.sent_at
                            ? format(new Date(invitation.sent_at), "MMM d, yyyy h:mm a")
                            : "—"}
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
                              title="Open booking link"
                              aria-label="Open booking link"
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
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
