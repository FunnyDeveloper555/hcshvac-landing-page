import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";

const ServiceTermsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();

  const { data: terms, isLoading, refetch } = useQuery({
    queryKey: ["service-terms-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_terms")
        .select(`
          *,
          companies:company_id (name)
        `)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, listingId: string) => {
    const { error } = await supabase.from("service_terms").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete service term",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Service term deleted successfully",
      });
      logAction("delete", "service_term", id, { listing_id: listingId });
      refetch();
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/services/terms/add?id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Service Terms</h2>
        <Button onClick={() => navigate("/admin/services/terms/add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Term
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing ID</TableHead>
                <TableHead>Primary Keyword</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Location Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms?.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.listing_id}</TableCell>
                  <TableCell>
                    <span className="text-primary font-medium">{term.primary_keyword}</span>
                  </TableCell>
                  <TableCell>{term.applies_to}</TableCell>
                  <TableCell>{term.companies?.name || "-"}</TableCell>
                  <TableCell>{term.service_type || "-"}</TableCell>
                  <TableCell>{term.location_type || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={term.is_active ? "default" : "secondary"}>
                      {term.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(term.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(term.id, term.listing_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {terms?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No service terms found. Add your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceTermsList;
