import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, ArrowLeft, Library, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CTAIconsAdd() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [formData, setFormData] = useState({
    alt_text: "",
    custom_name: "",
    is_active: true,
    is_usable: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "library">("file");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibraryIcon, setSelectedLibraryIcon] = useState<string | null>(null);

  // Fetch existing icon if editing
  const { data: existingIcon } = useQuery({
    queryKey: ["cta-icon", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from("cta_icons")
        .select("*")
        .eq("id", editId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  // Fetch library icons for this company
  const { data: libraryIcons = [] } = useQuery({
    queryKey: ["cta-icons-library", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cta_icons")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (existingIcon) {
      setFormData({
        alt_text: existingIcon.alt_text || "",
        custom_name: existingIcon.custom_name || "",
        is_active: existingIcon.is_active ?? true,
        is_usable: existingIcon.is_usable ?? true,
      });
      setImagePreview(existingIcon.image_url);
    }
  }, [existingIcon]);

  const generateUniqueId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `PNG-CTA-Icon-${timestamp}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setSelectedLibraryIcon(null);
  };

  const handleLibrarySelect = (iconUrl: string) => {
    setSelectedLibraryIcon(iconUrl);
    setImagePreview(iconUrl);
    setImageFile(null);
    setLibraryOpen(false);
    toast.success("Icon selected from library");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Company ID required");
      
      let imageUrl = selectedLibraryIcon || existingIcon?.image_url;

      // Upload new file if selected
      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${companyId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("cta-icons")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("cta-icons")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        setUploading(false);
      }

      if (!imageUrl) throw new Error("Please select or upload an image");

      const iconData = {
        company_id: companyId,
        image_url: imageUrl,
        alt_text: formData.alt_text,
        custom_name: formData.custom_name,
        is_active: formData.is_active,
        is_usable: formData.is_usable,
        unique_id_number: editId ? existingIcon?.unique_id_number : generateUniqueId(),
      };

      if (editId) {
        const { error } = await supabase
          .from("cta_icons")
          .update(iconData)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cta_icons")
          .insert(iconData);
        if (error) throw error;
      }

      await logAction(
        editId ? "update" : "create",
        "cta_icon",
        editId || undefined,
        { custom_name: formData.custom_name }
      );

      return imageUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cta-icons", companyId] });
      queryClient.invalidateQueries({ queryKey: ["cta-icons-library", companyId] });
      toast.success(editId ? "CTA Icon updated!" : "CTA Icon created!");
      navigate(`/admin/page-builder/company/${companyId}/cta-icons/library`);
    },
    onError: (error: Error) => {
      setUploading(false);
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/cta-icons/library`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {editId ? "Edit CTA Icon" : "Add CTA Icon"}
          </h1>
          <p className="text-muted-foreground">
            Upload or select an icon from the library
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload/Select */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Icon Image</CardTitle>
            <CardDescription>Upload a .png file or select from library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={uploadMode === "file" ? "default" : "outline"}
                onClick={() => setUploadMode("file")}
                className="flex-1"
              >
                <FileUp className="h-4 w-4 mr-2" />
                From File
              </Button>
              <Button
                variant={uploadMode === "library" ? "default" : "outline"}
                onClick={() => {
                  setUploadMode("library");
                  setLibraryOpen(true);
                }}
                className="flex-1"
              >
                <Library className="h-4 w-4 mr-2" />
                From Library
              </Button>
            </div>

            {uploadMode === "file" && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="icon-upload"
                />
                <label htmlFor="icon-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP (max 5MB)
                  </p>
                </label>
              </div>
            )}

            {imagePreview && (
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Form Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Details</CardTitle>
            <CardDescription>Configure icon metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alt_text">Image Alt Text</Label>
              <Input
                id="alt_text"
                placeholder="e.g., Emergency After Hours HVAC Service Call"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_name">Custom Name Content</Label>
              <Input
                id="custom_name"
                placeholder="e.g., Blue Phone Icon"
                value={formData.custom_name}
                onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Unique ID Number</Label>
              <Input
                value={editId ? existingIcon?.unique_id_number || "" : "Auto-generated on save"}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_usable">Usable</Label>
              <Switch
                id="is_usable"
                checked={formData.is_usable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_usable: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || uploading || (!imageFile && !selectedLibraryIcon && !existingIcon?.image_url)}
              className="w-full"
            >
              {saveMutation.isPending || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                editId ? "Update Icon" : "Save Icon"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Library Selection Dialog */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select from Library</DialogTitle>
          </DialogHeader>
          {libraryIcons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No icons in library yet. Upload your first icon!
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {libraryIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => handleLibrarySelect(icon.image_url)}
                  className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                >
                  <img
                    src={icon.image_url}
                    alt={icon.alt_text}
                    className="w-full h-16 object-contain mb-2"
                  />
                  <p className="text-xs text-center truncate">{icon.custom_name || icon.unique_id_number}</p>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
