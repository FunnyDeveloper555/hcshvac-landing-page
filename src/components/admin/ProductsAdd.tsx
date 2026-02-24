import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useQuery } from "@tanstack/react-query";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";

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

  const [companyId, setCompanyId] = useState("");
  const [category, setCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [spotText, setSpotText] = useState("");
  const [brandId, setBrandId] = useState("");
  const [weight, setWeight] = useState("");
  const [stickCount, setStickCount] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [spotImages, setSpotImages] = useState<string[]>([]);

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
      setCategory(data.category || "");
      setProductName(data.product_name);
      setSpotText(data.spot_text || "");
      setBrandId(data.brand_id || "");
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
    if (!category) { toast({ title: "Error", description: "Category is required", variant: "destructive" }); return; }
    if (!productName) { toast({ title: "Error", description: "Product name is required", variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        company_id: companyId || null,
        category: category || null,
        product_name: productName,
        spot_text: spotText || null,
        spot_images: spotImages,
        brand_id: brandId || null,
        weight: weight ? parseFloat(weight) : null,
        stick_count: stickCount ? parseInt(stickCount) : null,
        is_published: isPublished,
      };

      if (isEditing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editId);
        if (error) throw error;
        toast({ title: "Success!", description: "Product updated successfully." });
        logAction("update", "vendor", editId!, { product_name: productName });
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select().single();
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
      <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label>Category *</Label>
            <Input placeholder="e.g. Filters, Parts, Accessories" value={category} onChange={(e) => setCategory(e.target.value)} />
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
            {spotImages.map((url, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                <img src={url} alt={`Spot ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                <span className="text-sm truncate flex-1">{url}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => setSpotImages(prev => prev.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Image
            </Button>
            <FileManagerPicker
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              onSelect={(url) => { setSpotImages(prev => [...prev, url]); setPickerOpen(false); }}
              accept="image/*"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select value={brandId || "none"} onValueChange={(val) => setBrandId(val === "none" ? "" : val)}>
              <SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Weight</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>

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
    </div>
  );
};

export default ProductsAdd;
