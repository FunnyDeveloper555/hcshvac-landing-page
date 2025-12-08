import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HeroImagesList = () => {
  const { toast } = useToast();
  
  const { data: images, isLoading, refetch } = useQuery({
    queryKey: ["hero-images-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_images")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, imageUrl: string) => {
    // Delete from storage
    const fileName = imageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("hero-images").remove([fileName]);
    }

    // Delete from database
    const { error } = await supabase
      .from("hero_images")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      refetch();
    }
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
        <h2 className="text-3xl font-bold">Hero Images List</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images?.map((image) => (
          <Card key={image.id}>
            <CardContent className="p-4">
              <img 
                src={image.image_url} 
                alt={`Hero ${image.display_order}`}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Order: {image.display_order}
                </span>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(image.id, image.image_url)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {images?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              No hero images found. Add your first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HeroImagesList;
