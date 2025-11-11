import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroImagesAdd = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from("hero-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("hero-images")
        .getPublicUrl(filePath);

      const { data: images } = await supabase
        .from("hero_images")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1);

      const maxOrder = images && images.length > 0 ? images[0].display_order : -1;

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

      navigate("/admin/images/list");
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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Add Hero Image</h2>
      <Card>
        <CardHeader>
          <CardTitle>Upload Hero Image</CardTitle>
          <CardDescription>
            Add a new image to the hero section carousel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="image-upload">Select Image</Label>
            <div className="mt-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Maximum file size: 5MB. Accepted formats: JPG, PNG, GIF, WebP
            </p>
            {uploading && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroImagesAdd;
