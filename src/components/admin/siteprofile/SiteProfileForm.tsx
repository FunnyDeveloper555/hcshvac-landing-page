import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, ChevronLeft, FileDown } from "lucide-react";
import SystemCard, { SystemKind, SystemRow } from "./SystemCard";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCompanyInviterEmail } from "@/lib/companyEmail";

interface SystemDbRow {
  id: string;
  profile_id: string;
  system_kind: SystemKind;
  sort_order: number;
  data: Record<string, any>;
}

export default function SiteProfileForm() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const urlProfileId = sp.get("id");
  const customerId = sp.get("customerId");
  const appointmentId = sp.get("appointmentId");

  const [profileId, setProfileId] = useState<string | null>(urlProfileId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    session_id: "",
    report_number: "",
    job_number: "",
    booking_method: "",
    location_type: "residential",
    mdu: false,
    visit_type: "",
    equipment_type: "",
    equipment_location: "",
    ticket_status: "ACTIVE",
    customer_deemed_status: "ACTIVE",
    notes: "",
    status: "draft",
    bill_to: {},
    ship_to: {},
    primary_contact: {},
    secondary_contact: {},
    customer_id: customerId,
    appointment_id: appointmentId,
    created_by: null,
  });
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [assignedCompanyId, setAssignedCompanyId] = useState<string | null>(null);
  const [assignedToId, setAssignedToId] = useState<string | null>(null);
  const [completedByName, setCompletedByName] = useState<string>("");


  // Load / create profile
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: co }, { data: emp }] = await Promise.all([
          supabase.from("companies").select("id, name").order("name"),
          supabase.from("employees").select("id, first_name, last_name").order("first_name"),
        ]);
        setCompanies(co || []);
        setEmployees(emp || []);

        let pid = urlProfileId;
        let resolvedCustomerId = customerId;

        if (!pid && !resolvedCustomerId && appointmentId) {
          const { data: appt } = await supabase
            .from("appointments")
            .select("customer_phone")
            .eq("id", appointmentId)
            .maybeSingle();
          if (appt?.customer_phone) {
            const digits = appt.customer_phone.replace(/\D/g, "").slice(-10);
            const { data: matches } = await supabase
              .from("customer_registrations")
              .select("id, phone")
              .limit(50);
            const found = (matches || []).find(
              (m: any) => (m.phone || "").replace(/\D/g, "").slice(-10) === digits
            );
            if (found) resolvedCustomerId = found.id;
          }
        }

        if (!pid && resolvedCustomerId) {
          const { data: cust } = await supabase
            .from("customer_registrations")
            .select("*")
            .eq("id", resolvedCustomerId)
            .maybeSingle();

          const bill_to = cust
            ? {
                name: `${cust.bill_to_first_name || ""} ${cust.bill_to_last_name || ""}`.trim(),
                business_name: cust.bill_to_business_name || "",
                address: cust.bill_to_address || "",
                city: cust.bill_to_city || "",
                state: cust.bill_to_state || "",
                zip: cust.bill_to_zip_code || "",
                phone: cust.business_phone || cust.phone || "",
                email: cust.email || "",
              }
            : {};
          const ship_to = cust
            ? {
                name: `${cust.ship_to_first_name || ""} ${cust.ship_to_last_name || ""}`.trim(),
                business_name: cust.ship_to_business_name || "",
                address: cust.ship_to_address || "",
                city: cust.ship_to_city || "",
                state: cust.ship_to_state || "",
                zip: cust.ship_to_zip_code || "",
                phone: cust.phone || "",
                email: cust.email || "",
              }
            : {};

          const { data: created, error } = await supabase
            .from("site_profiles")
            .insert({
              customer_id: resolvedCustomerId,
              appointment_id: appointmentId,
              location_type: cust?.location_type || "residential",
              bill_to,
              ship_to,
              primary_contact: {
                name: cust?.point_of_contact_name || "",
                phone: cust?.point_of_contact_phone || "",
                email: cust?.point_of_contact_email || "",
              },
              created_by: user?.id || null,
              session_id: `SP-${Date.now().toString(36).toUpperCase()}`,
              assigned_company_id: cust?.company_id || null,
            })
            .select("*")
            .single();
          if (error) throw error;
          pid = created.id;
          setProfileId(pid);
          setProfile({ ...created });
          setAssignedCompanyId(created.assigned_company_id || null);
          setAssignedToId(created.assigned_to || null);
        } else if (pid) {
          const { data: p } = await supabase.from("site_profiles").select("*").eq("id", pid).maybeSingle();
          if (p) {
            setProfile(p);
            setAssignedCompanyId(p.assigned_company_id || null);
            setAssignedToId(p.assigned_to || null);
          }
        }

        // Resolve completed_by (logged-in user) display name
        if (user?.id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("user_id", user.id)
            .maybeSingle();
          setCompletedByName(prof?.display_name || prof?.email || user.email || "");
        }

        if (pid) {
          const { data: rows } = await supabase
            .from("site_profile_systems")
            .select("*")
            .eq("profile_id", pid)
            .order("sort_order");
          const mapped = (rows as SystemDbRow[] | null || []).map((r, i) => ({
            id: r.id,
            kind: r.system_kind,
            index: i + 1,
            data: r.data || {},
          }));
          setSystems(mapped);
        }

      } catch (e: any) {
        toast({ title: "Load failed", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSystem = async (kind: SystemKind) => {
    if (!profileId) return;
    const nextOrder = systems.length;
    const { data, error } = await supabase
      .from("site_profile_systems")
      .insert({ profile_id: profileId, system_kind: kind, sort_order: nextOrder, data: {} })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    const sameKindCount = systems.filter((s) => s.kind === kind).length + 1;
    setSystems([...systems, { id: data.id, kind, index: sameKindCount, data: {} }]);
  };

  const removeSystem = async (id: string) => {
    if (!confirm("Remove this system and all its photos?")) return;
    await supabase.from("site_profile_systems").delete().eq("id", id);
    setSystems(systems.filter((s) => s.id !== id));
  };

  const updateSystemData = async (id: string, data: Record<string, any>) => {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, data } : s)));
    await supabase.from("site_profile_systems").update({ data }).eq("id", id);
  };

  const saveProfile = async (newStatus?: string) => {
    if (!profileId) return;
    setSaving(true);
    try {
      // Session ID changes with every update (per spec)
      const nextSession = `SP-${Date.now().toString(36).toUpperCase()}`;
      const payload: any = {
        session_id: nextSession,
        job_number: profile.job_number,
        booking_method: profile.booking_method,
        location_type: profile.location_type,
        mdu: !!profile.mdu,
        visit_type: profile.visit_type,
        equipment_type: profile.equipment_type,
        equipment_location: profile.equipment_location,
        ticket_status: profile.ticket_status,
        customer_deemed_status: profile.customer_deemed_status,
        notes: profile.notes,
        assigned_company_id: assignedCompanyId,
        assigned_to: assignedToId,
      };
      if (newStatus) {
        payload.status = newStatus;
        if (newStatus === "submitted") payload.submitted_at = new Date().toISOString();
      }
      const { error } = await supabase.from("site_profiles").update(payload).eq("id", profileId);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, ...payload }));
      toast({ title: newStatus === "submitted" ? "Submitted" : "Saved" });
      if (newStatus === "submitted") navigate("/admin/site-profiles/list");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Missing customer. Open this form from a customer or appointment.
        </p>
        <Button variant="outline" className="mt-2" onClick={() => navigate("/admin/customers/list")}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold">Site Location Profile</h2>
            {profile.report_number && (
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {profile.report_number}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Session: {profile.session_id} · Status: {profile.status}
            {completedByName && <> · Completed By: <span className="font-medium">{completedByName}</span></>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={saving} onClick={() => saveProfile()}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Save Draft
          </Button>
          <Button size="sm" disabled={saving} onClick={() => saveProfile("submitted")}>Submit</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Report Header</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Report Number</Label>
            <Input className="h-8 text-xs font-mono" value={profile.report_number || "(auto)"} readOnly />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Session ID (auto-updates)</Label>
            <Input className="h-8 text-xs" value={profile.session_id || ""} readOnly />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Completed By</Label>
            <Input className="h-8 text-xs" value={completedByName} readOnly />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Job Number</Label>
            <Input className="h-8 text-xs" value={profile.job_number || ""} onChange={(e) => setProfile({ ...profile, job_number: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Assigned Company</Label>
            <Select value={assignedCompanyId || ""} onValueChange={(v) => setAssignedCompanyId(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Assigned To</Label>
            <Select value={assignedToId || ""} onValueChange={(v) => setAssignedToId(v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{`${e.first_name || ""} ${e.last_name || ""}`.trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Booking Method</Label>
            <Select value={profile.booking_method || ""} onValueChange={(v) => setProfile({ ...profile, booking_method: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Phone", "Web", "SMS", "Walk-in", "Referral", "Other"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Location Type</Label>
            <Select value={profile.location_type || ""} onValueChange={(v) => setProfile({ ...profile, location_type: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["residential", "commercial", "industrial", "educational"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">MDU (Multi-Dwelling)</Label>
            <Select value={profile.mdu ? "yes" : "no"} onValueChange={(v) => setProfile({ ...profile, mdu: v === "yes" })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Visit Type</Label>
            <Input className="h-8 text-xs" placeholder="e.g. No Heat SVC Call" value={profile.visit_type || ""} onChange={(e) => setProfile({ ...profile, visit_type: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Equipment Type</Label>
            <Input className="h-8 text-xs" placeholder="e.g. Furnace (Natural Gas)" value={profile.equipment_type || ""} onChange={(e) => setProfile({ ...profile, equipment_type: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Equipment Location</Label>
            <Input className="h-8 text-xs" placeholder="e.g. Basement" value={profile.equipment_location || ""} onChange={(e) => setProfile({ ...profile, equipment_location: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ticket Status</Label>
            <Select value={profile.ticket_status || "ACTIVE"} onValueChange={(v) => setProfile({ ...profile, ticket_status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["ACTIVE", "ON HOLD", "CLOSED", "CANCELLED"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Customer Deemed Status</Label>
            <Select value={profile.customer_deemed_status || "ACTIVE"} onValueChange={(v) => setProfile({ ...profile, customer_deemed_status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["ACTIVE", "ACTIVE Owes Balance", "SUSPENDED: Bad Review", "SUSPENDED: Owes Balance", "SUSPENDED: Need Information", "BLACKLISTED: See NOTES"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Systems on Site</CardTitle>
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="outline" type="button" onClick={() => addSystem("heating")}><Plus className="h-3 w-3 mr-1" />Heating</Button>
            <Button size="sm" variant="outline" type="button" onClick={() => addSystem("cooling")}><Plus className="h-3 w-3 mr-1" />Cooling</Button>
            <Button size="sm" variant="outline" type="button" onClick={() => addSystem("sump_pump")}><Plus className="h-3 w-3 mr-1" />Sump Pump</Button>
            <Button size="sm" variant="outline" type="button" onClick={() => addSystem("ejector_pump")}><Plus className="h-3 w-3 mr-1" />Ejector Pump</Button>
            <Button size="sm" variant="outline" type="button" onClick={() => addSystem("water_heater")}><Plus className="h-3 w-3 mr-1" />Water Heater</Button>

          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {systems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Add systems using the buttons above.
            </p>
          )}
          {systems.map((s) => (
            <SystemCard
              key={s.id}
              profileId={profileId}
              system={s}
              onChange={(data) => updateSystemData(s.id, data)}
              onDelete={() => removeSystem(s.id)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">General Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            className="text-xs min-h-[80px]"
            value={profile.notes || ""}
            onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
          />
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" disabled={saving} onClick={() => saveProfile()}>Save Draft</Button>
        <Button disabled={saving} onClick={() => saveProfile("submitted")}>Submit Profile</Button>
      </div>
    </div>
  );
}
