import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface ProductVariantsTabProps {
  productId: string;
}

interface VariantForm {
  sku: string;
  variant_name: string;
  attributes: string;
  weight: string;
  price: string;
  stock_status: string;
  display_order: string;
  is_active: boolean;
}

const EMPTY_FORM: VariantForm = {
  sku: "",
  variant_name: "",
  attributes: "{}",
  weight: "",
  price: "",
  stock_status: "in_stock",
  display_order: "0",
  is_active: true,
};

const STOCK_OPTIONS = [
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "discontinued", label: "Discontinued" },
];

const ProductVariantsTab = ({ productId }: ProductVariantsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantForm>(EMPTY_FORM);

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsedAttrs: Json;
      try {
        parsedAttrs = JSON.parse(form.attributes);
      } catch {
        throw new Error("Attributes must be valid JSON");
      }

      const payload = {
        product_id: productId,
        sku: form.sku.trim(),
        variant_name: form.variant_name.trim(),
        attributes: parsedAttrs,
        weight: form.weight ? parseFloat(form.weight) : null,
        price: form.price ? parseFloat(form.price) : null,
        stock_status: form.stock_status,
        display_order: parseInt(form.display_order) || 0,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase.from("product_variants").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_variants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      toast({ title: "Success", description: editingId ? "Variant updated." : "Variant created." });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      toast({ title: "Deleted", description: "Variant removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, display_order: String(variants.length) });
    setDialogOpen(true);
  };

  const openEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      sku: v.sku,
      variant_name: v.variant_name,
      attributes: JSON.stringify(v.attributes, null, 2),
      weight: v.weight != null ? String(v.weight) : "",
      price: v.price != null ? String(v.price) : "",
      stock_status: v.stock_status,
      display_order: String(v.display_order),
      is_active: v.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim()) {
      toast({ title: "Error", description: "SKU is required", variant: "destructive" });
      return;
    }
    if (!form.variant_name.trim()) {
      toast({ title: "Error", description: "Variant name is required", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const stockBadgeVariant = (status: string) => {
    switch (status) {
      case "in_stock": return "default";
      case "low_stock": return "secondary";
      case "out_of_stock": return "destructive";
      case "discontinued": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Product Variants ({variants.length})</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Variant
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No variants yet. Add your first variant/SKU.
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Variant Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm">{v.sku}</TableCell>
                  <TableCell className="font-medium">{v.variant_name}</TableCell>
                  <TableCell>{v.price != null ? `$${Number(v.price).toFixed(2)}` : "—"}</TableCell>
                  <TableCell>{v.weight != null ? `${v.weight} lbs` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={stockBadgeVariant(v.stock_status) as any}>
                      {STOCK_OPTIONS.find((o) => o.value === v.stock_status)?.label || v.stock_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.is_active ? "default" : "secondary"}>
                      {v.is_active ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(v.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Variant" : "Add Variant"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  placeholder="e.g. FILT-20x20-4PK"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Variant Name *</Label>
                <Input
                  placeholder="e.g. 4-Pack 20x20"
                  value={form.variant_name}
                  onChange={(e) => setForm({ ...form, variant_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (lbs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Status</Label>
                <Select value={form.stock_status} onValueChange={(v) => setForm({ ...form, stock_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STOCK_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attributes (JSON)</Label>
              <Textarea
                rows={4}
                placeholder='{"size": "20x20", "thickness": "1 inch"}'
                value={form.attributes}
                onChange={(e) => setForm({ ...form, attributes: e.target.value })}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductVariantsTab;
