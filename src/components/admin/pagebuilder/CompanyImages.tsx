import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2, Pencil, Image as ImageIcon, X, Search, Eye } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CompanyImage {
  id: string;
  company_id: string;
  image_url: string;
  alt_text: string;
  image_type: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const IMAGE_TYPES = [
  { value: "logo", label: "Logo" },
  { value: "hero", label: "Hero Image" },
  { value: "banner", label: "Banner" },
  { value: "gallery", label: "Gallery" },
  { value: "service", label: "Service Image" },
  { value: "team", label: "Team Photo" },
  { value: "general", label: "General" },
];

export default function CompanyImages() {
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<CompanyImage | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [previewImage, setPreviewImage] = useState<CompanyImage | null>(null);
  
  const [formData, setFormData] = useState({
    alt_text: "",
    image_type: "general",
    display_order: 0,
    is_active: true,
    image_url: "",
  });

  // Fetch company info
  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch company images
  const { data: images, isLoading } = useQuery({
    queryKey: ["company-images", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_images")
        .select("*")
        .eq("company_id", companyId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CompanyImage[];
    },
    enabled: !!companyId,
  });

  // Filter images based on search and type filter
  const filteredImages = images?.filter((image) => {
    const matchesSearch = searchQuery === "" || 
      image.alt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.image_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || image.image_type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (image: CompanyImage) => {
      // Delete from storage
      const fileName = image.image_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("company-images").remove([`${companyId}/${fileName}`]);
      }
      // Delete from database
      const { error } = await supabase
        .from("company_images")
        .delete()
        .eq("id", image.id);
      if (error) throw error;
      return image;
    },
    onSuccess: (image) => {
      queryClient.invalidateQueries({ queryKey: ["company-images", companyId] });
      toast({ title: "Success", description: "Image deleted successfully" });
      logAction("delete", "company_image", image.id, { alt_text: image.alt_text });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyId) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5242880) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-images")
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl,
        alt_text: prev.alt_text || file.name.split(".")[0],
      }));

      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.image_url || !companyId) {
      toast({ title: "Error", description: "Please upload an image first", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      if (editingImage) {
        const { error } = await supabase
          .from("company_images")
          .update({
            image_url: formData.image_url,
            alt_text: formData.alt_text,
            image_type: formData.image_type,
            display_order: formData.display_order,
            is_active: formData.is_active,
          })
          .eq("id", editingImage.id);

        if (error) throw error;

        toast({ title: "Success", description: "Image updated successfully" });
        logAction("update", "company_image", editingImage.id, { alt_text: formData.alt_text });
      } else {
        // Get next display order
        const maxOrder = images && images.length > 0 
          ? Math.max(...images.map(img => img.display_order)) 
          : -1;

        const { data, error } = await supabase
          .from("company_images")
          .insert({
            company_id: companyId,
            image_url: formData.image_url,
            alt_text: formData.alt_text,
            image_type: formData.image_type,
            display_order: formData.display_order || maxOrder + 1,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        toast({ title: "Success", description: "Image added successfully" });
        logAction("create", "company_image", data.id, { alt_text: formData.alt_text });
      }

      queryClient.invalidateQueries({ queryKey: ["company-images", companyId] });
      resetForm();
      setShowUploadDialog(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      alt_text: "",
      image_type: "general",
      display_order: 0,
      is_active: true,
      image_url: "",
    });
    setEditingImage(null);
  };

  const handleEdit = (image: CompanyImage) => {
    setEditingImage(image);
    setFormData({
      alt_text: image.alt_text,
      image_type: image.image_type,
      display_order: image.display_order,
      is_active: image.is_active,
      image_url: image.image_url,
    });
    setShowUploadDialog(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowUploadDialog(true);
  };

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Images</h2>
          <p className="text-muted-foreground">Please select a company to manage images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Images</h2>
          <p className="text-muted-foreground">
            Manage images for {company?.name || "this company"}
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Image
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by alt text or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {IMAGE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className={!image.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div 
                  className="aspect-video relative mb-3 bg-muted rounded-md overflow-hidden cursor-pointer group"
                  onClick={() => setPreviewImage(image)}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {!image.is_active && (
                    <div className="absolute top-2 right-2 bg-muted-foreground/80 text-white px-2 py-1 rounded text-xs">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate" title={image.alt_text}>
                    {image.alt_text || "No description"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded">
                      {image.image_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Order: {image.display_order}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(image)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(image)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : images && images.length > 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No images match your search</p>
            <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterType("all"); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No images found for this company</p>
            <Button onClick={handleAddNew}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Image
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload/Edit Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingImage ? "Edit Image" : "Upload Image"}</DialogTitle>
            <DialogDescription>
              {editingImage ? "Update the image details" : "Upload a new image for this company"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {formData.image_url && (
              <div className="relative">
                <img
                  src={formData.image_url}
                  alt={formData.alt_text}
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="image-upload">
                {formData.image_url ? "Replace Image" : "Select Image"}
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB. Accepts JPG, PNG, GIF, WebP
              </p>
            </div>

            <div>
              <Label htmlFor="alt_text">Alt Text / Description</Label>
              <Input
                id="alt_text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Describe the image"
              />
            </div>

            <div>
              <Label htmlFor="image_type">Image Type</Label>
              <Select
                value={formData.image_type}
                onValueChange={(value) => setFormData({ ...formData, image_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
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

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={uploading || !formData.image_url}
                className="flex-1"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingImage ? "Update Image" : "Add Image"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowUploadDialog(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewImage?.alt_text || "Image Preview"}</DialogTitle>
            <DialogDescription>
              Type: {previewImage?.image_type} | Order: {previewImage?.display_order}
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="flex flex-col gap-4">
              <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center max-h-[60vh]">
                <img
                  src={previewImage.image_url}
                  alt={previewImage.alt_text}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleEdit(previewImage)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteMutation.mutate(previewImage);
                    setPreviewImage(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
