import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
}

const HeroImagesAdmin = () => {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching images",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("hero-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("hero-images")
        .getPublicUrl(filePath);

      // Get next display order
      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) 
        : -1;

      // Insert into database
      const { error: dbError } = await supabase
        .from("hero_images")
        .insert({
          image_url: publicUrl,
          alt_text: file.name.split(".")[0],
          display_order: maxOrder + 1,
          is_active: true,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      fetchImages();
      event.target.value = "";
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: HeroImage) => {
    try {
      // Extract file path from URL
      const urlParts = image.image_url.split("/hero-images/");
      const filePath = urlParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from("hero-images")
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("hero_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });

      fetchImages();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (imageId: string, direction: "up" | "down") => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    try {
      const currentImage = images[currentIndex];
      const targetImage = images[targetIndex];

      // Swap display orders
      const { error: error1 } = await supabase
        .from("hero_images")
        .update({ display_order: targetImage.display_order })
        .eq("id", currentImage.id);

      const { error: error2 } = await supabase
        .from("hero_images")
        .update({ display_order: currentImage.display_order })
        .eq("id", targetImage.id);

      if (error1 || error2) throw error1 || error2;

      fetchImages();
    } catch (error: any) {
      toast({
        title: "Reorder failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (image: HeroImage) => {
    try {
      const { error } = await supabase
        .from("hero_images")
        .update({ is_active: !image.is_active })
        .eq("id", image.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Image ${!image.is_active ? "activated" : "deactivated"}`,
      });

      fetchImages();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Images</CardTitle>
        <CardDescription>
          Manage carousel images for the hero section
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="image-upload">Upload New Image</Label>
          <div className="mt-2">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
          {uploading && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </p>
          )}
        </div>

        <div className="space-y-4">
          {images.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No images yet. Upload your first hero image above.
            </p>
          ) : (
            images.map((image, index) => (
              <div
                key={image.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{image.alt_text}</p>
                  <p className="text-sm text-muted-foreground">
                    Order: {image.display_order + 1}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleReorder(image.id, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleReorder(image.id, "down")}
                    disabled={index === images.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={image.is_active ? "outline" : "secondary"}
                    onClick={() => toggleActive(image)}
                  >
                    {image.is_active ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroImagesAdmin;