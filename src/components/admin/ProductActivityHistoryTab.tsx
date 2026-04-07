import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";

interface Props {
  productId: string;
}

const ProductActivityHistoryTab = ({ productId }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Activity stats
  const [activityId, setActivityId] = useState<string | null>(null);
  const [pageVisits, setPageVisits] = useState(0);
  const [enquiries, setEnquiries] = useState(0);
  const [downloads, setDownloads] = useState(0);
  const [otherPageViews, setOtherPageViews] = useState(0);
  const [sentAsEstimate, setSentAsEstimate] = useState(0);
  const [purchasedInstalled, setPurchasedInstalled] = useState(0);
  const [warrantyVisits, setWarrantyVisits] = useState(0);
  const [warrantyRepaired, setWarrantyRepaired] = useState(0);
  const [recallsActive, setRecallsActive] = useState("None");

  // Purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poLoading, setPoLoading] = useState(true);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [poSubmitting, setPoSubmitting] = useState(false);
  const [receiptPickerOpen, setReceiptPickerOpen] = useState(false);

  // PO form
  const [poPartNumber, setPoPartNumber] = useState("");
  const [poPurchaseDate, setPoPurchaseDate] = useState("");
  const [poCustomerId, setPoCustomerId] = useState("");
  const [poPurchaseType, setPoPurchaseType] = useState("purchased");
  const [poVendorId, setPoVendorId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poReceiptUrl, setPoReceiptUrl] = useState("");
  const [poTechId, setPoTechId] = useState("");
  const [poNotes, setPoNotes] = useState("");

  useEffect(() => {
    fetchActivity();
    fetchPurchaseOrders();
  }, [productId]);

  const fetchActivity = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_activity_history")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle() as any;
    if (!error && data) {
      setActivityId(data.id);
      setPageVisits(data.page_visits || 0);
      setEnquiries(data.enquiries || 0);
      setDownloads(data.downloads || 0);
      setOtherPageViews(data.other_page_views || 0);
      setSentAsEstimate(data.sent_as_estimate || 0);
      setPurchasedInstalled(data.purchased_installed || 0);
      setWarrantyVisits(data.warranty_visits || 0);
      setWarrantyRepaired(data.warranty_repaired || 0);
      setRecallsActive(data.recalls_active || "None");
    }
    setLoading(false);
  };

  const fetchPurchaseOrders = async () => {
    setPoLoading(true);
    const { data, error } = await supabase
      .from("product_purchase_orders")
      .select("*")
      .eq("product_id", productId)
      .order("purchase_date", { ascending: false }) as any;
    if (!error) setPurchaseOrders(data || []);
    setPoLoading(false);
  };

  const handleSaveActivity = async () => {
    setSaving(true);
    try {
      const payload: any = {
        product_id: productId,
        page_visits: pageVisits,
        enquiries,
        downloads,
        other_page_views: otherPageViews,
        sent_as_estimate: sentAsEstimate,
        purchased_installed: purchasedInstalled,
        warranty_visits: warrantyVisits,
        warranty_repaired: warrantyRepaired,
        recalls_active: recallsActive,
      };
      if (activityId) {
        await supabase.from("product_activity_history").update(payload).eq("id", activityId) as any;
      } else {
        const { data } = await supabase.from("product_activity_history").insert(payload).select().single() as any;
        if (data) setActivityId(data.id);
      }
      toast({ title: "Saved", description: "Activity history updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetPoForm = () => {
    setPoPartNumber(""); setPoPurchaseDate(""); setPoCustomerId("");
    setPoPurchaseType("purchased"); setPoVendorId(""); setPoNumber("");
    setPoReceiptUrl(""); setPoTechId(""); setPoNotes(""); setEditingPoId(null);
  };

  const openAddPo = () => { resetPoForm(); setPoDialogOpen(true); };

  const openEditPo = (po: any) => {
    setEditingPoId(po.id);
    setPoPartNumber(po.manufacture_part_number || "");
    setPoPurchaseDate(po.purchase_date || "");
    setPoCustomerId(po.customer_id_info || "");
    setPoPurchaseType(po.purchase_type || "purchased");
    setPoVendorId(po.vendor_id_number || "");
    setPoNumber(po.po_number || "");
    setPoReceiptUrl(po.receipt_scan_url || "");
    setPoTechId(po.tech_id || "");
    setPoNotes(po.notes || "");
    setPoDialogOpen(true);
  };

  const handleSavePo = async () => {
    setPoSubmitting(true);
    try {
      const payload: any = {
        product_id: productId,
        manufacture_part_number: poPartNumber,
        purchase_date: poPurchaseDate || null,
        customer_id_info: poCustomerId,
        purchase_type: poPurchaseType,
        vendor_id_number: poVendorId,
        po_number: poNumber,
        receipt_scan_url: poReceiptUrl,
        tech_id: poTechId,
        notes: poNotes,
      };
      if (editingPoId) {
        await supabase.from("product_purchase_orders").update(payload).eq("id", editingPoId) as any;
        toast({ title: "Updated", description: "Purchase order updated." });
      } else {
        await supabase.from("product_purchase_orders").insert(payload) as any;
        toast({ title: "Added", description: "Purchase order added." });
      }
      setPoDialogOpen(false);
      resetPoForm();
      fetchPurchaseOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPoSubmitting(false);
    }
  };

  const handleDeletePo = async (id: string) => {
    if (!confirm("Delete this purchase order?")) return;
    await supabase.from("product_purchase_orders").delete().eq("id", id) as any;
    fetchPurchaseOrders();
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Website Activity */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Website Activity</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "Consumer Page Visits", value: pageVisits, set: setPageVisits },
            { label: "Enquired on by Site Visitor", value: enquiries, set: setEnquiries },
            { label: "Downloaded Listing Packet", value: downloads, set: setDownloads },
            { label: "Other Pages/URLs Shown On", value: otherPageViews, set: setOtherPageViews },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex justify-between items-center p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">{label}</span>
              <Input type="number" className="w-24 text-right" value={value} onChange={(e) => set(parseInt(e.target.value) || 0)} />
            </div>
          ))}
        </div>
      </div>

      {/* Field Activity */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Field Activity</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "Sent as Estimate", value: sentAsEstimate, set: setSentAsEstimate },
            { label: "Purchased and Installed", value: purchasedInstalled, set: setPurchasedInstalled },
            { label: "Warranty Visits", value: warrantyVisits, set: setWarrantyVisits },
            { label: "Warranty Repaired", value: warrantyRepaired, set: setWarrantyRepaired },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex justify-between items-center p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">{label}</span>
              <Input type="number" className="w-24 text-right" value={value} onChange={(e) => set(parseInt(e.target.value) || 0)} />
            </div>
          ))}
          <div className="flex justify-between items-center p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">Recalls Active</span>
            <Input className="w-40 text-right" value={recallsActive} onChange={(e) => setRecallsActive(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveActivity} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Activity
          </Button>
        </div>
      </div>

      {/* Parts Purchase Order & Inventory Use History */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Parts Purchase Order &amp; Inventory Use History</h3>
          <Button size="sm" onClick={openAddPo}>
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
        </div>

        {poLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : purchaseOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No purchase orders recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part #</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Customer ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vendor ID</TableHead>
                <TableHead>PO #</TableHead>
                <TableHead>Tech ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-sm">{po.manufacture_part_number || "—"}</TableCell>
                  <TableCell>{po.purchase_date ? new Date(po.purchase_date).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{po.customer_id_info || "—"}</TableCell>
                  <TableCell className="capitalize">{po.purchase_type || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{po.vendor_id_number || "—"}</TableCell>
                  <TableCell>{po.po_number || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{po.tech_id || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEditPo(po)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeletePo(po.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* PO Add/Edit Dialog */}
      <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPoId ? "Edit Purchase Order" : "Add Purchase Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacture Part Number</Label>
                <Input value={poPartNumber} onChange={(e) => setPoPartNumber(e.target.value)} placeholder="N/A" />
              </div>
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input type="date" value={poPurchaseDate} onChange={(e) => setPoPurchaseDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer ID Information</Label>
                <Input value={poCustomerId} onChange={(e) => setPoCustomerId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Purchase Type</Label>
                <Select value={poPurchaseType} onValueChange={setPoPurchaseType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchased">Purchased</SelectItem>
                    <SelectItem value="inventory_stock">Inventory Stock Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor ID Number</Label>
                <Input value={poVendorId} onChange={(e) => setPoVendorId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>P.O Number</Label>
                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Receipt Scan URL</Label>
              <div className="flex gap-2">
                <Input value={poReceiptUrl} onChange={(e) => setPoReceiptUrl(e.target.value)} placeholder="File URL" readOnly className="flex-1" />
                <Button type="button" variant="outline" onClick={() => setReceiptPickerOpen(true)}>Browse</Button>
              </div>
              <FileManagerPicker
                open={receiptPickerOpen}
                onOpenChange={setReceiptPickerOpen}
                onSelect={(url) => { setPoReceiptUrl(url); setReceiptPickerOpen(false); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Tech ID</Label>
              <Input value={poTechId} onChange={(e) => setPoTechId(e.target.value)} placeholder="e.g. 123.45.6789" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={poNotes} onChange={(e) => setPoNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePo} disabled={poSubmitting}>
              {poSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPoId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductActivityHistoryTab;
