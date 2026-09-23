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
import { Loader2, ListChecks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminLog } from "@/hooks/useAdminLog";
import {
  CustomerLite,
  CustomerPicker,
  TeamChecklist,
  customerLabel,
  useCalendarOptions,
  useEmployeeOptions,
} from "./WorkItemFields";
import {
  EmployeeOption,
  TASK_TYPES,
  TIME_SLOTS,
  TeamMember,
  WORK_ITEM_STATUSES,
  WorkItemStatus,
  notifyWorkItemTeam,
  syncWorkItemCalendar,
  toTeam,
} from "./workItems";

interface TaskForm {
  task_type: string;
  title: string;
  location: string;
  notes: string;
  due_date: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: string;
  calendar_id: string;
  assigned_team: TeamMember[];
  status: WorkItemStatus;
  send_sms_reminder: boolean;
}

const initialForm: TaskForm = {
  task_type: "Meeting",
  title: "",
  location: "",
  notes: "",
  due_date: "",
  scheduled_date: "",
  scheduled_time: "",
  duration_minutes: "60",
  calendar_id: "",
  assigned_team: [],
  status: "open",
  send_sms_reminder: true,
};

export default function TasksAdd() {
  const [form, setForm] = useState<TaskForm>(initialForm);
  const [customer, setCustomer] = useState<CustomerLite | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskNumber, setTaskNumber] = useState<string | null>(null);
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

  const set = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!editId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("tasks").select("*").eq("id", editId).maybeSingle();
      if (error || !data) {
        toast.error("Could not load that task");
        navigate("/admin/tasks/list");
      } else {
        setTaskNumber(data.task_number);
        setCreatedBy({ name: data.created_by_name, at: data.created_at });
        setForm({
          task_type: data.task_type || "Other",
          title: data.title || "",
          location: data.location || "",
          notes: data.notes || "",
          due_date: data.due_date || "",
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
    if (!form.title.trim()) {
      toast.error("Give the task a short title");
      return;
    }
    if (form.assigned_team.length === 0) {
      toast.error("Assign at least one staff member");
      return;
    }

    setSaving(true);
    const payload = {
      task_type: form.task_type,
      title: form.title.trim(),
      location: form.location || null,
      customer_id: customer?.id || null,
      customer_name: customer ? customerLabel(customer) : null,
      notes: form.notes || null,
      due_date: form.due_date || null,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      duration_minutes: Number(form.duration_minutes) || 60,
      calendar_id: form.calendar_id || null,
      assigned_team: form.assigned_team as unknown as never,
      assigned_employee_id: form.assigned_team[0]?.id || null,
      status: form.status,
      send_sms_reminder: form.send_sms_reminder,
      completed_at: form.status === "completed" ? new Date().toISOString() : null,
    };

    try {
      let id = editId;
      if (isEditing) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", editId!);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("tasks")
          .insert({ ...payload, created_by: user?.id || null, created_by_name: user?.email || null })
          .select("id, task_number")
          .single();
        if (error) throw error;
        id = data.id;
        setTaskNumber(data.task_number);
      }

      logAction(isEditing ? "update" : "create", "task", id!, { title: form.title, task_type: form.task_type });

      if (id && (form.scheduled_date || form.due_date)) {
        try {
          await syncWorkItemCalendar("task", id);
        } catch (err) {
          console.error("task calendar sync failed", err);
          toast.error("Saved, but the calendar entry could not be created");
        }
      }
      if (id && form.send_sms_reminder && form.status !== "completed" && form.status !== "cancelled") {
        try {
          const res = await notifyWorkItemTeam("task", id);
          const sent = (res?.results || []).filter((r: { status: string }) => r.status === "sent").length;
          if (sent) toast.success(`Text sent to ${sent} staff member${sent === 1 ? "" : "s"}`);
        } catch (err) {
          console.error("task sms failed", err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      toast.success(isEditing ? "Task updated" : "Task created");
      navigate("/admin/tasks/list");
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
          <ListChecks className="h-5 w-5" /> {isEditing ? "Edit Task" : "New Task"}
        </h2>
        {taskNumber && <span className="rounded bg-muted px-2 py-1 text-sm font-mono">{taskNumber}</span>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Task Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Task Type *</Label>
            <Select value={form.task_type} onValueChange={(v) => set("task_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Pick up condenser from supply house"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="location">Where / Who</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Address, supplier, or meeting place"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea id="task-notes" rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-2 block">Related Customer (optional)</Label>
            <CustomerPicker selected={customer} onSelect={setCustomer} onClear={() => setCustomer(null)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dates &amp; Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="due">Due Date</Label>
            <Input id="due" type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
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
            <Label htmlFor="task-date">Scheduled Date (optional)</Label>
            <Input
              id="task-date"
              type="date"
              value={form.scheduled_date}
              onChange={(e) => set("scheduled_date", e.target.value)}
            />
          </div>
          <div>
            <Label>Scheduled Time (optional)</Label>
            <Select value={form.scheduled_time} onValueChange={(v) => set("scheduled_time", v)}>
              <SelectTrigger><SelectValue placeholder="Select a time window" /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="task-duration">Duration (minutes)</Label>
            <Input
              id="task-duration"
              type="number"
              min={15}
              step={15}
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", e.target.value)}
            />
          </div>
          <div>
            <Label>Calendar</Label>
            <Select value={form.calendar_id} onValueChange={(v) => set("calendar_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a calendar" /></SelectTrigger>
              <SelectContent>
                {(calendars || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.calendar_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <TeamChecklist employees={employees} team={form.assigned_team} onToggle={toggleTeamMember} />
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Text the assigned staff</Label>
              <p className="text-xs text-muted-foreground">Sends a text message with the task details on save.</p>
            </div>
            <Switch checked={form.send_sms_reminder} onCheckedChange={(v) => set("send_sms_reminder", v)} />
          </div>
        </CardContent>
      </Card>

      {createdBy.name && (
        <p className="text-xs text-muted-foreground">
          Created by {createdBy.name}
          {createdBy.at ? ` on ${new Date(createdBy.at).toLocaleString()}` : ""}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Task" : "Submit Task"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/tasks/list")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
