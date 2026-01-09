import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, title: string) => {
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
      logAction("delete", "service_term", id, { title });
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

      <div className="grid gap-4">
        {terms?.map((term) => (
          <Card key={term.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{term.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={term.is_active ? "default" : "secondary"}>
                    {term.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">Order: {term.display_order}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {term.content}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(term.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(term.id, term.title)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {terms?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No service terms found. Add your first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ServiceTermsList;
