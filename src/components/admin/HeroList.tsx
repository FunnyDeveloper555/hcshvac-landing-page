import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";

const HeroList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();
  
  const { data: heroContent, isLoading, refetch } = useQuery({
    queryKey: ["hero-content-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, title: string) => {
    const { error } = await supabase
      .from("hero_content")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete hero content",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Hero content deleted successfully",
      });
      logAction("delete", "hero", id, { title });
      refetch();
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/hero/add?id=${id}`);
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
        <h2 className="text-3xl font-bold">Hero Content List</h2>
      </div>

      <div className="grid gap-4">
        {heroContent?.map((content) => (
          <Card key={content.id}>
            <CardHeader>
              <CardTitle>{content.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{content.subtitle}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(content.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(content.id, content.title)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {heroContent?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hero content found. Add your first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeroList;
