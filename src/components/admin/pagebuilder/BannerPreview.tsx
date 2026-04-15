import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Monitor, Smartphone, Save, Phone, Image, Plus, Trash2,
  Edit, X, Eye, EyeOff, Pencil, GripVertical, FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import hvacHero from "@/assets/hvac-hero.jpg";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Company {
  id: string;
  name: string;
  company_phone: string | null;
  primary_color: string | null;
}

interface Banner {
  id: string;
  company_id: string;
  title: string;
  tagline: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean | null;
  animation_style: string;
  created_at: string;
  updated_at: string;
}

interface BannerFormData {
  title: string;
  tagline: string;
  description: string;
  image_url: string;
  is_active: boolean;
  animation_style: string;
}

const ANIMATION_STYLES = [
  { value: "fade", label: "Fade", description: "Smooth opacity transition" },
  { value: "slide-left", label: "Slide Left", description: "Slides in from right to left" },
  { value: "slide-right", label: "Slide Right", description: "Slides in from left to right" },
  { value: "slide-up", label: "Slide Up", description: "Slides in from bottom to top" },
  { value: "zoom-in", label: "Zoom In", description: "Scales up from center" },
  { value: "zoom-out", label: "Zoom Out", description: "Scales down into view" },
  { value: "flip", label: "Flip", description: "3D flip transition" },
  { value: "none", label: "None", description: "No animation" },
];

const emptyForm: BannerFormData = {
  title: "",
  tagline: "",
  description: "",
  image_url: "",
  is_active: true,
  animation_style: "fade",
};

// Sortable banner row component
function SortableBannerRow({
  banner,
  isSelected,
  onToggleSelect,
  previewBannerId,
  inlineEditId,
  inlineTitle,
  inlineTagline,
  inlineSaving,
  setInlineTitle,
  setInlineTagline,
  saveInlineEdit,
  cancelInlineEdit,
  startInlineEdit,
  setPreviewBanner,
  toggleActive,
  openEditForm,
  handleDelete,
}: {
  banner: Banner;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  previewBannerId: string | undefined;
  inlineEditId: string | null;
  inlineTitle: string;
  inlineTagline: string;
  inlineSaving: boolean;
  setInlineTitle: (v: string) => void;
  setInlineTagline: (v: string) => void;
  saveInlineEdit: () => void;
  cancelInlineEdit: () => void;
  startInlineEdit: (banner: Banner) => void;
  setPreviewBanner: (banner: Banner) => void;
  toggleActive: (banner: Banner) => void;
  openEditForm: (banner: Banner) => void;
  handleDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
        previewBannerId === banner.id ? "border-primary bg-primary/5" : ""
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggleSelect(banner.id)}
      />
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      {banner.image_url ? (
        <img src={banner.image_url} alt={banner.title} className="w-24 h-16 object-cover rounded" />
      ) : (
        <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
          <Image className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {inlineEditId === banner.id ? (
          <div className="flex flex-col gap-2">
            <Input
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              placeholder="Title"
              className="h-8 text-sm font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveInlineEdit();
                if (e.key === "Escape") cancelInlineEdit();
              }}
            />
            <Input
              value={inlineTagline}
              onChange={(e) => setInlineTagline(e.target.value)}
              placeholder="Tagline"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveInlineEdit();
                if (e.key === "Escape") cancelInlineEdit();
              }}
            />
            <div className="flex gap-1">
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={saveInlineEdit} disabled={inlineSaving}>
                {inlineSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelInlineEdit}>
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <p
                className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                onDoubleClick={() => startInlineEdit(banner)}
                title="Double-click to quick edit"
              >
                {banner.title || "Untitled"}
              </p>
              {!banner.is_active && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
              )}
            </div>
            <p
              className="text-sm text-muted-foreground truncate cursor-pointer hover:text-foreground transition-colors"
              onDoubleClick={() => startInlineEdit(banner)}
              title="Double-click to quick edit"
            >
              {banner.tagline}
            </p>
            <p className="text-xs text-muted-foreground">Order: {banner.display_order}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setPreviewBanner(banner)} title="Preview">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => toggleActive(banner)} title={banner.is_active ? "Deactivate" : "Activate"}>
          {banner.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
        </Button>
        {inlineEditId !== banner.id && (
          <Button variant="ghost" size="icon" onClick={() => startInlineEdit(banner)} title="Quick Edit">
            <Edit className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => openEditForm(banner)} title="Full Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const BannerPreview = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BannerFormData>(emptyForm);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineTagline, setInlineTagline] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auto-slide through active banners
  useEffect(() => {
    const activeBanners = banners.filter((b) => b.is_active);
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewBanner((current) => {
        const currentIdx = activeBanners.findIndex((b) => b.id === current?.id);
        const nextIdx = (currentIdx + 1) % activeBanners.length;
        return activeBanners[nextIdx];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    if (!companyId) return;
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    const [companyRes, bannersRes] = await Promise.all([
      supabase.from("companies").select("id, name, company_phone, primary_color").eq("id", companyId!).maybeSingle(),
      supabase.from("company_banners").select("*").eq("company_id", companyId!).order("display_order", { ascending: true }),
    ]);
    if (companyRes.error) toast.error("Failed to load company data");
    else if (companyRes.data) setCompany(companyRes.data);
    if (bannersRes.error) toast.error("Failed to load banners");
    else {
      setBanners(bannersRes.data || []);
      if (bannersRes.data && bannersRes.data.length > 0) {
        setPreviewBanner(bannersRes.data.find((b) => b.is_active) || bannersRes.data[0]);
      }
    }
    setLoading(false);
  };

  const handleInputChange = (field: keyof BannerFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openAddForm = () => { setEditingId(null); setFormData(emptyForm); setShowForm(true); };
  const openEditForm = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({ title: banner.title, tagline: banner.tagline, description: banner.description, image_url: banner.image_url, is_active: banner.is_active ?? true, animation_style: banner.animation_style || "fade" });
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm); };

  const handleSave = async () => {
    if (!companyId) return;
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("company_banners").update({ title: formData.title.trim(), tagline: formData.tagline.trim(), description: formData.description.trim(), image_url: formData.image_url.trim(), is_active: formData.is_active, animation_style: formData.animation_style }).eq("id", editingId);
      if (error) toast.error("Failed to update banner");
      else { toast.success("Banner updated"); cancelForm(); fetchData(); }
    } else {
      const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.display_order)) + 1 : 0;
      const { error } = await supabase.from("company_banners").insert({ company_id: companyId, title: formData.title.trim(), tagline: formData.tagline.trim(), description: formData.description.trim(), image_url: formData.image_url.trim(), display_order: nextOrder, is_active: formData.is_active, animation_style: formData.animation_style });
      if (error) toast.error("Failed to add banner");
      else { toast.success("Banner added"); cancelForm(); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("company_banners").delete().eq("id", id);
    if (error) toast.error("Failed to delete banner");
    else { toast.success("Banner deleted"); fetchData(); }
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase.from("company_banners").update({ is_active: !banner.is_active }).eq("id", banner.id);
    if (error) toast.error("Failed to update banner");
    else fetchData();
  };

  const startInlineEdit = (banner: Banner) => { setInlineEditId(banner.id); setInlineTitle(banner.title); setInlineTagline(banner.tagline); };
  const cancelInlineEdit = () => { setInlineEditId(null); setInlineTitle(""); setInlineTagline(""); };
  const saveInlineEdit = async () => {
    if (!inlineEditId) return;
    if (!inlineTitle.trim()) { toast.error("Title is required"); return; }
    setInlineSaving(true);
    const { error } = await supabase.from("company_banners").update({ title: inlineTitle.trim(), tagline: inlineTagline.trim() }).eq("id", inlineEditId);
    if (error) toast.error("Failed to update banner");
    else { toast.success("Banner updated"); cancelInlineEdit(); fetchData(); }
    setInlineSaving(false);
  };

  // Drag and drop handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);

    // Optimistic update
    setBanners(reordered);

    // Persist new display_order values
    const updates = reordered.map((b, i) =>
      supabase.from("company_banners").update({ display_order: i }).eq("id", b.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast.error("Failed to save new order");
      fetchData();
    } else {
      toast.success("Order updated");
      fetchData();
    }
  };

  // Bulk selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === banners.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(banners.map((b) => b.id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} banner(s)?`)) return;
    setBulkActing(true);
    const { error } = await supabase.from("company_banners").delete().in("id", Array.from(selectedIds));
    if (error) toast.error("Failed to delete banners");
    else { toast.success(`${selectedIds.size} banner(s) deleted`); setSelectedIds(new Set()); fetchData(); }
    setBulkActing(false);
  };

  const bulkToggleActive = async (activate: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkActing(true);
    const { error } = await supabase.from("company_banners").update({ is_active: activate }).in("id", Array.from(selectedIds));
    if (error) toast.error("Failed to update banners");
    else { toast.success(`${selectedIds.size} banner(s) ${activate ? "activated" : "deactivated"}`); setSelectedIds(new Set()); fetchData(); }
    setBulkActing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  const primaryColor = company.primary_color || "#1e40af";
  const activeBanner = previewBanner;
  const heroImage = activeBanner?.image_url || hvacHero;
  const displayTitle = activeBanner?.title || `${company.name} - Your Trusted HVAC Partner`;
  const displayTagline = activeBanner?.tagline || "24/7 Emergency Service Available";
  const displayDescription = activeBanner?.description || "Professional heating, ventilation, and air conditioning services.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banner Management</h2>
          <p className="text-muted-foreground">
            Manage hero banners for {company.name} ({banners.length} banner{banners.length !== 1 ? "s" : ""})
          </p>
        </div>
        <Button onClick={openAddForm} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {/* Preview with Desktop/Mobile toggle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {previewMode === "desktop" ? <Monitor className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
              {previewMode === "desktop" ? "Desktop" : "Mobile"} Preview
            </CardTitle>
            <div className="flex items-center border rounded-lg p-1">
              <Button variant={previewMode === "desktop" ? "default" : "ghost"} size="sm" className="h-8 px-3" onClick={() => setPreviewMode("desktop")}>
                <Monitor className="h-4 w-4 mr-1" /> Desktop
              </Button>
              <Button variant={previewMode === "mobile" ? "default" : "ghost"} size="sm" className="h-8 px-3" onClick={() => setPreviewMode("mobile")}>
                <Smartphone className="h-4 w-4 mr-1" /> Mobile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {previewMode === "desktop" ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="relative h-80 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-8">
                  <h1 className="text-4xl font-bold mb-2">{displayTitle}</h1>
                  <p className="text-xl font-medium mb-4" style={{ color: primaryColor }}>{displayTagline}</p>
                  <p className="text-lg max-w-2xl mb-6 opacity-90">{displayDescription}</p>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: primaryColor }}>Schedule Service</button>
                    {company.company_phone && (
                      <button className="px-6 py-3 rounded-lg font-semibold bg-white text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {company.company_phone}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-sm mx-auto border rounded-lg overflow-hidden">
              <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4">
                  <h1 className="text-xl font-bold mb-1">{displayTitle}</h1>
                  <p className="text-sm font-medium mb-2" style={{ color: primaryColor }}>{displayTagline}</p>
                  <p className="text-sm mb-4 opacity-90 line-clamp-2">{displayDescription}</p>
                  <div className="flex flex-col gap-2 w-full px-4">
                    <button className="w-full px-4 py-2 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: primaryColor }}>Schedule Service</button>
                    {company.company_phone && (
                      <button className="w-full px-4 py-2 rounded-lg font-semibold bg-white text-gray-900 flex items-center justify-center gap-2 text-sm">
                        <Phone className="h-3 w-3" /> Call Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {banners.filter((b) => b.is_active).length > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              {banners.filter((b) => b.is_active).map((b) => (
                <button
                  key={b.id}
                  onClick={() => setPreviewBanner(b)}
                  className={`w-3 h-3 rounded-full transition-colors ${previewBanner?.id === b.id ? "bg-primary" : "bg-muted-foreground/30"}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingId ? "Edit Banner" : "Add New Banner"}</span>
              <Button variant="ghost" size="icon" onClick={cancelForm}><X className="h-4 w-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="banner-title">Title *</Label>
                <Input id="banner-title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} placeholder="Banner title" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="banner-tagline">Tagline</Label>
                <Input id="banner-tagline" value={formData.tagline} onChange={(e) => handleInputChange("tagline", e.target.value)} placeholder="Tagline text" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="banner-description">Description</Label>
                <Textarea id="banner-description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Description text" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="flex gap-2 items-center">
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Banner preview" className="w-16 h-10 object-cover rounded border" />
                  )}
                  <FileManagerPicker
                    onSelect={(url) => handleInputChange("image_url", url)}
                    accept="image/*"
                    buttonLabel={formData.image_url ? "Change Image" : "Select Image"}
                    buttonIcon={<FolderOpen className="h-4 w-4" />}
                  />
                  {formData.image_url && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleInputChange("image_url", "")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 flex items-end gap-3 pb-1">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(val) => handleInputChange("is_active", val)} />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Animation Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ANIMATION_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => handleInputChange("animation_style", style.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.animation_style === style.value
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-medium text-sm">{style.label}</p>
                      <p className="text-xs text-muted-foreground">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> {editingId ? "Update Banner" : "Add Banner"}</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banners List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Banners ({banners.length})</CardTitle>
          </div>
          {/* Bulk actions bar */}
          {banners.length > 0 && (
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={banners.length > 0 && selectedIds.size === banners.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                </span>
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => bulkToggleActive(true)} disabled={bulkActing}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Activate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => bulkToggleActive(false)} disabled={bulkActing}>
                    <EyeOff className="h-3.5 w-3.5 mr-1" /> Deactivate
                  </Button>
                  <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkActing}>
                    {bulkActing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No banners yet. Click "Add Banner" to create one.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <SortableBannerRow
                      key={banner.id}
                      banner={banner}
                      isSelected={selectedIds.has(banner.id)}
                      onToggleSelect={toggleSelect}
                      previewBannerId={previewBanner?.id}
                      inlineEditId={inlineEditId}
                      inlineTitle={inlineTitle}
                      inlineTagline={inlineTagline}
                      inlineSaving={inlineSaving}
                      setInlineTitle={setInlineTitle}
                      setInlineTagline={setInlineTagline}
                      saveInlineEdit={saveInlineEdit}
                      cancelInlineEdit={cancelInlineEdit}
                      startInlineEdit={startInlineEdit}
                      setPreviewBanner={setPreviewBanner}
                      toggleActive={toggleActive}
                      openEditForm={openEditForm}
                      handleDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerPreview;
