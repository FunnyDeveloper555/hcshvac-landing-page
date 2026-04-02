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
    setVendorIdCode("");
    setSupplierName("");
    setSupplierLocation("");
    setOurPrice("");
    setIsActive(true);
    setNotes("");
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setVendorIdCode(s.vendor_id_code);
    setSupplierName(s.supplier_name);
    setSupplierLocation(s.supplier_location || "");
    setOurPrice(s.our_price != null ? String(s.our_price) : "");
    setIsActive(s.is_active);
    setNotes(s.notes || "");
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
        // Record initial price in history
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
      // Insert price history record
      await supabase.from("product_price_history").insert({
        product_supplier_id: priceSupplier.id,
        price: newPriceNum,
        previous_price: priceSupplier.our_price,
        change_reason: priceReason || "Price update",
      } as any);
      // Update the supplier's current price
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
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. ABC Distributors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor ID Code</Label>
                <Input value={vendorIdCode} onChange={(e) => setVendorIdCode(e.target.value)} placeholder="e.g. VND-001" />
              </div>
              <div className="space-y-2">
                <Label>Our Price ($)</Label>
                <Input type="number" step="0.01" value={ourPrice} onChange={(e) => setOurPrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Supplier Location</Label>
              <Input value={supplierLocation} onChange={(e) => setSupplierLocation(e.target.value)} placeholder="City, State" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
            <div className="flex items-center gap-3">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
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
