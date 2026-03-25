import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Image, Video, ArrowLeft } from "lucide-react";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GalleryItem {
  id?: string;
  item_type: string;
  file_url: string;
  thumbnail_url: string;
  title: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
}

const GalleryAdd = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { user } = useAuth();
  const { logAction } = useAdminLog();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ index: number; field: "file_url" | "thumbnail_url" } | null>(null);

  useEffect(() => {
    if (editId) fetchGallery();
  }, [editId]);

  const fetchGallery = async () => {
    const { data, error } = await supabase.from("galleries").select("*").eq("id", editId!).single();
    if (error || !data) { toast.error("Gallery not found"); return; }
    setName(data.name);
    setDescription(data.description || "");
    setTags((data.tags as string[]).join(", "));
    setActivityDate(data.activity_date || "");
    setIsActive(data.is_active);

    const { data: itemsData } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("gallery_id", editId!)
      .order("display_order");
    if (itemsData) setItems(itemsData.map(i => ({
      id: i.id, item_type: i.item_type, file_url: i.file_url,
      thumbnail_url: i.thumbnail_url || "", title: i.title || "",
      alt_text: i.alt_text || "", display_order: i.display_order,
      is_active: i.is_active,
    })));
  };

  const addItemFromFile = (url: string) => {
    const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
    const filename = url.split("/").pop()?.split("?")[0] || "";
    const title = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    setItems(prev => [...prev, {
      item_type: isVideo ? "video" : "image",
      file_url: url,
      thumbnail_url: "",
      title,
      alt_text: title,
      display_order: prev.length,
      is_active: true,
    }]);
  };

  const updateItem = (index: number, field: keyof GalleryItem, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, display_order: i })));
  };

  const openPicker = (index: number, field: "file_url" | "thumbnail_url") => {
    setPickerTarget({ index, field });
    setPickerOpen(true);
  };

  const handlePickerSelect = (url: string) => {
    if (pickerTarget) {
      updateItem(pickerTarget.index, pickerTarget.field, url);
    }
    setPickerOpen(false);
    setPickerTarget(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Gallery name is required"); return; }
    setSaving(true);
    try {
      const tagsArray = tags.split(",").map(t => t.trim()).filter(Boolean);
      const galleryData = {
        name: name.trim(),
        description: description.trim(),
        tags: tagsArray,
        activity_date: activityDate || null,
        is_active: isActive,
        author_id: user!.id,
      };

      let galleryId = editId;

      if (editId) {
        const { error } = await supabase.from("galleries").update(galleryData).eq("id", editId);
        if (error) throw error;
        // Delete existing items and re-insert
        await supabase.from("gallery_items").delete().eq("gallery_id", editId);
      } else {
        const { data, error } = await supabase.from("galleries").insert(galleryData).select("id").single();
        if (error) throw error;
        galleryId = data.id;
      }

      if (items.length > 0) {
        const itemsToInsert = items.map((item, idx) => ({
          gallery_id: galleryId!,
          item_type: item.item_type,
          file_url: item.file_url,
          thumbnail_url: item.thumbnail_url || null,
          title: item.title,
          alt_text: item.alt_text,
          display_order: idx,
          is_active: item.is_active,
        }));
        const { error } = await supabase.from("gallery_items").insert(itemsToInsert);
        if (error) throw error;
      }

      await logAction(editId ? "update" : "create", "gallery", galleryId!, { name });
      toast.success(`Gallery ${editId ? "updated" : "created"} successfully`);
      navigate("/admin/galleries/list");
    } catch (err: any) {
      toast.error(err.message || "Failed to save gallery");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/galleries/list")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold">{editId ? "Edit" : "Add"} Gallery</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="basic">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="content">Gallery Content ({items.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gallery Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter gallery name" />
                </div>
                <div className="space-y-2">
                  <Label>Activity Date</Label>
                  <Input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Gallery description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. events, photos, 2024" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Add images and videos to this gallery</p>
                <Button onClick={addItem} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No items yet. Click "Add Item" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 pt-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">#{index + 1}</span>
                          </div>
                          <div className="flex-1 grid gap-3">
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select value={item.item_type} onValueChange={v => updateItem(index, "item_type", v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="image"><span className="flex items-center gap-1"><Image className="h-3 w-3" /> Image</span></SelectItem>
                                    <SelectItem value="video"><span className="flex items-center gap-1"><Video className="h-3 w-3" /> Video</span></SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Title</Label>
                                <Input value={item.title} onChange={e => updateItem(index, "title", e.target.value)} placeholder="Item title" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Alt Text</Label>
                                <Input value={item.alt_text} onChange={e => updateItem(index, "alt_text", e.target.value)} placeholder="Alt text" />
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">File URL *</Label>
                                <div className="flex gap-2">
                                  <Input value={item.file_url} onChange={e => updateItem(index, "file_url", e.target.value)} placeholder="File URL" className="flex-1" />
                                  <Button type="button" variant="outline" size="sm" onClick={() => openPicker(index, "file_url")}>Browse</Button>
                                </div>
                                {item.file_url && item.item_type === "image" && (
                                  <img src={item.file_url} alt="" className="h-16 w-16 object-cover rounded mt-1" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Thumbnail URL</Label>
                                <div className="flex gap-2">
                                  <Input value={item.thumbnail_url} onChange={e => updateItem(index, "thumbnail_url", e.target.value)} placeholder="Thumbnail URL" className="flex-1" />
                                  <Button type="button" variant="outline" size="sm" onClick={() => openPicker(index, "thumbnail_url")}>Browse</Button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={item.is_active} onCheckedChange={v => updateItem(index, "is_active", v)} />
                              <Label className="text-xs">Active</Label>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/admin/galleries/list")}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update Gallery" : "Create Gallery"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FileManagerPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePickerSelect}
        accept="image/*,video/*"
      />
    </div>
  );
};

export default GalleryAdd;
