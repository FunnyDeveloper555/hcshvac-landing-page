import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CustomerLite, CustomerPicker, customerAddress, customerLabel } from "./WorkItemFields";
import {
  Attachment,
  AttachmentsField,
  CompanySelect,
  ForType,
  ForTypeRadio,
  VendorLite,
  VendorPicker,
  loadVendor,
  toAttachments,
  useCompanyOptions,
  vendorContact,
} from "./WorkItemExtras";
import { WorkItemKind, formatPhone } from "./workItems";

export interface WhoFor {
  company_id: string;
  for_type: ForType;
  customer: CustomerLite | null;
  vendor: VendorLite | null;
  location: string;
  public_notes: string;
  private_notes: string;
  attachments: Attachment[];
  create_appointment: boolean;
  appointment_id: string | null;
}

export const emptyWhoFor = (for_type: ForType): WhoFor => ({
  company_id: "",
  for_type,
  customer: null,
  vendor: null,
  location: "",
  public_notes: "",
  private_notes: "",
  attachments: [],
  create_appointment: false,
  appointment_id: null,
});

/** Fill WhoFor from a saved ticket/task row. */
export async function whoForFromRow(row: Record<string, any>, customer: CustomerLite | null): Promise<WhoFor> {
  return {
    company_id: row.company_id || "",
    for_type: (row.for_type as ForType) || "employee",
    customer,
    vendor: row.vendor_id ? await loadVendor(row.vendor_id) : null,
    location: row.location || "",
    public_notes: row.public_notes || "",
    private_notes: row.notes || "",
    attachments: toAttachments(row.attachments),
    create_appointment: false,
    appointment_id: row.appointment_id || null,
  };
}

/** Columns shared by tickets and tasks. */
export function whoForPayload(w: WhoFor) {
  const c = w.for_type === "customer" ? w.customer : w.customer; // customer may be attached to any type
  const v = w.for_type === "vendor" ? w.vendor : null;
  return {
    company_id: w.company_id || null,
    for_type: w.for_type,
    customer_id: c?.id || null,
    customer_name: c ? customerLabel(c) : null,
    vendor_id: v?.id || null,
    vendor_name: v?.vendor_name || null,
    location:
      w.location ||
      (w.for_type === "customer" && c ? customerAddress(c) : w.for_type === "vendor" && v ? v.vendor_address : null) ||
      null,
    public_notes: w.public_notes || null,
    notes: w.private_notes || null,
    attachments: w.attachments as unknown as never,
  };
}

/** Create the customer's real appointment for a ticket/task that visits them. Returns the appointment id. */
export async function createCustomerAppointment(opts: {
  w: WhoFor;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  calendar_id: string;
  team: unknown;
  lead_id: string | null;
}) {
  const c = opts.w.customer;
  if (!c || !opts.scheduled_date) return null;
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      company_id: opts.w.company_id || null,
      customer_name: customerLabel(c),
      customer_phone: formatPhone(c.phone) || "N/A",
      customer_email: c.email || null,
      customer_address: customerAddress(c),
      scheduled_date: opts.scheduled_date,
      scheduled_time: opts.scheduled_time || "9 AM to 11 AM",
      duration_minutes: opts.duration_minutes,
      visit_type: opts.title,
      notes: opts.w.public_notes || null,
      calendar_id: opts.calendar_id || null,
      assigned_team: opts.team as never,
      assigned_employee_id: opts.lead_id,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export function WhoForCard({
  kind,
  value,
  onChange,
  hasSchedule,
}: {
  kind: WorkItemKind;
  value: WhoFor;
  onChange: (w: WhoFor) => void;
  hasSchedule: boolean;
}) {
  const set = <K extends keyof WhoFor>(k: K, v: WhoFor[K]) => onChange({ ...value, [k]: v });
  const { data: companies } = useCompanyOptions();
  const company = (companies || []).find((c) => c.id === value.company_id);
  const companyLocation = company
    ? [company.company_address, company.company_city, [company.company_state, company.company_zip_code].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Who is this for?</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <CompanySelect value={value.company_id} onChange={(v) => set("company_id", v)} />
        <ForTypeRadio value={value.for_type} onChange={(v) => set("for_type", v)} />

        {value.for_type === "customer" && (
          <div className="md:col-span-2 space-y-2">
            <Label>Customer *</Label>
            <CustomerPicker
              selected={value.customer}
              onSelect={(c) => onChange({ ...value, customer: c, location: customerAddress(c) })}
              onClear={() => onChange({ ...value, customer: null })}
            />
            {!value.appointment_id ? (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Also book the customer's appointment</Label>
                  <p className="text-xs text-muted-foreground">
                    {hasSchedule
                      ? "Creates a real appointment at this address using the title and public notes."
                      : "Set a scheduled date below to book an appointment."}
                  </p>
                </div>
                <Switch
                  disabled={!hasSchedule || !value.customer}
                  checked={value.create_appointment}
                  onCheckedChange={(v) => set("create_appointment", v)}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">A customer appointment is linked to this {kind}.</p>
            )}
          </div>
        )}

        {value.for_type === "vendor" && (
          <div className="md:col-span-2 space-y-2">
            <Label>Vendor *</Label>
            <VendorPicker
              selected={value.vendor}
              onSelect={(v) => onChange({ ...value, vendor: v, location: v.vendor_address || value.location })}
              onClear={() => onChange({ ...value, vendor: null })}
            />
          </div>
        )}

        {value.for_type === "employee" && (
          <div className="md:col-span-2 space-y-2">
            <Label>Related customer (optional)</Label>
            <CustomerPicker
              selected={value.customer}
              onSelect={(c) => set("customer", c)}
              onClear={() => set("customer", null)}
            />
          </div>
        )}

        <div className="md:col-span-2">
          <Label htmlFor="wf-location">Location</Label>
          <Input
            id="wf-location"
            value={value.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder={
              value.for_type === "other" ? "Type the address or place" : "Address or place (filled in automatically when possible)"
            }
          />
          {companyLocation && !value.location && (
            <button
              type="button"
              className="mt-1 text-xs text-primary underline"
              onClick={() => set("location", companyLocation)}
            >
              Use company location: {companyLocation}
            </button>
          )}
          {value.for_type === "vendor" && value.vendor && (
            <p className="mt-1 text-xs text-muted-foreground">{vendorContact(value.vendor)}</p>
          )}
        </div>

        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="wf-public">Public Notes</Label>
            <Textarea
              id="wf-public"
              rows={4}
              value={value.public_notes}
              onChange={(e) => set("public_notes", e.target.value)}
              placeholder="Shared with the customer (shown on their appointment)"
            />
          </div>
          <div>
            <Label htmlFor="wf-private">Private Notes</Label>
            <Textarea
              id="wf-private"
              rows={4}
              value={value.private_notes}
              onChange={(e) => set("private_notes", e.target.value)}
              placeholder="Staff only"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <AttachmentsField kind={kind} value={value.attachments} onChange={(a) => set("attachments", a)} />
        </div>
      </CardContent>
    </Card>
  );
}
