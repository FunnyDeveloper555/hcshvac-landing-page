import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Loader2, FileDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminLog } from "@/hooks/useAdminLog";

export default function PopupsList() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["company-popups", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_popups")
        .select("*")
        .eq("company_id", companyId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("company_popups")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-popups", companyId] });
      logAction("update", "company_popup", variables.id, {
        action: variables.is_active ? "activated" : "deactivated",
      });
      toast.success(`Popup ${variables.is_active ? "activated" : "deactivated"}`);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_popups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["company-popups", companyId] });
      logAction("delete", "company_popup", id, { action: "deleted" });
      toast.success("Popup deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete popup"),
  });

  if (!companyId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No company selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Popups</h2>
          <p className="text-muted-foreground">
            Manage popup alerts for {company?.name || "..."}
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/page-builder/company/${companyId}/popups/add`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Popup
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popup Alerts</CardTitle>
          <CardDescription>
            These popups display on the company landing page for promotions or announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No popups yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/admin/page-builder/company/${companyId}/popups/add`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Popup
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Publish Range</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.display_order}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.popup_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {item.content_type || "text"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[150px] truncate">{item.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.publish_start_date || item.publish_end_date ? (
                        <div>
                          {item.publish_start_date && <div>From: {format(new Date(item.publish_start_date), "MMM d, yyyy")}</div>}
                          {item.publish_end_date && <div>To: {format(new Date(item.publish_end_date), "MMM d, yyyy")}</div>}
                        </div>
                      ) : (
                        <span>Always</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" title="Attached file">
                            <FileDown className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        {item.redirect_url && (
                          <a href={item.redirect_url} target="_blank" rel="noopener noreferrer" title={`Opens in ${item.destination_window || 'self'} window`}>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )}
                        {!item.file_url && !item.redirect_url && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active ?? false}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: item.id, is_active: checked })
                          }
                        />
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/page-builder/company/${companyId}/popups/edit?id=${item.id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Popup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this popup. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
