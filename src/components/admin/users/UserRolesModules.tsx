import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Shield, Loader2, Layout, Eye, Pencil } from "lucide-react";

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
  admin: { label: "Admin", icon: ShieldAlert, color: "bg-destructive text-destructive-foreground", description: "Full system access" },
  moderator: { label: "Moderator", icon: ShieldCheck, color: "bg-primary text-primary-foreground", description: "Content management access" },
  user: { label: "User", icon: Shield, color: "bg-muted text-muted-foreground", description: "Basic access" },
};

export default function UserRolesModules() {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");

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
        // If turning off can_view, also turn off can_edit
        const updates: Record<string, boolean> = { [field]: !currentValue };
        if (field === "can_view" && currentValue) {
          updates.can_edit = false;
        }
        // If turning on can_edit, also ensure can_view is on
        if (field === "can_edit" && !currentValue) {
          updates.can_view = true;
        }

        const { error } = await supabase
          .from("role_module_assignments")
          .update(updates)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create new assignment
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

  const getAssignment = (role: AppRole, moduleId: string) => {
    return assignments.find((a) => a.role === role && a.module_id === moduleId);
  };

  const isLoading = modulesLoading || assignmentsLoading;

  // Count assigned modules per role
  const getRoleModuleCount = (role: AppRole) => {
    return assignments.filter((a) => a.role === role && (a.can_view || a.can_edit)).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Layout className="h-6 w-6 text-primary" />
          Role & Module Permissions
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Assign admin console module access to each user role
        </p>
      </div>

      {/* Role Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["admin", "moderator", "user"] as AppRole[]).map((role) => {
          const cfg = roleConfig[role];
          const moduleCount = getRoleModuleCount(role);
          return (
            <Card
              key={role}
              className={`cursor-pointer transition-all ${selectedRole === role ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-lg ${cfg.color}`}>
                  <cfg.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                </div>
                <Badge variant="secondary">{moduleCount} modules</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Module Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={`p-1.5 rounded ${roleConfig[selectedRole].color}`}>
              {(() => {
                const Icon = roleConfig[selectedRole].icon;
                return <Icon className="h-4 w-4" />;
              })()}
            </span>
            {roleConfig[selectedRole].label} Role — Module Access
          </CardTitle>
          <CardDescription>
            Toggle view and edit permissions for each admin console module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : modules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No admin modules found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center w-[100px]">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </div>
                    </TableHead>
                    <TableHead className="text-center w-[100px]">
                      <div className="flex items-center justify-center gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
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
