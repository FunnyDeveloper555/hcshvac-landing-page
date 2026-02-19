import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Shield, Loader2, Layout, Eye, Pencil, Users, Settings, ArrowLeft } from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

interface AdminModule {
  id: string;
  name: string;
  label: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number | null;
}

interface RoleModuleAssignment {
  id: string;
  role: AppRole;
  module_id: string;
  can_view: boolean;
  can_edit: boolean;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string; description: string }> = {
  admin: { label: "Admin", icon: ShieldAlert, color: "bg-destructive text-destructive-foreground", description: "Full system access with all permissions" },
  moderator: { label: "Moderator", icon: ShieldCheck, color: "bg-primary text-primary-foreground", description: "Content management and moderation access" },
  user: { label: "User", icon: Shield, color: "bg-muted text-muted-foreground", description: "Basic access to assigned modules only" },
};

type ViewMode = "list" | "edit";

export default function UserRolesModules() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  // Fetch all admin modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["admin-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_modules")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data || []) as AdminModule[];
    },
  });

  // Fetch all role_module_assignments
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["role-module-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_module_assignments")
        .select("*");
      if (error) throw error;
      return (data || []) as RoleModuleAssignment[];
    },
  });

  // Fetch user counts per role
  const { data: roleCounts = {} } = useQuery({
    queryKey: ["role-user-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((r) => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      return counts;
    },
  });

  // Toggle assignment
  const togglePermission = useMutation({
    mutationFn: async ({
      role,
      moduleId,
      field,
      currentValue,
    }: {
      role: AppRole;
      moduleId: string;
      field: "can_view" | "can_edit";
      currentValue: boolean;
    }) => {
      const existing = assignments.find(
        (a) => a.role === role && a.module_id === moduleId
      );

      if (existing) {
        const updates: Record<string, boolean> = { [field]: !currentValue };
        if (field === "can_view" && currentValue) {
          updates.can_edit = false;
        }
        if (field === "can_edit" && !currentValue) {
          updates.can_view = true;
        }

        const { error } = await supabase
          .from("role_module_assignments")
          .update(updates)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_module_assignments")
          .insert([{
            role: role as any,
            module_id: moduleId,
            can_view: field === "can_view" ? true : true,
            can_edit: field === "can_edit" ? true : false,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, { role, moduleId, field }) => {
      queryClient.invalidateQueries({ queryKey: ["role-module-assignments"] });
      logAction("update", "role_module_assignment", moduleId, {
        action: "permission_toggled",
        role,
        field,
      });
      toast.success("Permission updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Bulk toggle all modules for a role
  const bulkToggle = useMutation({
    mutationFn: async ({ role, field, enable }: { role: AppRole; field: "can_view" | "can_edit"; enable: boolean }) => {
      for (const mod of modules) {
        const existing = assignments.find(a => a.role === role && a.module_id === mod.id);
        if (existing) {
          const updates: Record<string, boolean> = { [field]: enable };
          if (field === "can_view" && !enable) updates.can_edit = false;
          if (field === "can_edit" && enable) updates.can_view = true;
          await supabase.from("role_module_assignments").update(updates).eq("id", existing.id);
        } else if (enable) {
          await supabase.from("role_module_assignments").insert([{
            role: role as any,
            module_id: mod.id,
            can_view: true,
            can_edit: field === "can_edit",
          }]);
        }
      }
    },
    onSuccess: (_, { role, field, enable }) => {
      queryClient.invalidateQueries({ queryKey: ["role-module-assignments"] });
      logAction("update", "role_module_assignment", undefined, {
        action: "bulk_permission_toggled",
        role,
        field,
        enabled: enable,
      });
      toast.success("Permissions updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getAssignment = (role: AppRole, moduleId: string) =>
    assignments.find((a) => a.role === role && a.module_id === moduleId);

  const getRoleModuleCount = (role: AppRole) =>
    assignments.filter((a) => a.role === role && (a.can_view || a.can_edit)).length;

  const getRoleEditCount = (role: AppRole) =>
    assignments.filter((a) => a.role === role && a.can_edit).length;

  const isLoading = modulesLoading || assignmentsLoading;

  const openRoleEdit = (role: AppRole) => {
    setSelectedRole(role);
    setViewMode("edit");
  };

  const backToList = () => {
    setViewMode("list");
    setSelectedRole(null);
  };

  // ---- LIST VIEW ----
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="h-6 w-6 text-primary" />
            User Roles & Module Permissions
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user roles and assign admin console module access
          </p>
        </div>

        {/* Role List */}
        <div className="grid grid-cols-1 gap-4">
          {(["admin", "moderator", "user"] as AppRole[]).map((role) => {
            const cfg = roleConfig[role];
            const viewCount = getRoleModuleCount(role);
            const editCount = getRoleEditCount(role);
            const userCount = roleCounts[role] || 0;

            return (
              <Card key={role} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Role icon & info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${cfg.color}`}>
                        <cfg.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{cfg.label}</h3>
                        <p className="text-sm text-muted-foreground">{cfg.description}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {userCount} users
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" />
                        {viewCount} view
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Pencil className="h-3 w-3" />
                        {editCount} edit
                      </Badge>
                    </div>

                    {/* Action */}
                    <Button variant="outline" className="gap-2" onClick={() => openRoleEdit(role)}>
                      <Settings className="h-4 w-4" />
                      Manage Permissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions Overview</CardTitle>
            <CardDescription>Quick view of module access across all roles</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {(["admin", "moderator", "user"] as AppRole[]).map((role) => (
                        <TableHead key={role} className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(() => { const Icon = roleConfig[role].icon; return <Icon className="h-3.5 w-3.5" />; })()}
                            {roleConfig[role].label}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => (
                      <TableRow key={mod.id}>
                        <TableCell className="font-medium">{mod.label}</TableCell>
                        {(["admin", "moderator", "user"] as AppRole[]).map((role) => {
                          const a = getAssignment(role, mod.id);
                          const canView = a?.can_view ?? false;
                          const canEdit = a?.can_edit ?? false;
                          return (
                            <TableCell key={role} className="text-center">
                              {canEdit ? (
                                <Badge className="bg-primary text-primary-foreground text-xs">View & Edit</Badge>
                              ) : canView ? (
                                <Badge variant="secondary" className="text-xs">View Only</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No Access</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- EDIT VIEW ----
  if (!selectedRole) return null;
  const cfg = roleConfig[selectedRole];
  const allViewChecked = modules.every(m => getAssignment(selectedRole, m.id)?.can_view);
  const allEditChecked = modules.every(m => getAssignment(selectedRole, m.id)?.can_edit);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={backToList} className="gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" />
          Back to Roles
        </Button>
      </div>

      {/* Role Detail Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${cfg.color}`}>
              <cfg.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{cfg.label} Role</h2>
              <p className="text-sm text-muted-foreground">{cfg.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {roleCounts[selectedRole] || 0} users
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {getRoleModuleCount(selectedRole)} / {modules.length} modules
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
          <CardDescription>
            Configure which admin console modules this role can access and edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No admin modules found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </div>
                        <Checkbox
                          checked={allViewChecked}
                          onCheckedChange={(checked) =>
                            bulkToggle.mutate({ role: selectedRole, field: "can_view", enable: !!checked })
                          }
                          className="mt-0.5"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </div>
                        <Checkbox
                          checked={allEditChecked}
                          onCheckedChange={(checked) =>
                            bulkToggle.mutate({ role: selectedRole, field: "can_edit", enable: !!checked })
                          }
                          className="mt-0.5"
                        />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((mod) => {
                    const assignment = getAssignment(selectedRole, mod.id);
                    const canView = assignment?.can_view ?? false;
                    const canEdit = assignment?.can_edit ?? false;
                    return (
                      <TableRow key={mod.id}>
                        <TableCell className="font-medium">{mod.label}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mod.description || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={canView}
                            onCheckedChange={() =>
                              togglePermission.mutate({
                                role: selectedRole,
                                moduleId: mod.id,
                                field: "can_view",
                                currentValue: canView,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={canEdit}
                            onCheckedChange={() =>
                              togglePermission.mutate({
                                role: selectedRole,
                                moduleId: mod.id,
                                field: "can_edit",
                                currentValue: canEdit,
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
