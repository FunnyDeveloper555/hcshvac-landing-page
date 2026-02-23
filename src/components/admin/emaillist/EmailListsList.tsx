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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Loader2, Mail, ChevronRight, ArrowUpDown, Send, Copy, Users } from "lucide-react";
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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

  // Fetch manual post counts per email list
  const { data: postCounts = {} } = useQuery({
    queryKey: ["email-list-post-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_list_posts")
        .select("email_list_id")
        .eq("is_active", true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row) => {
        counts[row.email_list_id] = (counts[row.email_list_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch group member counts per email list (via user_group_members through email_list_user_groups)
  const { data: groupMemberCounts = {} } = useQuery({
    queryKey: ["email-list-group-member-counts"],
    queryFn: async () => {
      // Get all email_list_user_groups assignments
      const { data: assignments, error: aErr } = await supabase
        .from("email_list_user_groups")
        .select("email_list_id, user_group_id");
      if (aErr) throw aErr;
      if (!assignments || assignments.length === 0) return {};

      // Get unique group ids
      const groupIds = [...new Set(assignments.map((a) => a.user_group_id))];
      const { data: members, error: mErr } = await supabase
        .from("user_group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);
      if (mErr) throw mErr;

      // Count unique members per group
      const groupMemberMap: Record<string, Set<string>> = {};
      (members || []).forEach((m) => {
        if (!groupMemberMap[m.group_id]) groupMemberMap[m.group_id] = new Set();
        groupMemberMap[m.group_id].add(m.user_id);
      });

      // Map to email list -> unique member count
      const listMembers: Record<string, Set<string>> = {};
      assignments.forEach((a) => {
        if (!listMembers[a.email_list_id]) listMembers[a.email_list_id] = new Set();
        const members = groupMemberMap[a.user_group_id];
        if (members) members.forEach((uid) => listMembers[a.email_list_id].add(uid));
      });

      const counts: Record<string, number> = {};
      Object.entries(listMembers).forEach(([listId, members]) => {
        counts[listId] = members.size;
      });
      return counts;
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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          (l.description || "").toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter((l) => l.is_active === isActive);
    }

    if (groupFilter !== "all") {
      result = result.filter((l) => {
        const groups = groupsByListId[l.id] || [];
        return groups.some((g) => {
          const matchGroup = allUserGroups.find((ug) => ug.id === groupFilter);
          return matchGroup && g === matchGroup.name;
        });
      });
    }

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
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete email list"),
  });

  // Clone mutation
  const cloneMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      // 1. Get source list
      const { data: source, error: sErr } = await supabase
        .from("email_lists")
        .select("*")
        .eq("id", sourceId)
        .single();
      if (sErr) throw sErr;

      // 2. Create new list
      const { data: newList, error: nErr } = await supabase
        .from("email_lists")
        .insert({
          name: `${source.name} (Copy)`,
          description: source.description,
          is_active: source.is_active,
          email_list_group_id: source.email_list_group_id,
        })
        .select("id")
        .single();
      if (nErr) throw nErr;

      // 3. Copy user group assignments
      const { data: groups } = await supabase
        .from("email_list_user_groups")
        .select("user_group_id")
        .eq("email_list_id", sourceId);
      if (groups && groups.length > 0) {
        await supabase.from("email_list_user_groups").insert(
          groups.map((g) => ({ email_list_id: newList.id, user_group_id: g.user_group_id }))
        );
      }

      // 4. Copy emails
      const { data: emails } = await supabase
        .from("email_list_emails")
        .select("subject, html_content, is_active, display_order")
        .eq("email_list_id", sourceId);
      if (emails && emails.length > 0) {
        await supabase.from("email_list_emails").insert(
          emails.map((e) => ({ ...e, email_list_id: newList.id }))
        );
      }

      return newList.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["email-lists"] });
      logAction("create", "email_list", id, { action: "cloned" });
      toast.success("Email list cloned successfully");
    },
    onError: () => toast.error("Failed to clone email list"),
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
                  <TableHead>Subscribers</TableHead>
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
                  const manualCount = (postCounts as Record<string, number>)[list.id] || 0;
                  const groupCount = (groupMemberCounts as Record<string, number>)[list.id] || 0;
                  const totalSubscribers = manualCount + groupCount;
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
                            <Badge variant="outline" className="gap-1">
                              <Users className="h-3 w-3" />
                              {totalSubscribers}
                            </Badge>
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
                                variant="default"
                                size="sm"
                                onClick={() => toast.info("Email sending will be configured when an email service is set up.")}
                                title="Submit / Send emails"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cloneMutation.mutate(list.id)}
                                disabled={cloneMutation.isPending}
                                title="Clone this list"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
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
                                onClick={() => setDeleteTarget({ id: list.id, name: list.name })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={7} className="p-0">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This will also remove all associated emails, posts, and subscriber data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
