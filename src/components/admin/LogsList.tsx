import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

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
  { value: "appointment", label: "Appointments" },
  { value: "company", label: "Companies" },
  { value: "employee", label: "Employees" },
  { value: "vendor", label: "Vendors" },
  { value: "service", label: "Services" },
  { value: "hero_content", label: "Hero Content" },
  { value: "hero_image", label: "Hero Images" },
  { value: "customer_registration", label: "Registrations" },
  { value: "settings", label: "Settings" },
];

const actionTypes = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "view", label: "View" },
  { value: "status_change", label: "Status Change" },
  { value: "import", label: "Import" },
  { value: "export", label: "Export" },
];

const LogsList = () => {
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
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
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEntity && matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      view: "outline",
      status_change: "secondary",
      import: "default",
      export: "outline",
    };
    return <Badge variant={variants[action] || "outline"}>{action}</Badge>;
  };

  const getEntityBadge = (entityType: string) => {
    return <Badge variant="outline">{entityType.replace("_", " ")}</Badge>;
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
        <h2 className="text-2xl font-bold">Admin Activity Logs</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[180px]"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[140px]">
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
                  <TableHead>Timestamp</TableHead>
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
                        {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {log.user_email}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                      <TableCell className="max-w-[300px]">
                        {log.details ? (
                          <span className="text-xs text-muted-foreground truncate block">
                            {JSON.stringify(log.details).slice(0, 50)}
                            {JSON.stringify(log.details).length > 50 && "..."}
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
