import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Loader2, Plus, Pencil, Trash2, History, DollarSign } from "lucide-react";

interface Supplier {
  id: string;
  vendor_id_code: string;
  supplier_name: string;
  supplier_location: string;
  our_price: number | null;
  is_active: boolean;
  display_order: number;
  notes: string;
  website_url?: string;
  city?: string;
  state?: string;
  rep_name?: string;
  rep_phone?: string;
  rep_email?: string;
  manufacture_product_url?: string;
  supplier_product_url?: string;
  vendor_cost?: number | null;
  tax_rate?: number | null;
  shipping_cost?: number | null;
  freight_cost?: number | null;
  has_shipping?: boolean;
  has_freight?: boolean;
  price_residential_suburbs?: number | null;
  price_residential_city?: number | null;
  price_commercial_suburbs?: number | null;
  price_commercial_city?: number | null;
  price_custom_formula?: string;
}

interface PriceHistory {
  id: string;
  price: number;
  previous_price: number | null;
  changed_at: string;
  change_reason: string;
}

interface ProductSuppliersTabProps {
  productId: string;
}

const ProductSuppliersTab = ({ productId }: ProductSuppliersTabProps) => {
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [vendorIdCode, setVendorIdCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierLocation, setSupplierLocation] = useState("");
  const [ourPrice, setOurPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [manufactureProductUrl, setManufactureProductUrl] = useState("");
  const [supplierProductUrl, setSupplierProductUrl] = useState("");
  const [vendorCost, setVendorCost] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [freightCost, setFreightCost] = useState("");
  const [hasShipping, setHasShipping] = useState(false);
  const [hasFreight, setHasFreight] = useState(false);
  const [priceResSuburbs, setPriceResSuburbs] = useState("");
  const [priceResCity, setPriceResCity] = useState("");
  const [priceComSuburbs, setPriceComSuburbs] = useState("");
  const [priceComCity, setPriceComCity] = useState("");
  const [priceCustomFormula, setPriceCustomFormula] = useState("");

  // Price history
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Price update
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [priceSupplier, setPriceSupplier] = useState<Supplier | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [priceReason, setPriceReason] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, [productId]);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_suppliers")
      .select("*")
      .eq("product_id", productId)
      .order("display_order") as any;
    if (error) {
      toast({ title: "Error", description: "Failed to load suppliers", variant: "destructive" });
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setVendorIdCode(""); setSupplierName(""); setSupplierLocation("");
    setOurPrice(""); setIsActive(true); setNotes("");
    setWebsiteUrl(""); setCity(""); setState("");
    setRepName(""); setRepPhone(""); setRepEmail("");
    setManufactureProductUrl(""); setSupplierProductUrl("");
    setVendorCost(""); setTaxRate(""); setShippingCost(""); setFreightCost("");
    setHasShipping(false); setHasFreight(false);
    setPriceResSuburbs(""); setPriceResCity("");
    setPriceComSuburbs(""); setPriceComCity("");
    setPriceCustomFormula(""); setEditingId(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setVendorIdCode(s.vendor_id_code);
    setSupplierName(s.supplier_name);
    setSupplierLocation(s.supplier_location || "");
    setOurPrice(s.our_price != null ? String(s.our_price) : "");
    setIsActive(s.is_active);
    setNotes(s.notes || "");
    setWebsiteUrl(s.website_url || "");
    setCity(s.city || "");
    setState(s.state || "");
    setRepName(s.rep_name || "");
    setRepPhone(s.rep_phone || "");
    setRepEmail(s.rep_email || "");
    setManufactureProductUrl(s.manufacture_product_url || "");
    setSupplierProductUrl(s.supplier_product_url || "");
    setVendorCost(s.vendor_cost != null ? String(s.vendor_cost) : "");
    setTaxRate(s.tax_rate != null ? String(s.tax_rate) : "");
    setShippingCost(s.shipping_cost != null ? String(s.shipping_cost) : "");
    setFreightCost(s.freight_cost != null ? String(s.freight_cost) : "");
    setHasShipping(s.has_shipping || false);
    setHasFreight(s.has_freight || false);
    setPriceResSuburbs(s.price_residential_suburbs != null ? String(s.price_residential_suburbs) : "");
    setPriceResCity(s.price_residential_city != null ? String(s.price_residential_city) : "");
    setPriceComSuburbs(s.price_commercial_suburbs != null ? String(s.price_commercial_suburbs) : "");
    setPriceComCity(s.price_commercial_city != null ? String(s.price_commercial_city) : "");
    setPriceCustomFormula(s.price_custom_formula || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!supplierName.trim()) {
      toast({ title: "Error", description: "Supplier name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload: any = {
      product_id: productId,
      vendor_id_code: vendorIdCode,
      supplier_name: supplierName,
      supplier_location: supplierLocation,
      our_price: ourPrice ? parseFloat(ourPrice) : null,
      is_active: isActive,
      notes,
      website_url: websiteUrl,
      city, state,
      rep_name: repName, rep_phone: repPhone, rep_email: repEmail,
      manufacture_product_url: manufactureProductUrl,
      supplier_product_url: supplierProductUrl,
      vendor_cost: vendorCost ? parseFloat(vendorCost) : null,
      tax_rate: taxRate ? parseFloat(taxRate) : null,
      shipping_cost: shippingCost ? parseFloat(shippingCost) : null,
      freight_cost: freightCost ? parseFloat(freightCost) : null,
      has_shipping: hasShipping,
      has_freight: hasFreight,
      price_residential_suburbs: priceResSuburbs ? parseFloat(priceResSuburbs) : null,
      price_residential_city: priceResCity ? parseFloat(priceResCity) : null,
      price_commercial_suburbs: priceComSuburbs ? parseFloat(priceComSuburbs) : null,
      price_commercial_city: priceComCity ? parseFloat(priceComCity) : null,
      price_custom_formula: priceCustomFormula,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("product_suppliers").update(payload).eq("id", editingId) as any;
        if (error) throw error;
        toast({ title: "Updated", description: "Supplier updated." });
        logAction("update", "product_category", editingId, { supplier_name: supplierName });
      } else {
        const { data, error } = await supabase.from("product_suppliers").insert(payload).select().single() as any;
        if (error) throw error;
        if (ourPrice) {
          await supabase.from("product_price_history").insert({
            product_supplier_id: data.id,
            price: parseFloat(ourPrice),
            previous_price: null,
            change_reason: "Initial price",
          } as any);
        }
        toast({ title: "Added", description: "Supplier added." });
        logAction("create", "product_category", data.id, { supplier_name: supplierName });
      }
      setDialogOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    const { error } = await supabase.from("product_suppliers").delete().eq("id", id) as any;
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Supplier removed." });
      fetchSuppliers();
    }
  };

  const openHistory = async (s: Supplier) => {
    setHistorySupplier(s);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("product_price_history")
      .select("*")
      .eq("product_supplier_id", s.id)
      .order("changed_at", { ascending: false }) as any;
    if (!error) setPriceHistory(data || []);
    setHistoryLoading(false);
  };

  const openPriceUpdate = (s: Supplier) => {
    setPriceSupplier(s);
    setNewPrice("");
    setPriceReason("");
    setPriceDialogOpen(true);
  };

  const handlePriceUpdate = async () => {
    if (!priceSupplier || !newPrice) return;
    setSubmitting(true);
    try {
      const newPriceNum = parseFloat(newPrice);
      await supabase.from("product_price_history").insert({
        product_supplier_id: priceSupplier.id,
        price: newPriceNum,
        previous_price: priceSupplier.our_price,
        change_reason: priceReason || "Price update",
      } as any);
      await supabase.from("product_suppliers").update({ our_price: newPriceNum } as any).eq("id", priceSupplier.id);
      toast({ title: "Price Updated", description: `Price changed to $${newPriceNum.toFixed(2)}` });
      setPriceDialogOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vendors / Suppliers</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Supplier
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No suppliers linked to this product yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor ID</TableHead>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Vendor Cost</TableHead>
              <TableHead>Our Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.vendor_id_code || "—"}</TableCell>
                <TableCell className="font-medium">{s.supplier_name}</TableCell>
                <TableCell>{s.supplier_location || "—"}</TableCell>
                <TableCell>{s.vendor_cost != null ? `$${Number(s.vendor_cost).toFixed(2)}` : "—"}</TableCell>
                <TableCell>{s.our_price != null ? `$${Number(s.our_price).toFixed(2)}` : "—"}</TableCell>
                <TableCell>
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => openPriceUpdate(s)} title="Update Price">
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openHistory(s)} title="Price History">
                      <History className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier Name *</Label>
                  <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. Johnstone Supply" />
                </div>
                <div className="space-y-2">
                  <Label>Vendor ID Code</Label>
                  <Input value={vendorIdCode} onChange={(e) => setVendorIdCode(e.target.value)} placeholder="e.g. 8152151170" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Location</Label>
                  <Input value={supplierLocation} onChange={(e) => setSupplierLocation(e.target.value)} placeholder="e.g. Joliet, IL" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Rep Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Rep Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rep's Name</Label>
                  <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Rep's Phone</Label>
                  <Input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Rep's Email</Label>
                  <Input value={repEmail} onChange={(e) => setRepEmail(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Product URLs */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Product URLs</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacture Product URL</Label>
                  <Input value={manufactureProductUrl} onChange={(e) => setManufactureProductUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Product Listing URL</Label>
                  <Input value={supplierProductUrl} onChange={(e) => setSupplierProductUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Cost Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor Cost ($)</Label>
                  <Input type="number" step="0.01" value={vendorCost} onChange={(e) => setVendorCost(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate ($)</Label>
                  <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={hasShipping} onCheckedChange={setHasShipping} />
                    <Label>Shipping Cost</Label>
                  </div>
                  {hasShipping && (
                    <Input type="number" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="$ 0.00" />
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={hasFreight} onCheckedChange={setHasFreight} />
                    <Label>Freight Cost</Label>
                  </div>
                  {hasFreight && (
                    <Input type="number" step="0.01" value={freightCost} onChange={(e) => setFreightCost(e.target.value)} placeholder="$ 0.00" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Our Price ($)</Label>
                <Input type="number" step="0.01" value={ourPrice} onChange={(e) => setOurPrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            {/* Pricing Formula */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pricing Formula</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Residential (Suburbs) $</Label>
                  <Input type="number" step="0.01" value={priceResSuburbs} onChange={(e) => setPriceResSuburbs(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Residential (City) $</Label>
                  <Input type="number" step="0.01" value={priceResCity} onChange={(e) => setPriceResCity(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commercial (Suburbs) $</Label>
                  <Input type="number" step="0.01" value={priceComSuburbs} onChange={(e) => setPriceComSuburbs(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Commercial (City) $</Label>
                  <Input type="number" step="0.01" value={priceComCity} onChange={(e) => setPriceComCity(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Custom Formula $</Label>
                <Input value={priceCustomFormula} onChange={(e) => setPriceCustomFormula(e.target.value)} placeholder="Custom pricing formula" />
              </div>
            </div>

            {/* Notes & Status */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
              <div className="flex items-center gap-3">
                <Label>Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Update Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Price — {priceSupplier?.supplier_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {priceSupplier?.our_price != null && (
              <p className="text-sm text-muted-foreground">
                Current price: <span className="font-semibold text-foreground">${Number(priceSupplier.our_price).toFixed(2)}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label>New Price ($) *</Label>
              <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Input value={priceReason} onChange={(e) => setPriceReason(e.target.value)} placeholder="e.g. Supplier price increase" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePriceUpdate} disabled={submitting || !newPrice}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Price History — {historySupplier?.supplier_name}</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : priceHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No price history recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceHistory.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">{new Date(h.changed_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">${Number(h.price).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {h.previous_price != null ? `$${Number(h.previous_price).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{h.change_reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductSuppliersTab;
