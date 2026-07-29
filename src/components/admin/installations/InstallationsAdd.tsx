import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Send } from "lucide-react";
import {
  CATEGORY_LABEL,
  INSTALL_PHOTO_SLOTS,
  ITEM_TYPES,
  InstallCategory,
  PICKUP_SLOTS,
  WARRANTY_YEARS,
  brandsFor,
  specFieldsFor,
} from "./installationOptions";
import PickupPhotoSlot from "./PickupPhotoSlot";

interface CustomerOpt { id: string; first: string; last: string; business?: string | null; account?: string | null; }
interface EmployeeOpt { id: string; first: string; last: string; }
interface AppointmentOpt { id: string; appointment_number?: string | null; scheduled_date?: string | null; }
interface VendorOpt { id: string; name: string; }

interface Item {
  id?: string;
  _new?: boolean;
  category: InstallCategory;
  item_type: string;
  brand_name: string;
  model_number: string;
  serial_number: string;
  labor_warranty_years: number;
  equipment_warranty_years: number;
  notes: string;
  spec: Record<string, string>;
}

const emptyItem = (): Item => ({
  _new: true,
  category: "residential_hvac",
  item_type: "Coil",
  brand_name: "",
  model_number: "",
  serial_number: "",
  labor_warranty_years: 0,
  equipment_warranty_years: 0,
  notes: "",
  spec: {},
});

export default function InstallationsAdd() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editJobId = params.get("jobId");
  const legacyItemId = params.get("id"); // legacy single-record edit
  const preselectCustomer = params.get("customerId") || "";
  const preselectAppointment = params.get("appointmentId") || "";

  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [appointments, setAppointments] = useState<AppointmentOpt[]>([]);
  const [vendors, setVendors] = useState<VendorOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState<string | null>(editJobId);

  const [job, setJob] = useState({
    customer_id: preselectCustomer,
    appointment_id: preselectAppointment,
    supply_vendor_id: "",
    completed_by_employee_id: "",
    install_date: new Date().toISOString().slice(0, 10),
  });

  const [items, setItems] = useState<Item[]>([emptyItem()]);

  useEffect(() => {
    (async () => {
      const [c, e, v] = await Promise.all([
        supabase
          .from("customer_registrations")
          .select("id, ship_to_first_name, ship_to_last_name, ship_to_business_name, account_number")
          .order("created_at", { ascending: false }).limit(500),
        supabase.from("employees").select("id, first_name, last_name").order("first_name"),
        supabase.from("vendors").select("id, vendor_name").order("vendor_name"),
      ]);
      setCustomers((c.data || []).map((r: any) => ({
        id: r.id, first: r.ship_to_first_name || "", last: r.ship_to_last_name || "",
        business: r.ship_to_business_name, account: r.account_number,
      })));
      setEmployees((e.data || []).map((r: any) => ({ id: r.id, first: r.first_name || "", last: r.last_name || "" })));
      setVendors((v.data || []).map((r: any) => ({ id: r.id, name: r.vendor_name })));
    })();
  }, []);

  useEffect(() => {
    if (!job.customer_id) { setAppointments([]); return; }
    const cust = customers.find((c) => c.id === job.customer_id);
    if (!cust) return;
    const fullName = `${cust.first} ${cust.last}`.trim();
    supabase
      .from("appointments")
      .select("id, appointment_number, scheduled_date")
      .eq("customer_name", fullName)
      .order("scheduled_date", { ascending: false }).limit(50)
      .then(({ data }) => setAppointments((data as AppointmentOpt[]) || []));
  }, [job.customer_id, customers]);

  useEffect(() => {
    if (!editJobId && !legacyItemId) return;
    setLoading(true);
    (async () => {
      // Legacy: single record without job — auto-adopt into a fresh job or standalone edit
      if (!editJobId && legacyItemId) {
        const { data: r } = await supabase
          .from("installation_records").select("*").eq("id", legacyItemId).single();
        if (r) {
          if (r.job_id) {
            // has a job — redirect via state
            setJobId(r.job_id);
            const [{ data: j }, { data: its }] = await Promise.all([
              supabase.from("installation_jobs").select("*").eq("id", r.job_id).single(),
              supabase.from("installation_records").select("*").eq("job_id", r.job_id).order("created_at"),
            ]);
            if (j) setJob({
              customer_id: j.customer_id || "",
              appointment_id: j.appointment_id || "",
              supply_vendor_id: j.supply_vendor_id || "",
              completed_by_employee_id: j.completed_by_employee_id || "",
              install_date: j.install_date || new Date().toISOString().slice(0, 10),
            });
            if (its && its.length) setItems(its.map(mapRow));
          } else {
            setJob({
              customer_id: r.customer_id || "",
              appointment_id: r.appointment_id || "",
              supply_vendor_id: "",
              completed_by_employee_id: r.completed_by_employee_id || "",
              install_date: r.install_date || new Date().toISOString().slice(0, 10),
            });
            setItems([mapRow(r)]);
          }
        }
        setLoading(false);
        return;
      }
      const [{ data: j }, { data: its }] = await Promise.all([
        supabase.from("installation_jobs").select("*").eq("id", editJobId).single(),
        supabase.from("installation_records").select("*").eq("job_id", editJobId).order("created_at"),
      ]);
      if (j) {
        setJob({
          customer_id: j.customer_id || "",
          appointment_id: j.appointment_id || "",
          supply_vendor_id: j.supply_vendor_id || "",
          completed_by_employee_id: j.completed_by_employee_id || "",
          install_date: j.install_date || new Date().toISOString().slice(0, 10),
        });
      }
      if (its && its.length) setItems(its.map(mapRow));
      setLoading(false);
    })();
  }, [editJobId, legacyItemId]);

  function mapRow(r: any): Item {
    return {
      id: r.id,
      category: r.category,
      item_type: r.item_type,
      brand_name: r.brand_name || "",
      model_number: r.model_number || "",
      serial_number: r.serial_number || "",
      labor_warranty_years: r.labor_warranty_years || 0,
      equipment_warranty_years: r.equipment_warranty_years || 0,
      notes: r.notes || "",
      spec: (r.spec && typeof r.spec === "object") ? r.spec : {},
    };
  }

  function updateItem(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }

  function changeCategory(i: number, cat: InstallCategory) {
    const types = ITEM_TYPES[cat];
    setItems((prev) => prev.map((it, idx) => idx === i
      ? { ...it, category: cat, item_type: types.includes(it.item_type) ? it.item_type : types[0] }
      : it));
  }

  async function saveJob(): Promise<string | null> {
    if (!job.customer_id) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return null;
    }
    const emp = employees.find((e) => e.id === job.completed_by_employee_id);
    const payload = {
      customer_id: job.customer_id,
      appointment_id: job.appointment_id || null,
      supply_vendor_id: job.supply_vendor_id || null,
      completed_by_employee_id: job.completed_by_employee_id || null,
      completed_by_name: emp ? `${emp.first} ${emp.last}`.trim() : null,
      install_date: job.install_date || null,
    };
    let id = jobId;
    if (id) {
      const { error } = await supabase.from("installation_jobs").update(payload).eq("id", id);
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return null; }
    } else {
      const { data, error } = await supabase.from("installation_jobs").insert(payload).select("id").single();
      if (error || !data) { toast({ title: "Save failed", description: error?.message, variant: "destructive" }); return null; }
      id = data.id; setJobId(id);
    }

    // Upsert items
    for (const it of items) {
      const itemPayload = {
        job_id: id,
        customer_id: job.customer_id,
        appointment_id: job.appointment_id || null,
        completed_by_employee_id: job.completed_by_employee_id || null,
        completed_by_name: emp ? `${emp.first} ${emp.last}`.trim() : null,
        install_date: job.install_date || null,
        category: it.category,
        item_type: it.item_type,
        brand_name: it.brand_name || null,
        model_number: it.model_number || null,
        serial_number: it.serial_number || null,
        labor_warranty_years: it.labor_warranty_years || null,
        equipment_warranty_years: it.equipment_warranty_years || null,
        notes: it.notes || null,
        spec: it.spec || {},
      };
      if (it.id) {
        await supabase.from("installation_records").update(itemPayload).eq("id", it.id);
      } else {
        const { data } = await supabase.from("installation_records").insert(itemPayload).select("id").single();
        if (data) it.id = data.id;
      }
    }
    setItems([...items]);
    return id;
  }

  async function handleSaveProgress() {
    setSaving(true);
    const id = await saveJob();
    setSaving(false);
    if (id) toast({ title: "Progress saved" });
  }

  async function handleDone() {
    setSaving(true);
    const id = await saveJob();
    setSaving(false);
    if (id) {
      toast({ title: editJobId ? "Installation updated" : "Installation saved" });
      navigate("/admin/installations/list");
    }
  }

  async function handleSendToCustomer() {
    const id = await saveJob();
    if (!id) return;
    if (!job.customer_id) return;
    const { data: cust } = await supabase
      .from("customer_registrations")
      .select("email, ship_to_first_name, ship_to_last_name, company_id")
      .eq("id", job.customer_id).single();
    if (!cust?.email) {
      toast({ title: "Customer has no email on file", variant: "destructive" });
      return;
    }
    const emp = employees.find((e) => e.id === job.completed_by_employee_id);
    let companyName: string | undefined;
    let fromEmail: string | undefined;
    if (cust.company_id) {
      const { data: co } = await supabase
        .from("companies").select("name, company_email_primary").eq("id", cust.company_id).single();
      companyName = co?.name;
      fromEmail = co?.company_email_primary || undefined;
    }
    const templateData = {
      customerName: `${cust.ship_to_first_name || ""} ${cust.ship_to_last_name || ""}`.trim(),
      companyName,
      installDate: job.install_date,
      completedBy: emp ? `${emp.first} ${emp.last}`.trim() : null,
      items: items.map((it) => ({
        category: it.category,
        item_type: it.item_type,
        brand_name: it.brand_name,
        model_number: it.model_number,
        serial_number: it.serial_number,
        labor_warranty_years: it.labor_warranty_years,
        equipment_warranty_years: it.equipment_warranty_years,
        spec: it.spec,
        notes: it.notes,
      })),
    };
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "installation-summary",
        recipientEmail: cust.email,
        templateData,
        fromEmail: fromEmail || "master@hcshvac.com",
        fromName: companyName || "HCS Inc.",
        bcc: ["master@hcshvac.com"],
      },
    });
    if (error) {
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Installation summary sent to customer" });
    }
  }

  async function removeItem(i: number) {
    const it = items[i];
    if (it.id) {
      if (!confirm("Delete this item?")) return;
      await supabase.from("installation_records").delete().eq("id", it.id);
    }
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{editJobId ? "Edit" : "Add"} Installation Job</h2>
        <p className="text-sm text-muted-foreground">
          Log equipment picked up from a supply vendor and installed at a customer site.
        </p>
      </div>

      {/* Assignment */}
      <Card>
        <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Customer *</Label>
            <Select value={job.customer_id}
              onValueChange={(v) => setJob({ ...job, customer_id: v, appointment_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.business ? `${c.business} — ` : ""}{c.first} {c.last} {c.account ? `(${c.account})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Appointment (optional)</Label>
            <Select value={job.appointment_id || "none"}
              onValueChange={(v) => setJob({ ...job, appointment_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select appointment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {appointments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.appointment_number || a.id.slice(0, 8)} {a.scheduled_date ? `— ${a.scheduled_date}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Supply Vendor</Label>
            <Select value={job.supply_vendor_id || "none"}
              onValueChange={(v) => setJob({ ...job, supply_vendor_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select supply house" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Completed By (Technician)</Label>
            <Select value={job.completed_by_employee_id}
              onValueChange={(v) => setJob({ ...job, completed_by_employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.first} {e.last}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Installation / Pickup Date</Label>
            <Input type="date" value={job.install_date}
              onChange={(e) => setJob({ ...job, install_date: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {items.map((it, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Equipment #{i + 1}</CardTitle>
            {items.length > 1 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i)}>
                <Trash2 className="w-4 h-4 mr-1 text-destructive" /> Remove
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Equipment Category *</Label>
              <Select value={it.category} onValueChange={(v) => changeCategory(i, v as InstallCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as InstallCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>{CATEGORY_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sub Category / Item Type *</Label>
              <Select value={it.item_type} onValueChange={(v) => updateItem(i, { item_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES[it.category].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brand Name</Label>
              <Input list={`brands-${i}`} value={it.brand_name}
                onChange={(e) => updateItem(i, { brand_name: e.target.value })}
                placeholder="Select or type brand" />
              <datalist id={`brands-${i}`}>
                {brandsFor(it.category).map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>
            <div />
            <div>
              <Label>Model Number</Label>
              <Input value={it.model_number} onChange={(e) => updateItem(i, { model_number: e.target.value })} />
            </div>
            <div>
              <Label>Serial Number</Label>
              <Input value={it.serial_number} onChange={(e) => updateItem(i, { serial_number: e.target.value })} />
            </div>
            <div>
              <Label>Years Labor Warranty</Label>
              <Select value={String(it.labor_warranty_years || 0)}
                onValueChange={(v) => updateItem(i, { labor_warranty_years: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {WARRANTY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Years Equipment Warranty</Label>
              <Select value={String(it.equipment_warranty_years || 0)}
                onValueChange={(v) => updateItem(i, { equipment_warranty_years: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  {WARRANTY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={it.notes} onChange={(e) => updateItem(i, { notes: e.target.value })} />
            </div>

            {/* On-Location Install Profile — Specs */}
            <div className="md:col-span-2 pt-3 border-t">
              <div className="text-sm font-medium mb-2">On-Location Install Profile — Specs</div>
              <div className="grid gap-3 md:grid-cols-2">
                {specFieldsFor(it.category, it.item_type).map((f) => (
                  <div key={f.key}>
                    <Label className="text-xs">{f.label}{f.suffix ? ` (${f.suffix})` : ""}</Label>
                    {f.type === "select" ? (
                      <Select
                        value={it.spec?.[f.key] || ""}
                        onValueChange={(v) => updateItem(i, { spec: { ...(it.spec || {}), [f.key]: v } })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {(f.options || []).map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : f.type === "textarea" ? (
                      <Textarea
                        rows={2}
                        value={it.spec?.[f.key] || ""}
                        onChange={(e) => updateItem(i, { spec: { ...(it.spec || {}), [f.key]: e.target.value } })}
                      />
                    ) : (
                      <Input
                        value={it.spec?.[f.key] || ""}
                        onChange={(e) => updateItem(i, { spec: { ...(it.spec || {}), [f.key]: e.target.value } })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* On-Location Install Photos */}
            <div className="md:col-span-2 pt-3 border-t">
              <div className="text-sm font-medium mb-2">On-Location Install Photos</div>
              {!it.id ? (
                <p className="text-xs text-muted-foreground">Save progress first to enable photo uploads for this item.</p>
              ) : (
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                  {INSTALL_PHOTO_SLOTS.map((s) => (
                    <PickupPhotoSlot
                      key={s.key}
                      jobId={jobId}
                      itemId={it.id}
                      phase="install"
                      slot={s.key}
                      label={s.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-start">
        <Button type="button" variant="outline" onClick={() => setItems([...items, emptyItem()])}>
          <Plus className="w-4 h-4 mr-1" /> Add Another Item
        </Button>
      </div>

      {/* Pickup / Delivery Package Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pickup / Delivery Package Photos</CardTitle>
          <p className="text-xs text-muted-foreground">
            Photos representing the condition of the package at time of pickup/delivery.
            {!jobId && " Save progress first to enable uploads."}
          </p>
        </CardHeader>
        <CardContent className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {PICKUP_SLOTS.map((s) => (
            <PickupPhotoSlot key={s.key} jobId={jobId} slot={s.key} label={s.label} />
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate("/admin/installations/list")}>Cancel</Button>
        <Button type="button" variant="outline" onClick={handleSendToCustomer} disabled={saving || !job.customer_id}>
          <Send className="w-4 h-4 mr-1" /> Send to Customer
        </Button>
        <Button variant="secondary" onClick={handleSaveProgress} disabled={saving}>
          {saving ? "Saving..." : "Save Progress"}
        </Button>
        <Button onClick={handleDone} disabled={saving}>
          {saving ? "Saving..." : editJobId ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );
}
