import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CompaniesList = () => {
  const { toast } = useToast();
  
  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, logoUrl: string | null) => {
    // Delete logo from storage if exists
    if (logoUrl) {
      const fileName = logoUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("company-logos").remove([fileName]);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      refetch();
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Companies List</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies?.map((company) => (
          <Card key={company.id}>
            <CardContent className="p-4">
              {company.logo_url && (
                <img 
                  src={company.logo_url} 
                  alt={company.name}
                  className="w-full h-32 object-contain mb-4 bg-muted rounded-md p-2"
                />
              )}
              <h3 className="font-semibold mb-2">{company.name}</h3>
              <Button 
                size="sm" 
                variant="destructive"
                className="w-full"
                onClick={() => handleDelete(company.id, company.logo_url)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {companies?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              No companies found. Add your first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompaniesList;
