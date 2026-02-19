import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FolderOpen, Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { format } from "date-fns";

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export default function UserGroupsList() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin-user-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_groups")
        .select("*")
        .order("name");
      if (error) throw error;

      // Get member counts
      const { data: members, error: mErr } = await supabase
        .from("user_group_members")
        .select("group_id");
      if (mErr) throw mErr;

      const countMap = new Map<string, number>();
      members?.forEach((m) => {
        countMap.set(m.group_id, (countMap.get(m.group_id) || 0) + 1);
      });

      return (data || []).map((g) => ({
        ...g,
        member_count: countMap.get(g.id) || 0,
      })) as UserGroup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      if (editingGroup) {
        const { error } = await supabase
          .from("user_groups")
          .update({ name: name.trim(), description: description.trim() || null, is_active: isActive })
          .eq("id", editingGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_groups")
          .insert({ name: name.trim(), description: description.trim() || null, is_active: isActive });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["all-user-groups"] });
      toast.success(editingGroup ? "Group updated" : "Group created");
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["all-user-groups"] });
      toast.success("Group deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditingGroup(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || "");
    setIsActive(group.is_active);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingGroup(null);
    setName("");
    setDescription("");
    setIsActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            User Groups
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Create and manage user groups</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Groups ({groups.length})</CardTitle>
          <CardDescription>Groups are used to organize users into logical categories.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No groups yet. Click "Add Group" to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {group.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {group.member_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.is_active ? "default" : "outline"}>
                          {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(group.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete group "${group.name}"? Members will be unassigned.`)) {
                                deleteMutation.mutate(group.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Add New Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup ? "Update the group details below." : "Create a new user group."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g. Technicians, Managers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description</Label>
              <Textarea
                id="group-desc"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingGroup ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
