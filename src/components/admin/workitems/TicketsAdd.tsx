import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WhoFor, WhoForCard, emptyWhoFor, whoForFromRow, whoForPayload, createCustomerAppointment } from "./WhoForCard";
import { RepliesThread } from "./WorkItemExtras";
import { useAdminLog } from "@/hooks/useAdminLog";
import {
  CustomerLite,
  CustomerPicker,
  TeamChecklist,
  customerAddress,
  customerLabel,
  useCalendarOptions,
  useEmployeeOptions,
} from "./WorkItemFields";
import {
  EmployeeOption,
  TICKET_PRIORITIES,
  TICKET_REASONS,
  TIME_SLOTS,
  TeamMember,
  WORK_ITEM_STATUSES,
  WorkItemStatus,
  formatPhone,
  notifyWorkItemTeam,
  syncWorkItemCalendar,
  toTeam,
} from "./workItems";

interface TicketForm {
  subject: string;
  reason: string;
  priority: string;
  notes: string;
  expected_completion_date: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: string;
  calendar_id: string;
  assigned_team: TeamMember[];
  status: WorkItemStatus;
  send_sms_reminder: boolean;
}

const initialForm: TicketForm = {
  subject: "",
  reason: "",
  priority: "normal",
  notes: "",
  expected_completion_date: "",
  scheduled_date: "",
  scheduled_time: "",
  duration_minutes: "60",
  calendar_id: "",
  assigned_team: [],
  status: "open",
  send_sms_reminder: true,
};

export default function TicketsAdd() {
  const [form, setForm] = useState<TicketForm>(initialForm);
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [who, setWho] = useState<WhoFor>(emptyWhoFor("customer"));
  const [rowCache, setRowCache] = useState<Record<string, any> | null>(null);
  useEffect(() => {
    if (customer && !who.customer) setWho((w) => ({ ...w, customer, location: w.location || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);
  useEffect(() => {
    if (!rowCache) return;
    whoForFromRow(rowCache, customer).then(setWho);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCache, customer]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState<{ name: string | null; at: string | null }>({ name: null, at: null });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { user } = useAuth();
  const { logAction } = useAdminLog();

  const { data: employees } = useEmployeeOptions();
  const { data: calendars } = useCalendarOptions();

  const set = <K extends keyof TicketForm>(key: K, value: TicketForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!editId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("tickets").select("*").eq("id", editId).maybeSingle();
      if (error || !data) {
        toast.error("Could not load that ticket");
        navigate("/admin/tickets/list");
      } else {
        setTicketNumber(data.ticket_number);
        setCreatedBy({ name: data.created_by_name, at: data.created_at });
        setRowCache(data as Record<string, any>);
        setForm({
          subject: data.subject || "",
          reason: data.reason || "",
          priority: data.priority || "normal",
          notes: data.notes || "",
          expected_completion_date: data.expected_completion_date || "",
          scheduled_date: data.scheduled_date || "",
          scheduled_time: data.scheduled_time || "",
          duration_minutes: String(data.duration_minutes ?? 60),
          calendar_id: data.calendar_id || "",
          assigned_team: toTeam(data.assigned_team),
          status: (data.status as WorkItemStatus) || "open",
          send_sms_reminder: data.send_sms_reminder !== false,
        });
        if (data.customer_id) {
          const { data: c } = await supabase
            .from("customer_registrations")
            .select(
              "id, account_number, ship_to_first_name, ship_to_last_name, ship_to_business_name, ship_to_address, ship_to_city, ship_to_state, ship_to_zip_code, email, phone",
            )
            .eq("id", data.customer_id)
            .maybeSingle();
          if (c) setCustomer(c as CustomerLite);
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Opening from a customer page pre-selects that customer.
  const preselect = searchParams.get("customerId");
  useEffect(() => {
    if (!preselect || isEditing || customer) return;
    (async () => {
      const { data } = await supabase
        .from("customer_registrations")
        .select(
          "id, account_number, ship_to_first_name, ship_to_last_name, ship_to_business_name, ship_to_address, ship_to_city, ship_to_state, ship_to_zip_code, email, phone",
        )
        .eq("id", preselect)
        .maybeSingle();
      if (data) setCustomer(data as CustomerLite);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselect, isEditing]);

  const toggleTeamMember = (emp: EmployeeOption, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      assigned_team: checked
        ? [
            ...prev.assigned_team,
            {
              id: emp.id,
              name: `${emp.first_name} ${emp.last_name}`.trim(),
              phone: emp.phone_number || "",
              email: emp.email_address || "",
            },
          ]
        : prev.assigned_team.filter((m) => m.id !== emp.id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) {
      toast.error("Add a short subject for the ticket");
      return;
    }
    if (form.assigned_team.length === 0) {
      toast.error("Assign at least one staff member");
      return;
    }

    if (who.for_type === "customer" && !who.customer) {
      toast.error("Pick the customer");
      return;
    }
    if (who.for_type === "vendor" && !who.vendor) {
      toast.error("Pick the vendor");
      return;
    }

    setSaving(true);
    const payload = {
      customer_phone: who.customer ? formatPhone(who.customer.phone) : null,
      subject: form.subject.trim(),
      reason: form.reason || null,
      priority: form.priority,
      expected_completion_date: form.expected_completion_date || null,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      duration_minutes: Number(form.duration_minutes) || 60,
      calendar_id: form.calendar_id || null,
      assigned_team: form.assigned_team as unknown as never,
      assigned_employee_id: form.assigned_team[0]?.id || null,
      ...whoForPayload(who),
      status: form.status,
      send_sms_reminder: form.send_sms_reminder,
      completed_at: form.status === "completed" ? new Date().toISOString() : null,
    };

    try {
      let id = editId;
      if (isEditing) {
        const { error } = await supabase.from("tickets").update(payload).eq("id", editId!);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("tickets")
          .insert({ ...payload, created_by: user?.id || null, created_by_name: user?.email || null })
          .select("id, ticket_number")
          .single();
        if (error) throw error;
        id = data.id;
        setTicketNumber(data.ticket_number);
      }

      if (id && who.for_type === "customer" && who.create_appointment && !who.appointment_id && form.scheduled_date) {
        try {
          const apptId = await createCustomerAppointment({
            w: who,
            title: form.subject.trim(),
            scheduled_date: form.scheduled_date,
            scheduled_time: form.scheduled_time,
            duration_minutes: Number(form.duration_minutes) || 60,
            calendar_id: form.calendar_id,
            team: form.assigned_team,
            lead_id: form.assigned_team[0]?.id || null,
          });
          if (apptId) {
            await supabase.from("tickets").update({ appointment_id: apptId }).eq("id", id);
            toast.success("Customer appointment booked");
          }
        } catch (err) {
          toast.error("Saved, but the customer appointment could not be booked: " + (err as Error).message);
        }
      }

      logAction(isEditing ? "update" : "create", "ticket", id!, { subject: form.subject });

      // Calendar entry and crew text — best effort, never blocks saving.
      if (id && (form.scheduled_date || form.expected_completion_date)) {
        try {
          await syncWorkItemCalendar("ticket", id);
        } catch (err) {
          console.error("ticket calendar sync failed", err);
          toast.error("Saved, but the calendar entry could not be created");
        }
      }
      if (id && form.send_sms_reminder && form.status !== "completed" && form.status !== "cancelled") {
        try {
          const res = await notifyWorkItemTeam("ticket", id);
          const sent = (res?.results || []).filter((r: { status: string }) => r.status === "sent").length;
          if (sent) toast.success(`Text sent to ${sent} staff member${sent === 1 ? "" : "s"}`);
        } catch (err) {
          console.error("ticket sms failed", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      toast.success(isEditing ? "Ticket updated" : "Ticket created");
      navigate("/admin/tickets/list");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Ticket className="h-5 w-5" /> {isEditing ? "Edit Ticket" : "New Ticket"}
        </h2>
        {ticketNumber && <span className="rounded bg-muted px-2 py-1 text-sm font-mono">{ticketNumber}</span>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="What is this ticket about?"
            />
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={form.reason} onValueChange={(v) => set("reason", v)}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {TICKET_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TICKET_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <WhoForCard kind="ticket" value={who} onChange={setWho} hasSchedule={!!form.scheduled_date} teamSlot={<TeamChecklist companyId={who.company_id} employees={employees} team={form.assigned_team} onToggle={toggleTeamMember} />} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dates &amp; Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as WorkItemStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORK_ITEM_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sched-date">Appointment Date (optional)</Label>
            <Input
              id="sched-date"
              type="date"
              value={form.scheduled_date}
              onChange={(e) => set("scheduled_date", e.target.value)}
            />
          </div>
          <div>
            <Label>Appointment Time (optional)</Label>
            <Select value={form.scheduled_time} onValueChange={(v) => set("scheduled_time", v)}>
              <SelectTrigger><SelectValue placeholder="Select a time window" /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="expected">Expected Completion (End) Date</Label>
            <Input
              id="expected"
              type="date"
              value={form.expected_completion_date}
              onChange={(e) => set("expected_completion_date", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              step={15}
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
            />
          </div>
          <div>
            <Label>Show on Calendar (optional)</Label>
            <Select value={form.calendar_id} onValueChange={(v) => set("calendar_id", v)}>
              <SelectTrigger><SelectValue placeholder="Choose which calendar shows this" /></SelectTrigger>
              <SelectContent>
                {(calendars || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.calendar_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">The Google calendar this appears on. Assigned staff get an invite either way.</p>
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Text the assigned staff</Label>
              <p className="text-xs text-muted-foreground">Sends a text message with the ticket details on save.</p>
            </div>
            <Switch checked={form.send_sms_reminder} onCheckedChange={(v) => set("send_sms_reminder", v)} />
          </div>
        </CardContent>
      </Card>

      {isEditing && editId && (
        <Card>
          <CardContent className="pt-4">
            <RepliesThread kind="ticket" itemId={editId} />
          </CardContent>
        </Card>
      )}

      {createdBy.name && (
        <p className="text-xs text-muted-foreground">
          Created by {createdBy.name}
          {createdBy.at ? ` on ${new Date(createdBy.at).toLocaleString()}` : ""}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Ticket" : "Submit Ticket"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/tickets/list")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
