import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ExternalLink, GripVertical, Loader2 } from "lucide-react";
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

interface PartnerListing {
  id: string;
  business_name: string;
  business_phone: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function PartnerListingsList() {
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

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partner-listings", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("partner_listings")
        .select("*")
        .eq("company_id", companyId)
        .order("display_order");
      if (error) throw error;
      return data as PartnerListing[];
    },
    enabled: !!companyId,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("partner_listings")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", companyId] });
      logAction("update", "partner_listing", variables.id, { 
        action: variables.is_active ? "activated" : "deactivated" 
      });
      toast.success(`Partner ${variables.is_active ? "activated" : "deactivated"}`);
    },
    onError: () => {
      toast.error("Failed to update partner status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("partner_listings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", companyId] });
      logAction("delete", "partner_listing", id, { action: "deleted" });
      toast.success("Partner deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete partner");
    },
  });

  const handleEdit = (id: string) => {
    navigate(`/admin/page-builder/company/${companyId}/partner-listings/edit?id=${id}`);
  };

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
          <h2 className="text-3xl font-bold tracking-tight">Partner Listings</h2>
          <p className="text-muted-foreground">
            Manage partner companies for {company?.name || "..."}
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/page-builder/company/${companyId}/partner-listings/add`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Companies</CardTitle>
          <CardDescription>
            These partners will appear as expandable micro-websites on the company landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No partner listings yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(`/admin/page-builder/company/${companyId}/partner-listings/add`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Partner
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.business_name}
                          className="h-10 w-10 object-contain rounded"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          No Logo
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{partner.business_name}</TableCell>
                    <TableCell>{partner.business_phone || "-"}</TableCell>
                    <TableCell>
                      {partner.website_url ? (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={partner.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: partner.id, is_active: checked })
                          }
                        />
                        <Badge variant={partner.is_active ? "default" : "secondary"}>
                          {partner.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(partner.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(partner.id)}
                        >
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
            <AlertDialogTitle>Delete Partner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this partner listing. This action cannot be undone.
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
