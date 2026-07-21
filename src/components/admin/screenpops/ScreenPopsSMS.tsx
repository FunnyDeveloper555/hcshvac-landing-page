import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { MessageSquare, Mail, ExternalLink, Clock, CheckCircle, Send, Eye, XCircle, Search, Bell } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("smspop_auto_enabled") === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("smspop_auto_enabled", autoEnabled ? "1" : "0"); } catch {}
    window.dispatchEvent(new CustomEvent("smspop:auto-toggle", { detail: { enabled: autoEnabled } }));
  }, [autoEnabled]);

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

  const filtered = invitations.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (i.companies?.name || "").toLowerCase().includes(q) ||
      (i.recipient_phone || "").toLowerCase().includes(q) ||
      (i.recipient_email || "").toLowerCase().includes(q) ||
      (i.status || "").toLowerCase().includes(q)
    );
  });

  const showPop = (inv: Invitation) => {
    window.dispatchEvent(new CustomEvent("smspop:show", { detail: inv }));
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Screen Pops — SMS / Email Invitations
        </h2>
        <p className="text-sm text-muted-foreground">
          Live status of invitations sent to customers. Trigger a screen pop manually or enable auto pop for new activity.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by company, phone, email or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="sms-auto" className="text-sm">Auto Screen Pop</Label>
          <Switch id="sms-auto" checked={autoEnabled} onCheckedChange={setAutoEnabled} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No invitations found.</div>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
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
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => showPop(inv)}>Show Pop</Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/book/${inv.token}`, "_blank")}>
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
