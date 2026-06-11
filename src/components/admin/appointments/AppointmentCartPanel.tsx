import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Plus, Trash2, Search, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminLog } from "@/hooks/useAdminLog";

interface Props {
  appointmentId: string;
  companyId: string;
  visitType: string;
  customerEmail?: string;
  customerName?: string;
}

export default function AppointmentCartPanel({ appointmentId, companyId, visitType, customerEmail, customerName }: Props) {
  const qc = useQueryClient();
  const { logAction } = useAdminLog();
  const [chargeLoading, setChargeLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get or create cart for appointment
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["appointment-cart", appointmentId],
    enabled: !!appointmentId,
    queryFn: async () => {
      let { data } = await supabase.from("appointment_carts" as any).select("*").eq("appointment_id", appointmentId).maybeSingle();
      if (!data) {
        const { data: created, error } = await supabase.from("appointment_carts" as any)
          .insert({ appointment_id: appointmentId }).select().single();
        if (error) throw error;
        data = created;
      }
      return data as any;
    },
  });

  const { data: items, refetch: refetchItems } = useQuery({
    queryKey: ["appointment-cart-items", cart?.id],
    enabled: !!cart?.id,
    queryFn: async () => {
      const { data } = await supabase.from("appointment_cart_items" as any)
        .select("*").eq("cart_id", cart!.id).order("display_order");
      return (data as any[]) || [];
    },
  });

  // Auto-add diagnostic fee when company + visit type are set and not already added
  useEffect(() => {
    if (!cart?.id || !companyId || !visitType || !items) return;
    const hasDiag = items.some(i => i.item_type === "diagnostic_fee");
    if (hasDiag) return;
    (async () => {
      // Look up fee: company-specific first, then global
      const { data: feeRows } = await supabase
        .from("diagnostic_fees" as any)
        .select("*")
        .eq("visit_type", visitType)
        .eq("is_active", true)
        .in("company_id", [companyId])
        .limit(1);
      let fee = feeRows?.[0] as any;
      if (!fee) {
        const { data: globalRows } = await supabase
          .from("diagnostic_fees" as any)
          .select("*")
          .eq("visit_type", visitType)
          .eq("is_active", true)
          .is("company_id", null)
          .limit(1);
        fee = globalRows?.[0] as any;
      }
      if (!fee) return;
      await supabase.from("appointment_cart_items" as any).insert({
        cart_id: cart.id,
        item_type: "diagnostic_fee",
        description: `Diagnostic Fee — ${visitType}`,
        qty: 1,
        unit_price: Number(fee.fee_amount),
        display_order: 0,
      });
      await refetchItems();
      qc.invalidateQueries({ queryKey: ["appointment-cart", appointmentId] });
    })();
  }, [cart?.id, companyId, visitType, items]);

  // Product search
  const { data: products } = useQuery({
    queryKey: ["products-cart-search", search],
    enabled: pickerOpen,
    queryFn: async () => {
      let q = supabase.from("products").select("id, name, sku, price").limit(30);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q;
      return (data as any[]) || [];
    },
  });

  const addProduct = async (p: any) => {
    await supabase.from("appointment_cart_items" as any).insert({
      cart_id: cart!.id,
      product_id: p.id,
      item_type: "product",
      description: p.name + (p.sku ? ` (${p.sku})` : ""),
      qty: 1,
      unit_price: Number(p.price || 0),
      display_order: (items?.length || 0) + 1,
    });
    await refetchItems();
    qc.invalidateQueries({ queryKey: ["appointment-cart", appointmentId] });
    setPickerOpen(false);
    setSearch("");
  };

  const addCustom = async () => {
    await supabase.from("appointment_cart_items" as any).insert({
      cart_id: cart!.id,
      item_type: "custom",
      description: "Custom line item",
      qty: 1,
      unit_price: 0,
      display_order: (items?.length || 0) + 1,
    });
    await refetchItems();
  };

  const updateItem = async (id: string, patch: any) => {
    await supabase.from("appointment_cart_items" as any).update(patch).eq("id", id);
    await refetchItems();
    qc.invalidateQueries({ queryKey: ["appointment-cart", appointmentId] });
  };

  const removeItem = async (id: string) => {
    await supabase.from("appointment_cart_items" as any).delete().eq("id", id);
    await refetchItems();
    qc.invalidateQueries({ queryKey: ["appointment-cart", appointmentId] });
  };

  const toggleWaive = async (item: any) => {
    const reason = !item.is_waived ? (prompt("Waiver reason:") || "").trim() : "";
    if (!item.is_waived && !reason) return;
    await updateItem(item.id, { is_waived: !item.is_waived, waiver_reason: reason || null });
    logAction("update", "appointment", appointmentId, { action: "waive_line", item_id: item.id, reason });
  };

  const charge = async () => {
    if (!cart || Number(cart.total) <= 0) {
      toast.error("Cart total must be greater than $0");
      return;
    }
    setChargeLoading(true);
    try {
      const lineItems = (items || [])
        .filter(i => !i.is_waived)
        .map(i => ({
          description: i.description,
          qty: Number(i.qty),
          unit_price: Number(i.unit_price),
        }));
      const { data, error } = await supabase.functions.invoke("create-appointment-checkout", {
        body: {
          appointment_id: appointmentId,
          cart_id: cart.id,
          customer_email: customerEmail,
          customer_name: customerName,
          line_items: lineItems,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Checkout opened in a new tab");
        logAction("update", "appointment", appointmentId, { action: "charge_initiated", total: Number(cart.total) });
      } else {
        throw new Error(data?.error || "No checkout URL returned");
      }
    } catch (e: any) {
      toast.error("Failed to start checkout: " + e.message);
    } finally {
      setChargeLoading(false);
    }
  };

  if (!appointmentId) return null;

  if (cartLoading) return (
    <Card><CardContent className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></CardContent></Card>
  );

  const paid = cart?.payment_status === "paid";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Cart / Invoice
          {paid && <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>}
          {!paid && cart && <Badge variant="outline">{cart.payment_status}</Badge>}
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
          <Button size="sm" variant="outline" onClick={addCustom}>
            <Plus className="w-4 h-4 mr-1" /> Custom Line
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Qty</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32">Unit Price</TableHead>
              <TableHead className="w-28 text-right">Subtotal</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map(i => (
              <TableRow key={i.id} className={i.is_waived ? "opacity-50" : ""}>
                <TableCell>
                  <Input type="number" min="0" step="1" value={i.qty} className="w-16"
                    onChange={e => updateItem(i.id, { qty: Number(e.target.value || 0) })} />
                </TableCell>
                <TableCell>
                  <Input value={i.description}
                    onChange={e => updateItem(i.id, { description: e.target.value })} />
                  {i.item_type === "diagnostic_fee" && <Badge variant="secondary" className="mt-1 text-xs">Diagnostic Fee</Badge>}
                  {i.waiver_reason && <p className="text-xs text-muted-foreground mt-1">Waived: {i.waiver_reason}</p>}
                </TableCell>
                <TableCell>
                  <Input type="number" min="0" step="0.01" value={i.unit_price} className="w-28"
                    onChange={e => updateItem(i.id, { unit_price: Number(e.target.value || 0) })} />
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${(Number(i.qty) * Number(i.unit_price)).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant={i.is_waived ? "default" : "outline"} onClick={() => toggleWaive(i)}>
                    {i.is_waived ? <X className="w-3 h-3" /> : "Waive"}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="destructive" onClick={() => removeItem(i.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!items?.length && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No items yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex justify-end">
          <div className="text-right space-y-1">
            <p className="text-sm">Subtotal: <span className="font-mono">${Number(cart?.subtotal || 0).toFixed(2)}</span></p>
            <p className="text-lg font-bold">Total: <span className="font-mono">${Number(cart?.total || 0).toFixed(2)}</span></p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={charge} disabled={chargeLoading || paid || !items?.length}>
            {chargeLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            {paid ? "Paid" : "Charge Customer"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Product / Service</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {products?.map(p => (
                <button key={p.id} className="w-full text-left p-3 rounded border hover:bg-muted flex justify-between"
                  onClick={() => addProduct(p)}>
                  <span>
                    <span className="font-medium">{p.name}</span>
                    {p.sku && <span className="text-xs text-muted-foreground ml-2">{p.sku}</span>}
                  </span>
                  <span className="font-mono">${Number(p.price || 0).toFixed(2)}</span>
                </button>
              ))}
              {!products?.length && <p className="text-center text-muted-foreground py-6 text-sm">No products found</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
