import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Phone, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AdminLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const entityTypes = [
  { value: "all", label: "All Entities" },
  { value: "auth", label: "Authentication" },
  { value: "call", label: "Phone Calls" },
  { value: "appointment", label: "Appointments" },
  { value: "company", label: "Companies" },
  { value: "employee", label: "Employees" },
  { value: "vendor", label: "Vendors" },
  { value: "service", label: "Services" },
  { value: "hero_content", label: "Hero Content" },
  { value: "hero_image", label: "Hero Images" },
  { value: "hero", label: "Hero" },
  { value: "customer_registration", label: "Customer Registrations" },
  { value: "customer", label: "Customers" },
  { value: "booking_invitation", label: "Booking Invitations" },
  { value: "location_profile", label: "Location Profiles" },
  { value: "photo", label: "Photos" },
  { value: "settings", label: "Settings" },
];

const actionTypes = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "call_in", label: "Call In" },
  { value: "call_out", label: "Called" },
  { value: "email_sent", label: "Email Sent" },
  { value: "email_received", label: "Email Received" },
  { value: "sms_sent", label: "SMS Sent" },
  { value: "sms_received", label: "SMS Received" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "view", label: "View" },
  { value: "location_profile_created", label: "Location Profile Created" },
  { value: "location_profile_updated", label: "Location Profile Updated" },
  { value: "photo_added", label: "Photo Added" },
  { value: "warranty_status_changed", label: "Warranty Status Changed" },
  { value: "note_added", label: "Note Added" },
  { value: "status_change", label: "Status Change" },
  { value: "send_booking_link", label: "Send Booking Link" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
];

const LogsList = () => {
  const navigate = useNavigate();
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AdminLog[];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesSearch =
      searchTerm === "" ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesEntity && matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      view: "outline",
      login: "default",
      logout: "outline",
      call_in: "default",
      call_out: "secondary",
      email_sent: "secondary",
      email_received: "outline",
      sms_sent: "secondary",
      sms_received: "outline",
      location_profile_created: "default",
      location_profile_updated: "secondary",
      photo_added: "default",
      warranty_status_changed: "secondary",
      note_added: "outline",
      status_change: "secondary",
      send_booking_link: "default",
      import: "default",
      export: "outline",
    };
    const displayNames: Record<string, string> = {
      call_in: "Call In",
      call_out: "Called",
      email_sent: "Email Sent",
      email_received: "Email Received",
      sms_sent: "SMS Sent",
      sms_received: "SMS Received",
      location_profile_created: "Profile Created",
      location_profile_updated: "Profile Updated",
      photo_added: "Photo Added",
      warranty_status_changed: "Warranty Changed",
      note_added: "Note Added",
      send_booking_link: "Booking Link Sent",
      status_change: "Status Change",
    };
    return <Badge variant={variants[action] || "outline"}>{displayNames[action] || action}</Badge>;
  };

  const getEntityBadge = (entityType: string) => {
    const displayNames: Record<string, string> = {
      customer_registration: "Customer",
      booking_invitation: "Booking",
      location_profile: "Location",
      hero_content: "Hero",
      hero_image: "Image",
    };
    return <Badge variant="outline">{displayNames[entityType] || entityType.replace("_", " ")}</Badge>;
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    
    const entries = Object.entries(details);
    if (entries.length === 0) return null;

    // Format specific fields nicely
    const formattedParts: string[] = [];
    
    if (details.call_reason) {
      const reasonDisplay = String(details.call_reason).replace(/_/g, " ");
      formattedParts.push(`Reason: ${reasonDisplay}`);
    }
    if (details.phone_number) {
      formattedParts.push(`Phone: ${details.phone_number}`);
    }
    if (details.customer_name) {
      formattedParts.push(`Customer: ${details.customer_name}`);
    }
    if (details.notes) {
      formattedParts.push(`Notes: ${String(details.notes).slice(0, 30)}...`);
    }

    if (formattedParts.length > 0) {
      return formattedParts.join(" | ");
    }

    // Fallback to JSON
    const jsonStr = JSON.stringify(details);
    return jsonStr.length > 60 ? jsonStr.slice(0, 60) + "..." : jsonStr;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/admin/logs/call")} variant="default" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Log Call
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[200px]"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {actionTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Activity Log ({filteredLogs?.length || 0} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{format(new Date(log.created_at), "MMM dd, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.user_email}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                      <TableCell className="max-w-[300px]">
                        {log.details ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {formatDetails(log.details)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsList;
