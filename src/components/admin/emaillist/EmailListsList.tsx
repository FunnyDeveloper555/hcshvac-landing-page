import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Edit, Trash2, Loader2, Mail, Search, ChevronRight, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

type SortField = "name" | "created_at" | "is_active";
type SortDir = "asc" | "desc";

export default function EmailListsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch email lists with their group name
  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["email-lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_lists")
        .select("*, email_list_groups(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user group assignments for all email lists
  const { data: listUserGroups = [] } = useQuery({
    queryKey: ["email-list-user-groups-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_list_user_groups")
        .select("email_list_id, user_groups(id, name)");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all user groups for filter dropdown
  const { data: allUserGroups = [] } = useQuery({
    queryKey: ["user-groups-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_groups")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch emails for expanded row
  const { data: expandedEmails = [], isLoading: emailsLoading } = useQuery({
    queryKey: ["email-list-emails-expand", expandedId],
    enabled: !!expandedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_list_emails")
        .select("id, subject, is_active, display_order, created_at")
        .eq("email_list_id", expandedId!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Build a map: email_list_id -> user group names
  const groupsByListId = useMemo(() => {
    const map: Record<string, string[]> = {};
    listUserGroups.forEach((row: any) => {
      const listId = row.email_list_id;
      const groupName = row.user_groups?.name;
      if (groupName) {
        if (!map[listId]) map[listId] = [];
        map[listId].push(groupName);
      }
    });
    return map;
  }, [listUserGroups]);

  // Filter & sort
  const filteredLists = useMemo(() => {
    let result = [...lists];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          (l.description || "").toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((l) => l.is_active === isActive);
    }

    // Group filter
    if (groupFilter !== "all") {
      result = result.filter((l) => {
        const groups = groupsByListId[l.id] || [];
        return groups.some((g) => {
          const matchGroup = allUserGroups.find((ug) => ug.id === groupFilter);
          return matchGroup && g === matchGroup.name;
        });
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "is_active") {
        cmp = (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1);
      } else {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [lists, searchTerm, statusFilter, groupFilter, sortField, sortDir, groupsByListId, allUserGroups]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_lists").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["email-lists"] });
      logAction("delete", "email_list", id);
      toast.success("Email list deleted");
    },
    onError: () => toast.error("Failed to delete email list"),
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setGroupFilter("all");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Lists</h2>
          <p className="text-muted-foreground">Manage your email lists and subscribers</p>
        </div>
        <Button onClick={() => navigate("/admin/email-lists/add")}>
          <Plus className="mr-2 h-4 w-4" /> New Email List
        </Button>
      </div>

      {/* Search, Sort & Filter Bar */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="User Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {allUserGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchTerm || statusFilter !== "all" || groupFilter !== "all") && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Lists ({filteredLists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {lists.length === 0 ? "No email lists yet. Create your first one!" : "No results match your filters."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                      Name <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>User Groups</TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("is_active")}>
                      Status <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("created_at")}>
                      Created <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLists.map((list) => {
                  const userGroups = groupsByListId[list.id] || [];
                  const isExpanded = expandedId === list.id;
                  return (
                    <Collapsible key={list.id} asChild open={isExpanded} onOpenChange={(open) => setExpandedId(open ? list.id : null)}>
                      <>
                        <TableRow className="cursor-pointer">
                          <TableCell className="w-8 pr-0">
                            <CollapsibleTrigger asChild>
                              <button className="p-1 rounded hover:bg-muted">
                                <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                              </button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="font-medium">
                            <CollapsibleTrigger asChild>
                              <span className="cursor-pointer hover:underline">{list.name}</span>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell>
                            {userGroups.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {userGroups.map((g, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={list.is_active ? "default" : "secondary"}>
                              {list.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(list.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/email-lists/edit?id=${list.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Delete this email list?")) deleteMutation.mutate(list.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={6} className="p-0">
                              <div className="bg-muted/30 border-t px-8 py-4">
                                <h4 className="text-sm font-semibold mb-2">Emails in this list</h4>
                                {emailsLoading ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                  </div>
                                ) : expandedEmails.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No emails added yet.</p>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="h-8 text-xs">Order</TableHead>
                                        <TableHead className="h-8 text-xs">Subject</TableHead>
                                        <TableHead className="h-8 text-xs">Status</TableHead>
                                        <TableHead className="h-8 text-xs">Created</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {expandedEmails.map((email) => (
                                        <TableRow key={email.id}>
                                          <TableCell className="py-1.5 text-sm">{email.display_order}</TableCell>
                                          <TableCell className="py-1.5 text-sm font-medium">{email.subject || "—"}</TableCell>
                                          <TableCell className="py-1.5">
                                            <Badge variant={email.is_active ? "default" : "secondary"} className="text-xs">
                                              {email.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-1.5 text-sm">{new Date(email.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
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
