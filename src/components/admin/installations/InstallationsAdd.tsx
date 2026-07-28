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
import {
  CATEGORY_LABEL,
  HVAC_BRANDS,
  ITEM_TYPES,
  InstallCategory,
  PLUMBING_BRANDS,
  WARRANTY_YEARS,
} from "./installationOptions";

interface CustomerOpt { id: string; first: string; last: string; business?: string | null; account?: string | null; }
interface EmployeeOpt { id: string; first: string; last: string; }
interface AppointmentOpt { id: string; appointment_number?: string | null; scheduled_date?: string | null; }

export default function InstallationsAdd() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const preselectCustomer = params.get("customerId") || "";
  const preselectAppointment = params.get("appointmentId") || "";

  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [appointments, setAppointments] = useState<AppointmentOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_id: preselectCustomer,
    appointment_id: preselectAppointment,
    completed_by_employee_id: "",
    category: "residential_hvac" as InstallCategory,
    item_type: "Coil",
    install_date: new Date().toISOString().slice(0, 10),
    brand_name: "",
    model_number: "",
    serial_number: "",
    labor_warranty_years: 0,
    equipment_warranty_years: 0,
    notes: "",
  });

  const brandList = useMemo(
    () => (form.category === "plumbing" ? PLUMBING_BRANDS : HVAC_BRANDS),
    [form.category]
  );

  useEffect(() => {
    (async () => {
      const [c, e] = await Promise.all([
        supabase
          .from("customer_registrations")
          .select("id, ship_to_first_name, ship_to_last_name, ship_to_business_name, account_number")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("employees").select("id, first_name, last_name").order("first_name"),
      ]);
      setCustomers(
        (c.data || []).map((r: any) => ({
          id: r.id,
          first: r.ship_to_first_name || "",
          last: r.ship_to_last_name || "",
          business: r.ship_to_business_name,
          account: r.account_number,
        }))
      );
      setEmployees(
        (e.data || []).map((r: any) => ({ id: r.id, first: r.first_name || "", last: r.last_name || "" }))
      );
    })();
  }, []);

  useEffect(() => {
    if (!form.customer_id) { setAppointments([]); return; }
    const cust = customers.find((c) => c.id === form.customer_id);
    if (!cust) return;
    const fullName = `${cust.first} ${cust.last}`.trim();
    supabase
      .from("appointments")
      .select("id, appointment_number, scheduled_date")
      .eq("customer_name", fullName)
      .order("scheduled_date", { ascending: false })
      .limit(50)
      .then(({ data }) => setAppointments((data as AppointmentOpt[] | null) || []));
  }, [form.customer_id, customers]);

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    supabase
      .from("installation_records")
      .select("*")
      .eq("id", editId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            customer_id: data.customer_id || "",
            appointment_id: data.appointment_id || "",
            completed_by_employee_id: data.completed_by_employee_id || "",
            category: data.category as InstallCategory,
            item_type: data.item_type,
            install_date: data.install_date || "",
            brand_name: data.brand_name || "",
            model_number: data.model_number || "",
            serial_number: data.serial_number || "",
            labor_warranty_years: data.labor_warranty_years || 0,
            equipment_warranty_years: data.equipment_warranty_years || 0,
            notes: data.notes || "",
          });
        }
        setLoading(false);
      });
  }, [editId]);

  useEffect(() => {
    const types = ITEM_TYPES[form.category];
    if (!types.includes(form.item_type)) setForm((f) => ({ ...f, item_type: types[0] }));
  }, [form.category]); // eslint-disable-line

  async function handleSave() {
    if (!form.customer_id) {
      toast({ title: "Please select a customer", variant: "destructive" });
      return;
    }
    setSaving(true);
    const emp = employees.find((e) => e.id === form.completed_by_employee_id);
    const payload = {
      ...form,
      appointment_id: form.appointment_id || null,
      completed_by_employee_id: form.completed_by_employee_id || null,
      completed_by_name: emp ? `${emp.first} ${emp.last}`.trim() : null,
      install_date: form.install_date || null,
      labor_warranty_years: form.labor_warranty_years || null,
      equipment_warranty_years: form.equipment_warranty_years || null,
    };
    const { error } = editId
      ? await supabase.from("installation_records").update(payload).eq("id", editId)
      : await supabase.from("installation_records").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editId ? "Installation updated" : "Installation added" });
    navigate("/admin/installations/list");
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{editId ? "Edit" : "Add"} Installation Record</h2>
        <p className="text-sm text-muted-foreground">Track equipment installed at a customer site.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Customer *</Label>
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v, appointment_id: "" })}>
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
            <Select value={form.appointment_id || "none"} onValueChange={(v) => setForm({ ...form, appointment_id: v === "none" ? "" : v })}>
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
            <Label>Completed By (Technician)</Label>
            <Select value={form.completed_by_employee_id} onValueChange={(v) => setForm({ ...form, completed_by_employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.first} {e.last}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Installation Date</Label>
            <Input type="date" value={form.install_date} onChange={(e) => setForm({ ...form, install_date: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Equipment</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as InstallCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as InstallCategory[]).map((k) => (
                  <SelectItem key={k} value={k}>{CATEGORY_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Item Type *</Label>
            <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ITEM_TYPES[form.category].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand Name</Label>
            <Input
              list="install-brands"
              value={form.brand_name}
              onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
              placeholder="Select or type brand"
            />
            <datalist id="install-brands">
              {brandList.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>
          <div />
          <div>
            <Label>Model Number</Label>
            <Input value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })} />
          </div>
          <div>
            <Label>Serial Number</Label>
            <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Warranty</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Years Labor Warranty Given</Label>
            <Select
              value={String(form.labor_warranty_years || 0)}
              onValueChange={(v) => setForm({ ...form, labor_warranty_years: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {WARRANTY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Years Equipment Warranty</Label>
            <Select
              value={String(form.equipment_warranty_years || 0)}
              onValueChange={(v) => setForm({ ...form, equipment_warranty_years: Number(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {WARRANTY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate("/admin/installations/list")}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Save"}</Button>
      </div>
    </div>
  );
}
