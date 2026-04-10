import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
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
import ProductSuppliersTab from "@/components/admin/ProductSuppliersTab";
import ProductQuoteTemplateTab from "@/components/admin/ProductQuoteTemplateTab";
import ProductActivityHistoryTab from "@/components/admin/ProductActivityHistoryTab";

const POISE_OPTIONS = ["Upflow", "Downflow"];
const AFUE_OPTIONS = ["80%", "92%", "95%", "96%", "97%", "98%"];
const WIDTH_OPTIONS = ['14.5"', '17.5"', '21"', '24.5"'];
const STAGES_OPTIONS = ["Single Stage", "Two Stage", "Two Stage Variable"];
const BRAND_OPTIONS = ["Ameristar", "Durastar", "Rheem"];
const VOLTAGE_OPTIONS = ["120V", "208V", "230V", "240V", "277V", "440V"];
const REFRIGERANT_OPTIONS = ["R22", "R410a", "R32", "R454B", "R407C", "R134a"];
const TONS_BTU_OPTIONS = ["1.5 Ton", "2 Ton", "2.5 Ton", "3 Ton", "3.5 Ton", "4 Ton", "5 Ton", "7.5 Ton", "10 Ton", "12.5 Ton", "15 Ton", "20 Ton"];
const SEER_RATING_OPTIONS = ["13.2 SEER2", "14 SEER2", "14.3 SEER2", "15 SEER2", "15.2 SEER2", "16 SEER2", "17 SEER2", "18 SEER2", "19 SEER2", "20 SEER2", "21 SEER2"];
const WARRANTY_OPTIONS = ["1 Year", "5 Year", "10 Year", "5 Years Non Registered", "10 Years When Registered"];

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
  const [brandOpen, setBrandOpen] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [categoryLevel0, setCategoryLevel0] = useState("");
  const [categoryLevel1, setCategoryLevel1] = useState("");
  const [categoryLevel2, setCategoryLevel2] = useState("");
  const [productName, setProductName] = useState("");
  const [spotText, setSpotText] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [poise, setPoise] = useState("");
  const [afue, setAfue] = useState("");
  const [widthSize, setWidthSize] = useState("");
  const [stages, setStages] = useState("");
  const [voltage, setVoltage] = useState("");
  const [refrigerantType, setRefrigerantType] = useState("");
  const [tonsBtu, setTonsBtu] = useState("");
  const [seerRating, setSeerRating] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [height, setHeight] = useState("");
  const [lengthDepth, setLengthDepth] = useState("");
  const [weight, setWeight] = useState("");
  const [stickCount, setStickCount] = useState("");
  const [productStatus, setProductStatus] = useState<string>("active_not_showing");
  const [spotImages, setSpotImages] = useState<string[]>([]);

  // Warranty fields
  const [partsWarranty, setPartsWarranty] = useState("");
  const [laborWarranty, setLaborWarranty] = useState("");

  // Bullet points
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [newBulletPoint, setNewBulletPoint] = useState("");

  // Promotional fields
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDescription, setPromoDescription] = useState("");
  const [promoImageUrl, setPromoImageUrl] = useState("");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [promoPickerOpen, setPromoPickerOpen] = useState(false);

  // Repair tags
  const [isRepairEligible, setIsRepairEligible] = useState(false);
  const [repairTags, setRepairTags] = useState<string[]>([]);

  // Parts Replacement
  const [isPart, setIsPart] = useState(false);
  const [partCategory, setPartCategory] = useState("");
  const [partSubcategory, setPartSubcategory] = useState("");
  const [partLocationType, setPartLocationType] = useState("");

  // Banner/Description Statements
  const [installedBannerText, setInstalledBannerText] = useState("");
  const [installedDescription, setInstalledDescription] = useState("");
  const [discontinuedBannerText, setDiscontinuedBannerText] = useState("");
  const [discontinuedDescription, setDiscontinuedDescription] = useState("");
  const [alternativeProductStatement, setAlternativeProductStatement] = useState("");
  const [alternativeProductUrl, setAlternativeProductUrl] = useState("");
  const [newRepairTag, setNewRepairTag] = useState("");

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

  const { data: allCategories = [] } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, parent_id, name, level, display_order")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  const level0Categories = allCategories.filter((c: any) => c.level === 0);
  const level1Categories = allCategories.filter((c: any) => c.level === 1 && c.parent_id === categoryLevel0);
  const level2Categories = allCategories.filter((c: any) => c.level === 2 && c.parent_id === categoryLevel1);

  const generateAutoName = () => {
    const resComLabel = (() => {
      const cat0 = allCategories.find((c: any) => c.id === categoryLevel0);
      if (!cat0) return "";
      const name = cat0.name?.toLowerCase() || "";
      if (name.includes("residential")) return "Residential";
      if (name.includes("commercial")) return "Commercial";
      return "";
    })();
    const equipType = (() => {
      const catId = categoryLevel2 || categoryLevel1;
      const cat = allCategories.find((c: any) => c.id === catId);
      return cat?.name || "";
    })();
    const parts = [brandName, modelNumber, resComLabel, tonsBtu, refrigerantType, seerRating, equipType].filter(Boolean);
    return parts.join(" ");
  };

  const handleAutoGenerate = () => {
    const autoName = generateAutoName();
    if (autoName.trim()) setProductName(autoName);
  };

  useEffect(() => {
    if (editId && allCategories.length > 0) fetchProduct();
  }, [editId, allCategories]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").eq("id", editId).single();
    if (error) {
      toast({ title: "Error", description: "Failed to load product", variant: "destructive" });
      navigate("/admin/products/list");
    } else if (data) {
      setCompanyId(data.company_id || "");
      const catId = (data as any).category_id || "";
      if (catId && allCategories.length > 0) {
        const cat = allCategories.find((c: any) => c.id === catId);
        if (cat) {
          if (cat.level === 2) {
            setCategoryLevel2(cat.id);
            const parent1 = allCategories.find((c: any) => c.id === cat.parent_id);
            if (parent1) {
              setCategoryLevel1(parent1.id);
              setCategoryLevel0(parent1.parent_id || "");
            }
          } else if (cat.level === 1) {
            setCategoryLevel1(cat.id);
            setCategoryLevel0(cat.parent_id || "");
          } else {
            setCategoryLevel0(cat.id);
          }
        }
      }
      setProductName(data.product_name);
      setSpotText(data.spot_text || "");
      setBrandId(data.brand_id || "");
      setBrandName((data as any).brand_name || "");
      setPoise((data as any).poise || "");
      setAfue((data as any).afue || "");
      setWidthSize((data as any).width_size || "");
      setStages((data as any).stages || "");
      setVoltage((data as any).voltage || "");
      setRefrigerantType((data as any).refrigerant_type || "");
      setTonsBtu((data as any).tons_btu || "");
      setSeerRating((data as any).seer_rating || "");
      setModelNumber((data as any).model_number || "");
      setHeight((data as any).height || "");
      setLengthDepth((data as any).length_depth || "");
      setWeight(data.weight != null ? String(data.weight) : "");
      setStickCount(data.stick_count != null ? String(data.stick_count) : "");
      setProductStatus((data as any).status || "active_not_showing");
      setSpotImages((data.spot_images as string[]) || []);
      setPartsWarranty((data as any).parts_warranty || "");
      setLaborWarranty((data as any).labor_warranty || "");
      setBulletPoints((data as any).bullet_points || []);
      setPromoTitle((data as any).promo_title || "");
      setPromoDescription((data as any).promo_description || "");
      setPromoImageUrl((data as any).promo_image_url || "");
      setPromoStartDate((data as any).promo_start_date ? (data as any).promo_start_date.slice(0, 10) : "");
      setPromoEndDate((data as any).promo_end_date ? (data as any).promo_end_date.slice(0, 10) : "");
      setIsPromoActive((data as any).is_promo_active || false);
      setIsRepairEligible((data as any).is_repair_eligible || false);
      setRepairTags((data as any).repair_tags || []);
      setIsPart((data as any).is_part || false);
      setPartCategory((data as any).part_category || "");
      setPartSubcategory((data as any).part_subcategory || "");
      setPartLocationType((data as any).part_location_type || "");
      setInstalledBannerText((data as any).installed_banner_text || "");
      setInstalledDescription((data as any).installed_description || "");
      setDiscontinuedBannerText((data as any).discontinued_banner_text || "");
      setDiscontinuedDescription((data as any).discontinued_description || "");
      setAlternativeProductStatement((data as any).alternative_product_statement || "");
      setAlternativeProductUrl((data as any).alternative_product_url || "");
    }
    setLoading(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!companyId) { toast({ title: "Error", description: "Company is required", variant: "destructive" }); return; }
    if (!categoryLevel0) { toast({ title: "Error", description: "Equipment type is required", variant: "destructive" }); return; }
    if (!productName) { toast({ title: "Error", description: "Product name is required", variant: "destructive" }); return; }

    const finalCategoryId = categoryLevel2 || categoryLevel1 || categoryLevel0;
    const catNames = [categoryLevel0, categoryLevel1, categoryLevel2]
      .map(id => allCategories.find((c: any) => c.id === id)?.name)
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        company_id: companyId || null,
        category_id: finalCategoryId || null,
        category: catNames.join(" - "),
        product_name: productName,
        spot_text: spotText || null,
        spot_images: spotImages,
        brand_id: brandId || null,
        brand_name: brandName || null,
        poise: poise || null,
        afue: afue || null,
        width_size: widthSize || null,
        stages: stages || null,
        voltage: voltage || null,
        refrigerant_type: refrigerantType || null,
        tons_btu: tonsBtu || null,
        seer_rating: seerRating || null,
        model_number: modelNumber || null,
        height: height || null,
        length_depth: lengthDepth || null,
        weight: weight ? parseFloat(weight) : null,
        stick_count: stickCount ? parseInt(stickCount) : null,
        status: productStatus,
        parts_warranty: partsWarranty || "",
        labor_warranty: laborWarranty || "",
        bullet_points: bulletPoints,
        promo_title: promoTitle || "",
        promo_description: promoDescription || "",
        promo_image_url: promoImageUrl || "",
        promo_start_date: promoStartDate || null,
        promo_end_date: promoEndDate || null,
        is_promo_active: isPromoActive,
        is_repair_eligible: isRepairEligible,
        repair_tags: repairTags,
        is_part: isPart,
        part_category: partCategory || "",
        part_subcategory: partSubcategory || "",
        part_location_type: partLocationType || "",
        installed_banner_text: installedBannerText || "",
        installed_description: installedDescription || "",
        discontinued_banner_text: discontinuedBannerText || "",
        discontinued_description: discontinuedDescription || "",
        alternative_product_statement: alternativeProductStatement || "",
        alternative_product_url: alternativeProductUrl || "",
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const saveButton = (
    <div className="flex gap-2 pt-4">
      <Button type="button" onClick={() => handleSubmit()} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isEditing ? "Update Product" : "Create Product"}
      </Button>
      <Button type="button" variant="outline" onClick={() => navigate("/admin/products/list")}>
        Cancel
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Product" : "Add New Product"}</h2>
      <Tabs defaultValue="properties">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-0 bg-transparent border-b rounded-none p-0">
          <TabsTrigger value="properties" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Properties</TabsTrigger>
          <TabsTrigger value="summary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Summary</TabsTrigger>
          {isEditing && <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">History</TabsTrigger>}
          <TabsTrigger value="repair-tags" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Repair Tags</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Inventory</TabsTrigger>
          <TabsTrigger value="promotionals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Promotional's</TabsTrigger>
          {isEditing && <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Product PDF's</TabsTrigger>}
          {isEditing && <TabsTrigger value="suppliers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Financing Vendors</TabsTrigger>}
          {isEditing && <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Variants/SKUs</TabsTrigger>}
          {isEditing && <TabsTrigger value="related" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Related Products</TabsTrigger>}
          {isEditing && <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Reviews</TabsTrigger>}
          <TabsTrigger value="quote-template" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2 text-sm">Invoice Template</TabsTrigger>
        </TabsList>

        {/* ===== PROPERTIES TAB ===== */}
        <TabsContent value="properties">
          <div className="space-y-6 mt-4">
            {/* Status */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Status</h3>
              <Select value={productStatus} onValueChange={setProductStatus}>
                <SelectTrigger className="max-w-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active_showing">Item Active (Showing)</SelectItem>
                  <SelectItem value="active_not_showing">Item Active (Not Showing)</SelectItem>
                  <SelectItem value="discontinued_showing">Item Discontinued (Showing)</SelectItem>
                  <SelectItem value="deactivated">Deactivated (Not Showing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HVAC Category */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">HVAC Category</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label>Equipment Type *</Label>
                  <Select value={categoryLevel0 || "placeholder"} onValueChange={(val) => { setCategoryLevel0(val === "placeholder" ? "" : val); setCategoryLevel1(""); setCategoryLevel2(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select equipment type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select equipment type</SelectItem>
                      {level0Categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {level1Categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryLevel1 || "placeholder"} onValueChange={(val) => { setCategoryLevel1(val === "placeholder" ? "" : val); setCategoryLevel2(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled className="hidden">Select category</SelectItem>
                        {level1Categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {level2Categories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sub Category</Label>
                    <Select value={categoryLevel2 || "placeholder"} onValueChange={(val) => setCategoryLevel2(val === "placeholder" ? "" : val)}>
                      <SelectTrigger><SelectValue placeholder="Select sub category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled className="hidden">Select sub category</SelectItem>
                        {level2Categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label>Tons / BTU</Label>
                  <Select value={tonsBtu || "placeholder"} onValueChange={(val) => setTonsBtu(val === "placeholder" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select tons/BTU" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select tons/BTU</SelectItem>
                      {TONS_BTU_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Refrigerant Type</Label>
                  <Select value={refrigerantType || "placeholder"} onValueChange={(val) => setRefrigerantType(val === "placeholder" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select refrigerant" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select refrigerant</SelectItem>
                      {REFRIGERANT_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Voltage</Label>
                  <Select value={voltage || "placeholder"} onValueChange={(val) => setVoltage(val === "placeholder" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select voltage" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select voltage</SelectItem>
                      {VOLTAGE_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>SEER Rating</Label>
                  <Select value={seerRating || "placeholder"} onValueChange={(val) => setSeerRating(val === "placeholder" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select SEER rating" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select SEER rating</SelectItem>
                      {SEER_RATING_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
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
              </div>
            </div>

            {/* Generate Product Name */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Generate Product Name</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label>Product Name *</Label>
                  <Input placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Pattern: {"{Brand} {Model} {Res/Com} {Tons} {Refrigerant} {SEER} {Equipment Type}"}</p>
                </div>
                <Button type="button" variant="outline" onClick={handleAutoGenerate}>
                  Auto-Generate
                </Button>
              </div>
            </div>

            {/* Model / Dimensions */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Model &amp; Dimensions</h3>
              <div className="space-y-2">
                <Label>Model Number / Family Prefix</Label>
                <Input placeholder="e.g. GLXS3BN3610" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} />
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Input placeholder='e.g. 32-1/2"' value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Length / Depth</Label>
                  <Input placeholder='e.g. 26"' value={lengthDepth} onChange={(e) => setLengthDepth(e.target.value)} />
                </div>
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
                  <Label>Weight (lbs)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Warranty</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacture's Parts Warranty</Label>
                  <Select value={partsWarranty || "placeholder"} onValueChange={(val) => setPartsWarranty(val === "placeholder" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select warranty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select warranty</SelectItem>
                      {WARRANTY_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Labor Warranty</Label>
                  <Select value={laborWarranty || "placeholder"} onValueChange={(val) => setLaborWarranty(val === "placeholder" ? "" : val)}>
                    <SelectTrigger><SelectValue placeholder="Select warranty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled className="hidden">Select warranty</SelectItem>
                      {WARRANTY_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bullet Points Description */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Bullet Points Description</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. High efficiency Energy-efficient compressor"
                  value={newBulletPoint}
                  onChange={(e) => setNewBulletPoint(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const bp = newBulletPoint.trim();
                      if (bp && !bulletPoints.includes(bp)) {
                        setBulletPoints([...bulletPoints, bp]);
                        setNewBulletPoint("");
                      }
                    }
                  }}
                />
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  const bp = newBulletPoint.trim();
                  if (bp && !bulletPoints.includes(bp)) {
                    setBulletPoints([...bulletPoints, bp]);
                    setNewBulletPoint("");
                  }
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <ul className="space-y-1">
                {bulletPoints.map((bp, i) => (
                  <li key={i} className="flex items-center justify-between bg-muted rounded px-3 py-1.5 text-sm">
                    <span>• {bp}</span>
                    <button type="button" onClick={() => setBulletPoints(bulletPoints.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Banner/Description moved to Quote Template tab */}

            {/* Parts Replacement */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Parts Replacement</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="is-part" className="text-sm">Is a Part</Label>
                  <Switch id="is-part" checked={isPart} onCheckedChange={setIsPart} />
                </div>
              </div>
              {isPart && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Part Category</Label>
                    <Select value={partCategory} onValueChange={setPartCategory}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Condenser Parts">Condenser Parts</SelectItem>
                        <SelectItem value="Coil Parts">Coil Parts</SelectItem>
                        <SelectItem value="Furnace Parts">Furnace Parts</SelectItem>
                        <SelectItem value="Boiler Parts Hot Water">Boiler Parts Hot Water</SelectItem>
                        <SelectItem value="Boiler Parts Steam">Boiler Parts Steam</SelectItem>
                        <SelectItem value="Water Heater Parts">Water Heater Parts</SelectItem>
                        <SelectItem value="Tankless Water Heater Parts">Tankless Water Heater Parts</SelectItem>
                        <SelectItem value="Tankless Boiler Parts">Tankless Boiler Parts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location Type</Label>
                    <Select value={partLocationType} onValueChange={setPartLocationType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Part Subcategory</Label>
                    <Input placeholder="e.g. Evaporator Coil" value={partSubcategory} onChange={(e) => setPartSubcategory(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            {saveButton}
          </div>
        </TabsContent>

        {/* ===== SUMMARY TAB ===== */}
        <TabsContent value="summary">
          <div className="space-y-6 mt-4">
            {/* Product Summary */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Product Summary</h3>
              <div className="space-y-2">
                <Label>Spot Text / Short Description</Label>
                <Textarea placeholder="Short description or promotional text" value={spotText} onChange={(e) => setSpotText(e.target.value)} rows={4} />
              </div>
            </div>

            {/* Product Images */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Product Images</h3>
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

            <div className="border rounded-lg p-4 space-y-2">
              <Label>Stick Count</Label>
              <Input type="number" placeholder="0" value={stickCount} onChange={(e) => setStickCount(e.target.value)} className="max-w-xs" />
            </div>

            {saveButton}
          </div>
        </TabsContent>

        {/* ===== HISTORY TAB ===== */}
        {isEditing && editId && (
          <TabsContent value="history">
            <ProductActivityHistoryTab productId={editId!} />
          </TabsContent>
        )}

        {/* ===== REPAIR TAGS TAB ===== */}
        <TabsContent value="repair-tags">
          <div className="space-y-6 mt-4">
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Repair Tags</h3>
                <div className="flex items-center gap-2">
                  <Label>Repair Eligible</Label>
                  <Switch checked={isRepairEligible} onCheckedChange={setIsRepairEligible} />
                </div>
              </div>
              {isRepairEligible && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Condenser Repair, Coil Replacement"
                      value={newRepairTag}
                      onChange={(e) => setNewRepairTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const tag = newRepairTag.trim();
                          if (tag && !repairTags.includes(tag)) {
                            setRepairTags([...repairTags, tag]);
                            setNewRepairTag("");
                          }
                        }
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      const tag = newRepairTag.trim();
                      if (tag && !repairTags.includes(tag)) {
                        setRepairTags([...repairTags, tag]);
                        setNewRepairTag("");
                      }
                    }}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {repairTags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                        {tag}
                        <button type="button" onClick={() => setRepairTags(repairTags.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {saveButton}
          </div>
        </TabsContent>

        {/* ===== INVENTORY TAB ===== */}
        <TabsContent value="inventory">
          <div className="space-y-6 mt-4">
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Inventory</h3>
              <p className="text-sm text-muted-foreground">Track stock levels, warehouse locations, and inventory movements for this product.</p>
              <div className="text-center py-8 text-muted-foreground">
                Inventory tracking coming soon. Stock levels will be managed here.
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== PROMOTIONAL'S TAB ===== */}
        <TabsContent value="promotionals">
          <div className="space-y-6 mt-4">
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Promotional Content</h3>
                <div className="flex items-center gap-2">
                  <Label>Active</Label>
                  <Switch checked={isPromoActive} onCheckedChange={setIsPromoActive} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Promo Title</Label>
                  <Input placeholder="e.g. Summer Special" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Promo Image URL</Label>
                  <Input placeholder="URL for promotional image" value={promoImageUrl} onChange={(e) => setPromoImageUrl(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Promo Description</Label>
                <Textarea placeholder="Promotional details" value={promoDescription} onChange={(e) => setPromoDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={promoStartDate} onChange={(e) => setPromoStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={promoEndDate} onChange={(e) => setPromoEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            {saveButton}
          </div>
        </TabsContent>

        {/* ===== PRODUCT PDF'S TAB ===== */}
        {isEditing && editId && (
          <TabsContent value="documents">
            <div className="mt-4">
              <ProductDocumentsTab productId={editId} />
            </div>
          </TabsContent>
        )}

        {/* ===== FINANCING VENDORS TAB ===== */}
        {isEditing && editId && (
          <TabsContent value="suppliers">
            <div className="mt-4">
              <ProductSuppliersTab productId={editId} />
            </div>
          </TabsContent>
        )}

        {/* ===== VARIANTS/SKUS TAB ===== */}
        {isEditing && editId && (
          <TabsContent value="variants">
            <div className="mt-4">
              <ProductVariantsTab productId={editId} />
            </div>
          </TabsContent>
        )}

        {/* ===== RELATED PRODUCTS TAB ===== */}
        {isEditing && editId && (
          <TabsContent value="related">
            <div className="mt-4">
              <RelatedProductsTab productId={editId} companyId={companyId} />
            </div>
          </TabsContent>
        )}

        {/* ===== REVIEWS TAB ===== */}
        {isEditing && editId && (
          <TabsContent value="reviews">
            <div className="mt-4">
              <ProductReviewsTab productId={editId} />
            </div>
          </TabsContent>
        )}

        {/* ===== QUOTE TEMPLATE TAB ===== */}
        <TabsContent value="quote-template">
          <ProductQuoteTemplateTab
            installedBannerText={installedBannerText}
            setInstalledBannerText={setInstalledBannerText}
            installedDescription={installedDescription}
            setInstalledDescription={setInstalledDescription}
            discontinuedBannerText={discontinuedBannerText}
            setDiscontinuedBannerText={setDiscontinuedBannerText}
            discontinuedDescription={discontinuedDescription}
            setDiscontinuedDescription={setDiscontinuedDescription}
            alternativeProductStatement={alternativeProductStatement}
            setAlternativeProductStatement={setAlternativeProductStatement}
            alternativeProductUrl={alternativeProductUrl}
            setAlternativeProductUrl={setAlternativeProductUrl}
            saveButton={saveButton}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductsAdd;
