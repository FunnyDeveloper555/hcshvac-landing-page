import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Loader2, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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

interface MarqueeItem {
  id: string;
  text: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function MarqueeList() {
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
    queryKey: ["company-marquees", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_marquees")
        .select("*")
        .eq("company_id", companyId)
        .order("display_order");
      if (error) throw error;
      return data as MarqueeItem[];
    },
    enabled: !!companyId,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("company_marquees")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["company-marquees", companyId] });
      logAction("update", "company_marquee", variables.id, {
        action: variables.is_active ? "activated" : "deactivated",
      });
      toast.success(`Marquee item ${variables.is_active ? "activated" : "deactivated"}`);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("company_marquees")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["company-marquees", companyId] });
      logAction("delete", "company_marquee", id, { action: "deleted" });
      toast.success("Marquee item deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete marquee item"),
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
          <h2 className="text-3xl font-bold tracking-tight">Marquee Items</h2>
          <p className="text-muted-foreground">
            Manage scrolling marquee text for {company?.name || "..."}
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/page-builder/company/${companyId}/marquee/add`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Marquee Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marquee Text Items</CardTitle>
          <CardDescription>
            These items scroll across the company landing page as a marquee banner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No marquee items yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/admin/page-builder/company/${companyId}/marquee/add`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Marquee Item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>{item.display_order}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {(item as any).marquee_type || "text"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{item.text}</TableCell>
                    <TableCell>
                      {item.link_url ? (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
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
                            navigate(`/admin/page-builder/company/${companyId}/marquee/edit?id=${item.id}`)
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
            <AlertDialogTitle>Delete Marquee Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this marquee item. This action cannot be undone.
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
