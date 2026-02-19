import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldAlert, UserPlus, Search, Users, Mail, Loader2, X } from "lucide-react";
import { format } from "date-fns";

type AppRole = "admin" | "moderator" | "user";

interface UserGroup {
  id: string;
  name: string;
}

interface ProfileWithRoles {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: AppRole[];
  groups: UserGroup[];
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Admin", icon: ShieldAlert, color: "bg-destructive text-destructive-foreground" },
  moderator: { label: "Moderator", icon: ShieldCheck, color: "bg-primary text-primary-foreground" },
  user: { label: "User", icon: Shield, color: "bg-muted text-muted-foreground" },
};

export default function UsersList() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("user");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileWithRoles | null>(null);

  // Fetch all groups
  const { data: allGroups = [] } = useQuery({
    queryKey: ["all-user-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_groups")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles + roles + groups
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users-roles"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, created_at")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      const { data: memberships, error: mErr } = await supabase
        .from("user_group_members")
        .select("user_id, group_id, user_groups(id, name)");
      if (mErr) throw mErr;

      const roleMap = new Map<string, AppRole[]>();
      roles?.forEach((r) => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role as AppRole);
        roleMap.set(r.user_id, existing);
      });

      const groupMap = new Map<string, UserGroup[]>();
      memberships?.forEach((m: any) => {
        const existing = groupMap.get(m.user_id) || [];
        if (m.user_groups) {
          existing.push({ id: m.user_groups.id, name: m.user_groups.name });
        }
        groupMap.set(m.user_id, existing);
      });

      return (profiles || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.user_id) || [],
        groups: groupMap.get(p.user_id) || [],
      })) as ProfileWithRoles[];
    },
  });

  // Assign role
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: (_, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
      logAction("create", "auth", userId, { action: "role_assigned", role });
      toast.success(`Role "${role}" assigned successfully`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Revoke role
  const revokeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      if (error) throw error;
    },
    onSuccess: (_, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
      logAction("delete", "auth", userId, { action: "role_revoked", role });
      toast.success(`Role "${role}" revoked successfully`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Toggle group membership
  const toggleGroupMembership = useMutation({
    mutationFn: async ({ userId, groupId, isAdding }: { userId: string; groupId: string; isAdding: boolean }) => {
      if (isAdding) {
        const { error } = await supabase
          .from("user_group_members")
          .insert({ user_id: userId, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_group_members")
          .delete()
          .eq("user_id", userId)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { userId, groupId, isAdding }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
      logAction(isAdding ? "create" : "delete", "auth", userId, { action: isAdding ? "group_added" : "group_removed", group_id: groupId });
      toast.success(isAdding ? "User added to group" : "User removed from group");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Invite user
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setInviting(true);
    try {
      const resp = await supabase.functions.invoke("invite-user", {
        body: { email: inviteEmail.trim(), role: inviteRole, display_name: inviteDisplayName.trim() || undefined },
      });
      if (resp.error) throw new Error(resp.error.message || "Invite failed");
      if (resp.data?.error) throw new Error(resp.data.error);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteDisplayName("");
      setInviteRole("user");
      queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openGroupDialog = (user: ProfileWithRoles) => {
    setSelectedUser(user);
    setGroupDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage users, roles, and group assignments
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["admin", "moderator", "user"] as AppRole[]).map((role) => {
          const cfg = roleConfig[role];
          const count = users.filter((u) => u.roles.includes(role)).length;
          return (
            <Card key={role}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <cfg.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{cfg.label}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filtered.length})</CardTitle>
          <CardDescription>Click a role badge to revoke it, use the dropdown to assign roles, or manage group memberships.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.display_name || "—"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email || "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">No roles</span>
                          )}
                          {user.roles.map((role) => {
                            const cfg = roleConfig[role];
                            return (
                              <Badge
                                key={role}
                                variant="outline"
                                className={`cursor-pointer hover:opacity-70 transition-opacity gap-1 ${cfg.color}`}
                                onClick={() => {
                                  if (confirm(`Revoke "${role}" role from ${user.email}?`)) {
                                    revokeRole.mutate({ userId: user.user_id, role });
                                  }
                                }}
                                title={`Click to revoke ${role} role`}
                              >
                                <cfg.icon className="h-3 w-3" />
                                {cfg.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.groups.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">No groups</span>
                          ) : (
                            user.groups.map((g) => (
                              <Badge key={g.id} variant="secondary" className="gap-1">
                                {g.name}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => toggleGroupMembership.mutate({ userId: user.user_id, groupId: g.id, isAdding: false })}
                                />
                              </Badge>
                            ))
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => openGroupDialog(user)}
                          >
                            + Assign
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(val) => {
                            if (user.roles.includes(val as AppRole)) {
                              toast.info("User already has this role");
                              return;
                            }
                            assignRole.mutate({ userId: user.user_id, role: val as AppRole });
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Assign role" />
                          </SelectTrigger>
                          <SelectContent>
                            {(["admin", "moderator", "user"] as AppRole[]).map((r) => (
                              <SelectItem key={r} value={r} disabled={user.roles.includes(r)}>
                                {roleConfig[r].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite New User
            </DialogTitle>
            <DialogDescription>
              Send an email invitation to onboard a new user with a pre-assigned role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Display Name</Label>
              <Input
                id="invite-name"
                placeholder="John Doe"
                value={inviteDisplayName}
                onChange={(e) => setInviteDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting} className="gap-2">
              {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Assignment Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Groups to {selectedUser?.display_name || selectedUser?.email}</DialogTitle>
            <DialogDescription>Select which groups this user belongs to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
            {allGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No groups created yet. Create groups first.</p>
            ) : (
              allGroups.map((group) => {
                const isMember = selectedUser?.groups.some((g) => g.id === group.id) ?? false;
                return (
                  <div key={group.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                    <Checkbox
                      checked={isMember}
                      onCheckedChange={(checked) => {
                        if (selectedUser) {
                          toggleGroupMembership.mutate({
                            userId: selectedUser.user_id,
                            groupId: group.id,
                            isAdding: !!checked,
                          });
                          // Optimistically update selectedUser
                          if (checked) {
                            setSelectedUser({
                              ...selectedUser,
                              groups: [...selectedUser.groups, { id: group.id, name: group.name }],
                            });
                          } else {
                            setSelectedUser({
                              ...selectedUser,
                              groups: selectedUser.groups.filter((g) => g.id !== group.id),
                            });
                          }
                        }
                      }}
                    />
                    <span className="text-sm">{group.name}</span>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
