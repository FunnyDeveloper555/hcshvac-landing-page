import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

export default function EmailListsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            All Email Lists ({lists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No email lists yet. Create your first one!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell>{(list.email_list_groups as any)?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={list.is_active ? "default" : "secondary"}>
                        {list.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(list.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
