import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Send, Trash2, Truck } from "lucide-react";
import { Attachment, AttachmentsField, VendorPicker, VendorLite, toAttachments } from "./WorkItemExtras";

export const SOURCING_TYPES = [
  "P&A Part (Sourcing)",
  "P&A Part & G.C.A (Sourcing)",
  "Order Parts/Materials",
];
export const isSourcingType = (t: string) => SOURCING_TYPES.includes(t);
export const isGcaType = (t: string) => t === "P&A Part & G.C.A (Sourcing)";

export type SendMethod = "text" | "email" | "both";

export interface SourcingVendor {
  vendor_id: string;
  name: string;
  address: string;
  phone: string;
  sms: string;
  email: string;
  account_number: string;
  method: SendMethod;
  alt_sms: string;
  alt_email: string;
  price: string;
  availability: string;
  sent_at?: string | null;
}

export interface Sourcing {
  vendors: SourcingVendor[];
  message: string;
  include_task_photos: boolean;
  include_customer: boolean;
  media: Attachment[];
}

export const emptySourcing = (): Sourcing => ({
  vendors: [],
  message: "",
  include_task_photos: true,
  include_customer: true,
  media: [],
});

export const toSourcing = (v: unknown): Sourcing => {
  const s = (v && typeof v === "object" ? v : {}) as Partial<Sourcing>;
  return {
    ...emptySourcing(),
    ...s,
    vendors: Array.isArray(s.vendors) ? s.vendors : [],
    media: toAttachments(s.media),
  };
};

export interface QuoteState {
  quote_total: string;
  quote_status: string | null;
  quote_sent_at: string | null;
}

async function vendorRow(v: VendorLite): Promise<SourcingVendor> {
  const { data } = await supabase.from("vendors").select("our_account_number").eq("id", v.id).maybeSingle();
  return {
    vendor_id: v.id,
    name: v.vendor_name,
    address: v.vendor_address || "",
    phone: v.phone || "",
    sms: v.representative_phone || v.phone || "",
    email: v.representative_email || "",
    account_number: (data as { our_account_number?: string } | null)?.our_account_number || "",
    method: "both",
    alt_sms: "",
    alt_email: "",
    price: "",
    availability: "",
  };
}

const sumPrices = (vs: SourcingVendor[]) =>
  vs.reduce((t, v) => t + (parseFloat(String(v.price).replace(/[^\d.]/g, "")) || 0), 0);

export function SourcingCard({
  taskType,
  value,
  onChange,
  taskId,
  hasCustomer,
  quote,
  onQuoteChange,
  onBeforeSend,
}: {
  taskType: string;
  value: Sourcing;
  onChange: (s: Sourcing) => void;
  taskId: string | null;
  hasCustomer: boolean;
  quote: QuoteState;
  onQuoteChange: (q: QuoteState) => void;
  /** Saves the task first; returns its id. */
  onBeforeSend: () => Promise<string | null>;
}) {
  const [sending, setSending] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const gca = isGcaType(taskType);
  const setV = (i: number, patch: Partial<SourcingVendor>) =>
    onChange({ ...value, vendors: value.vendors.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });

  const addVendor = async (i: number, v: VendorLite) => {
    const row = await vendorRow(v);
    if (value.vendors.some((x, idx) => idx !== i && x.vendor_id === v.id)) {
      toast.error("That vendor is already on the list");
      return;
    }
    onChange({ ...value, vendors: value.vendors.map((x, idx) => (idx === i ? row : x)) });
  };

  const blank = (): SourcingVendor => ({
    vendor_id: "", name: "", address: "", phone: "", sms: "", email: "", account_number: "",
    method: "both", alt_sms: "", alt_email: "", price: "", availability: "",
  });

  const sendRfq = async () => {
    const ready = value.vendors.filter((v) => v.vendor_id);
    if (!ready.length) return toast.error("Add at least one vendor");
    if (!value.message.trim()) return toast.error("Type the message to the vendor");
    setSending(true);
    try {
      const id = await onBeforeSend();
      if (!id) return;
      const { data, error } = await supabase.functions.invoke("workitem-notify", {
        body: { item_type: "task", item_id: id, action: "rfq" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const ok = (data?.results || []).filter((r: { status: string }) => r.status === "sent").length;
      const failed = (data?.results || []).filter((r: { status: string }) => r.status !== "sent");
      if (ok) toast.success(`Sent to ${ok} vendor message${ok === 1 ? "" : "s"}`);
      if (failed.length) toast.error(`${failed.length} could not be sent: ${failed.map((f: { to: string }) => f.to).join(", ")}`);
      if (data?.sourcing) onChange(toSourcing(data.sourcing));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const sendQuote = async () => {
    const total = parseFloat(quote.quote_total);
    if (!total || total <= 0) return toast.error("Enter the total price for the customer");
    if (!hasCustomer) return toast.error("Pick the customer in 'Who is this for?' first");
    setQuoting(true);
    try {
      const id = await onBeforeSend();
      if (!id) return;
      const { data, error } = await supabase.functions.invoke("workitem-notify", {
        body: { item_type: "task", item_id: id, action: "quote", origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      onQuoteChange({ ...quote, quote_status: "pending", quote_sent_at: new Date().toISOString() });
      toast.success("Quote sent to the customer for approval");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setQuoting(false);
    }
  };

  const total = sumPrices(value.vendors);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4" /> Parts Sourcing — Vendors
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ask one or many vendors for price &amp; availability in one message.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {value.vendors.length === 0 && <p className="text-sm text-muted-foreground">No vendors added yet.</p>}
        {value.vendors.map((v, i) => (
          <div key={i} className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Vendor {i + 1}</span>
              <div className="flex items-center gap-2">
                {v.sent_at && <Badge variant="secondary">Sent {new Date(v.sent_at).toLocaleString()}</Badge>}
                <Button type="button" size="icon" variant="ghost" title="Remove vendor"
                  onClick={() => onChange({ ...value, vendors: value.vendors.filter((_, idx) => idx !== i) })}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <VendorPicker
              selected={v.vendor_id ? ({ id: v.vendor_id, vendor_name: v.name, vendor_address: v.address, phone: v.phone, representative_first_name: null, representative_last_name: null, representative_phone: v.sms, representative_email: v.email } as VendorLite) : null}
              onSelect={(vv) => addVendor(i, vv)}
              onClear={() => setV(i, blank())}
            />
            {v.vendor_id && (
              <>
                <div className="grid gap-x-4 gap-y-1 rounded bg-muted/40 p-2 text-xs sm:grid-cols-2">
                  <div><b>Address:</b> {v.address || "—"}</div>
                  <div><b>Phone:</b> {v.phone || "—"}</div>
                  <div><b>Text number:</b> {v.sms || "—"}</div>
                  <div><b>Email on file:</b> {v.email || "—"}</div>
                  <div className="sm:col-span-2"><b>Our account #:</b> {v.account_number || "— (not on file)"}</div>
                </div>
                <div>
                  <Label className="text-xs">Send message by</Label>
                  <RadioGroup value={v.method} onValueChange={(m) => setV(i, { method: m as SendMethod })} className="mt-1 flex gap-4">
                    {(["text", "email", "both"] as SendMethod[]).map((m) => (
                      <label key={m} className="flex items-center gap-1.5 text-sm capitalize">
                        <RadioGroupItem value={m} /> {m === "email" ? "E-mail" : m}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Alt text number</Label>
                    <Input value={v.alt_sms} onChange={(e) => setV(i, { alt_sms: e.target.value })} placeholder="Optional" />
                  </div>
                  <div>
                    <Label className="text-xs">Alt email</Label>
                    <Input type="email" value={v.alt_email} onChange={(e) => setV(i, { alt_email: e.target.value })} placeholder="Optional" />
                  </div>
                  <div>
                    <Label className="text-xs">Price quoted ($)</Label>
                    <Input inputMode="decimal" value={v.price} onChange={(e) => setV(i, { price: e.target.value })} placeholder="When vendor replies" />
                  </div>
                  <div>
                    <Label className="text-xs">Availability</Label>
                    <Input value={v.availability} onChange={(e) => setV(i, { availability: e.target.value })} placeholder="e.g. In stock, 2 days" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, vendors: [...value.vendors, blank()] })}>
          <Plus className="mr-1 h-4 w-4" /> Add another vendor
        </Button>

        <div>
          <Label>Message body to vendor</Label>
          <Textarea rows={4} value={value.message} onChange={(e) => onChange({ ...value, message: e.target.value })}
            placeholder="e.g. Need price & availability: Carrier condenser fan motor HC39GE466, qty 1" />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={value.include_task_photos} onCheckedChange={(c) => onChange({ ...value, include_task_photos: !!c })} />
            Include task photos &amp; videos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={value.include_customer} onCheckedChange={(c) => onChange({ ...value, include_customer: !!c })} />
            Add customer information (first name, last name, address, phone only)
          </label>
        </div>

        <AttachmentsField kind="task" value={value.media} onChange={(media) => onChange({ ...value, media })} />
        <p className="-mt-2 text-xs text-muted-foreground">Extra photos or videos just for the vendor message.</p>

        <Button type="button" onClick={sendRfq} disabled={sending}>
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send to vendors
        </Button>

        {gca && (
          <div className="space-y-3 rounded-md border border-primary/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Get Customer Approval</span>
              {quote.quote_status && (
                <Badge variant={quote.quote_status === "approved" ? "default" : quote.quote_status === "declined" ? "destructive" : "secondary"} className="capitalize">
                  {quote.quote_status === "pending" ? "Waiting for customer" : quote.quote_status}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-xs">Total price to customer ($)</Label>
                <Input inputMode="decimal" className="w-40" value={quote.quote_total}
                  onChange={(e) => onQuoteChange({ ...quote, quote_total: e.target.value })} />
              </div>
              {total > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onQuoteChange({ ...quote, quote_total: total.toFixed(2) })}>
                  Use vendor total (${total.toFixed(2)})
                </Button>
              )}
              <Button type="button" onClick={sendQuote} disabled={quoting}>
                {quoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {quote.quote_sent_at ? "Resend quote by text" : "Text quote to customer"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The customer gets a text with a link to approve or decline. Their answer shows here and in the Notes Log.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
