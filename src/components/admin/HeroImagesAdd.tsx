import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";

const HeroImagesAdd = () => {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { logAction } = useAdminLog();

  const [formData, setFormData] = useState({
    alt_text: "",
    display_order: 0,
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    if (editId) {
      fetchImage();
    }
  }, [editId]);

  const fetchImage = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_images")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load image",
        variant: "destructive",
      });
      navigate("/admin/images/list");
    } else if (data) {
      setFormData({
        alt_text: data.alt_text,
        display_order: data.display_order,
        is_active: data.is_active ?? true,
        image_url: data.image_url,
      });
    }
    setLoading(false);
  };

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

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl,
        alt_text: prev.alt_text || file.name.split(".")[0],
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
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

  const handleSave = async () => {
    if (!formData.image_url) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("hero_images")
          .update({
            alt_text: formData.alt_text,
            display_order: formData.display_order,
            is_active: formData.is_active,
          })
          .eq("id", editId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Image updated successfully",
        });
        logAction("update", "hero_image", editId, { alt_text: formData.alt_text });
      } else {
        const { data: images } = await supabase
          .from("hero_images")
          .select("display_order")
          .order("display_order", { ascending: false })
          .limit(1);

        const maxOrder = images && images.length > 0 ? images[0].display_order : -1;

        const { data, error } = await supabase
          .from("hero_images")
          .insert({
            image_url: formData.image_url,
            alt_text: formData.alt_text,
            display_order: formData.display_order || maxOrder + 1,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Image added successfully",
        });
        logAction("create", "hero_image", data.id, { alt_text: formData.alt_text });
      }

      navigate("/admin/images/list");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Hero Image" : "Add Hero Image"}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Update Hero Image" : "Upload Hero Image"}</CardTitle>
          <CardDescription>
            {isEditing ? "Modify the hero image details" : "Add a new image to the hero section carousel"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.image_url && (
            <div>
              <Label>Current Image</Label>
              <img 
                src={formData.image_url} 
                alt={formData.alt_text}
                className="w-full max-w-md h-48 object-cover rounded-md mt-2"
              />
            </div>
          )}

          {!isEditing && (
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
            </div>
          )}

          <div>
            <Label htmlFor="alt_text">Alt Text</Label>
            <Input
              id="alt_text"
              value={formData.alt_text}
              onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
              placeholder="Describe the image"
            />
          </div>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={uploading || (!isEditing && !formData.image_url)}>
              {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEditing ? "Update Image" : "Add Image"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/images/list")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroImagesAdd;
