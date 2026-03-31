import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, ChevronsUpDown, Check, GripVertical } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useQuery } from "@tanstack/react-query";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { cn } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RelatedProductsTab from "@/components/admin/RelatedProductsTab";
import ProductVariantsTab from "@/components/admin/ProductVariantsTab";
import ProductReviewsTab from "@/components/admin/ProductReviewsTab";
import ProductDocumentsTab from "@/components/admin/ProductDocumentsTab";

const POISE_OPTIONS = ["Upflow", "Downflow"];
const AFUE_OPTIONS = ["80%", "92%", "95%", "96%", "97%", "98%"];
const WIDTH_OPTIONS = ['14.5"', '17.5"', '21"', '24.5"'];
const STAGES_OPTIONS = ["Single Stage", "Two Stage", "Two Stage Variable"];
const BRAND_OPTIONS = ["Ameristar", "Durastar", "Rheem"];

const MAIN_CATEGORIES = [
  "HVAC Equipment Residential",
  "HVAC Equipment Commercial",
];

const SUB_CATEGORIES = [
  "Ac Condenser Only",
  "Boiler (Hot Water)",
  "Boiler (Steam)",
  "Boiler (Tankless)",
  "Coil (Only)",
  "Furnace Only",
  "Furnace and Coil",
  "Furnace, Coil, and Condenser",
  "Furnace, Coil, Condenser, and Water Heater",
  "Water Heater",
  "Tankless Water Heater",
  "Mini Splitt",
];

interface SortableImageProps {
  id: string;
  url: string;
  index: number;
  onRemove: () => void;
}

const SortableImage = ({ id, url, index, onRemove }: SortableImageProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-background">
      <button type="button" className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <img src={url} alt={`Spot ${index + 1}`} className="w-16 h-16 object-cover rounded" />
      <span className="text-sm truncate flex-1">{url}</span>
      <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ProductsAdd = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { logAction } = useAdminLog();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false); // keep for TS — unused now

  const [companyId, setCompanyId] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [spotText, setSpotText] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [poise, setPoise] = useState("");
  const [afue, setAfue] = useState("");
  const [widthSize, setWidthSize] = useState("");
  const [stages, setStages] = useState("");
  const [weight, setWeight] = useState("");
  const [stickCount, setStickCount] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [spotImages, setSpotImages] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: companies = [] } = useQuery({
    queryKey: ["products-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["products-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (editId) fetchProduct();
  }, [editId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").eq("id", editId).single();
    if (error) {
      toast({ title: "Error", description: "Failed to load product", variant: "destructive" });
      navigate("/admin/products/list");
    } else if (data) {
      setCompanyId(data.company_id || "");
      // Parse "Main - Sub" format
      const cat = data.category || "";
      const dashIdx = cat.indexOf(" - ");
      if (dashIdx > -1) {
        setMainCategory(cat.substring(0, dashIdx));
        setSubCategory(cat.substring(dashIdx + 3));
      } else {
        setMainCategory(cat);
        setSubCategory("");
      }
      setProductName(data.product_name);
      setSpotText(data.spot_text || "");
      setBrandId(data.brand_id || "");
      setBrandName((data as any).brand_name || "");
      setPoise((data as any).poise || "");
      setAfue((data as any).afue || "");
      setWidthSize((data as any).width_size || "");
      setStages((data as any).stages || "");
      setWeight(data.weight != null ? String(data.weight) : "");
      setStickCount(data.stick_count != null ? String(data.stick_count) : "");
      setIsPublished(data.is_published ?? false);
      setSpotImages((data.spot_images as string[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { toast({ title: "Error", description: "Company is required", variant: "destructive" }); return; }
    if (!mainCategory) { toast({ title: "Error", description: "Main category is required", variant: "destructive" }); return; }
    if (!subCategory) { toast({ title: "Error", description: "Sub category is required", variant: "destructive" }); return; }
    if (!productName) { toast({ title: "Error", description: "Product name is required", variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        company_id: companyId || null,
        category: `${mainCategory} - ${subCategory}`,
        product_name: productName,
        spot_text: spotText || null,
        spot_images: spotImages,
        brand_id: brandId || null,
        brand_name: brandName || null,
        poise: poise || null,
        afue: afue || null,
        width_size: widthSize || null,
        stages: stages || null,
        weight: weight ? parseFloat(weight) : null,
        stick_count: stickCount ? parseInt(stickCount) : null,
        is_published: isPublished,
      };

      if (isEditing) {
        const { error } = await supabase.from("products").update(payload as any).eq("id", editId);
        if (error) throw error;
        toast({ title: "Success!", description: "Product updated successfully." });
        logAction("update", "vendor", editId!, { product_name: productName });
      } else {
        const { data, error } = await supabase.from("products").insert(payload as any).select().single();
        if (error) throw error;
        toast({ title: "Success!", description: "Product created successfully." });
        logAction("create", "vendor", data.id, { product_name: productName });
      }
      navigate("/admin/products/list");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSpotImages((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const selectedBrandName = brands.find((b) => b.id === brandId)?.name;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Product" : "Add New Product"}</h2>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          {isEditing && <TabsTrigger value="variants">Variants/SKUs</TabsTrigger>}
          {isEditing && <TabsTrigger value="related">Related Products</TabsTrigger>}
          {isEditing && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
          {isEditing && <TabsTrigger value="documents">Documents</TabsTrigger>}
        </TabsList>
        <TabsContent value="basic">
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Main Category *</Label>
                <Select value={mainCategory || "placeholder"} onValueChange={(val) => { setMainCategory(val === "placeholder" ? "" : val); setSubCategory(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select main category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select main category</SelectItem>
                    {MAIN_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sub Category *</Label>
                <Select value={subCategory || "placeholder"} onValueChange={(val) => setSubCategory(val === "placeholder" ? "" : val)} disabled={!mainCategory}>
                  <SelectTrigger><SelectValue placeholder="Select sub category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select sub category</SelectItem>
                    {SUB_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Spot Text</Label>
              <Textarea placeholder="Short description or promotional text" value={spotText} onChange={(e) => setSpotText(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Spot Images</Label>
              <div className="mt-1 space-y-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={spotImages} strategy={verticalListSortingStrategy}>
                    {spotImages.map((url, index) => (
                      <SortableImage
                        key={url}
                        id={url}
                        url={url}
                        index={index}
                        onRemove={() => setSpotImages((prev) => prev.filter((_, i) => i !== index))}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Image
                </Button>
                <FileManagerPicker
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  onSelect={(url) => { setSpotImages((prev) => [...prev, url]); setPickerOpen(false); }}
                  accept="image/*"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={brandName || "placeholder"} onValueChange={(val) => setBrandName(val === "placeholder" ? "" : val)}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select brand</SelectItem>
                    {BRAND_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Poise</Label>
                <Select value={poise || "placeholder"} onValueChange={(val) => setPoise(val === "placeholder" ? "" : val)}>
                  <SelectTrigger><SelectValue placeholder="Select poise" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select poise</SelectItem>
                    {POISE_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>AFUE</Label>
                <Select value={afue || "placeholder"} onValueChange={(val) => setAfue(val === "placeholder" ? "" : val)}>
                  <SelectTrigger><SelectValue placeholder="Select AFUE" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select AFUE</SelectItem>
                    {AFUE_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Width</Label>
                <Select value={widthSize || "placeholder"} onValueChange={(val) => setWidthSize(val === "placeholder" ? "" : val)}>
                  <SelectTrigger><SelectValue placeholder="Select width" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select width</SelectItem>
                    {WIDTH_OPTIONS.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stages</Label>
                <Select value={stages || "placeholder"} onValueChange={(val) => setStages(val === "placeholder" ? "" : val)}>
                  <SelectTrigger><SelectValue placeholder="Select stages" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled className="hidden">Select stages</SelectItem>
                    {STAGES_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Weight</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stick Count</Label>
                <Input type="number" placeholder="0" value={stickCount} onChange={(e) => setStickCount(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label>Published</Label>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Update Product" : "Create Product"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/products/list")}>
                Cancel
              </Button>
            </div>
          </form>
        </TabsContent>
        {isEditing && editId && (
          <TabsContent value="variants">
            <div className="mt-4">
              <ProductVariantsTab productId={editId} />
            </div>
          </TabsContent>
        )}
        {isEditing && editId && (
          <TabsContent value="related">
            <div className="mt-4">
              <RelatedProductsTab productId={editId} companyId={companyId} />
            </div>
          </TabsContent>
        )}
        {isEditing && editId && (
          <TabsContent value="reviews">
            <div className="mt-4">
              <ProductReviewsTab productId={editId} />
            </div>
          </TabsContent>
        )}
        {isEditing && editId && (
          <TabsContent value="documents">
            <div className="mt-4">
              <ProductDocumentsTab productId={editId} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProductsAdd;
