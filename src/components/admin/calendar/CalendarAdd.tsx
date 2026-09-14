import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { CalendarPlus, Building2, User, Loader2, RefreshCw } from "lucide-react";

interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
}

const CalendarAdd = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const { logAction } = useAdminLog();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(!!editId);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [formData, setFormData] = useState({
    calendar_name: "",
    calendar_type: "company",
    company_id: "",
    employee_id: "",
    email: "",
    phone: "",
    description: "",
    color: "#3b82f6",
    google_calendar_id: "",
    is_active: true,
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-active-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email_address, phone_number")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data, error } = await supabase.from("calendars").select("*").eq("id", editId).maybeSingle();
      if (error || !data) {
        toast.error("Failed to load calendar");
        navigate("/admin/calendar/list");
        return;
      }
      setFormData({
        calendar_name: data.calendar_name,
        calendar_type: data.calendar_type,
        company_id: data.company_id || "",
        employee_id: data.employee_id || "",
        email: data.email || "",
        phone: data.phone || "",
        description: data.description || "",
        color: data.color,
        google_calendar_id: data.google_calendar_id || "",
        is_active: data.is_active,
      });
      setLoadingRecord(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const loadGoogleCalendars = async () => {
    setLoadingGoogle(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-google-calendars");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGoogleCalendars(data.calendars || []);
      toast.success(`Found ${data.calendars?.length || 0} Google calendars`);
    } catch (e) {
      toast.error("Could not load Google calendars: " + (e as Error).message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.calendar_name.trim()) {
      toast.error("Calendar name is required");
      return;
    }
    setIsLoading(true);
    const payload = {
      calendar_name: formData.calendar_name.trim(),
      calendar_type: formData.calendar_type,
      company_id: formData.calendar_type === "company" ? formData.company_id || null : null,
      employee_id: formData.calendar_type === "employee" ? formData.employee_id || null : null,
      email: formData.email || null,
      phone: formData.phone || null,
      description: formData.description || null,
      color: formData.color,
      google_calendar_id: formData.google_calendar_id || null,
      is_active: formData.is_active,
    };

    try {
      if (editId) {
        const { error } = await supabase.from("calendars").update(payload).eq("id", editId);
        if (error) throw error;
        logAction("update", "settings", editId, { calendar_name: payload.calendar_name });
        toast.success("Calendar updated");
      } else {
        const { data, error } = await supabase.from("calendars").insert(payload).select().single();
        if (error) throw error;
        logAction("create", "settings", data.id, { calendar_name: payload.calendar_name });
        toast.success("Calendar created");
      }
      navigate("/admin/calendar/list");
    } catch (error) {
      console.error("Error saving calendar:", error);
      toast.error("Failed to save calendar: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingRecord) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="border-b pb-3 flex items-center gap-2 text-lg font-semibold">
        <CalendarPlus className="h-5 w-5 text-primary" />
        <span className="text-muted-foreground">Calendar</span>
        <span className="text-muted-foreground">|</span>
        <span>{editId ? "Edit Calendar" : "New Calendar"}</span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Calendar Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Calendar Type</Label>
                <Select
                  value={formData.calendar_type}
                  onValueChange={(v) => setFormData({ ...formData, calendar_type: v })}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Calendar Name *</Label>
                <Input
                  className="h-9"
                  value={formData.calendar_name}
                  onChange={(e) => setFormData({ ...formData, calendar_name: e.target.value })}
                  placeholder="Best Comfort Service Calendar"
                />
              </div>
            </div>

            {formData.calendar_type === "company" ? (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Company</Label>
                <Select
                  value={formData.company_id || undefined}
                  onValueChange={(v) => {
                    const c = companies?.find((x) => x.id === v);
                    setFormData((prev) => ({
                      ...prev,
                      company_id: v,
                      calendar_name: prev.calendar_name || `${c?.name || ""} Calendar`,
                    }));
                  }}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Employee</Label>
                <Select
                  value={formData.employee_id || undefined}
                  onValueChange={(v) => {
                    const emp = employees?.find((x) => x.id === v);
                    setFormData((prev) => ({
                      ...prev,
                      employee_id: v,
                      calendar_name: prev.calendar_name || `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim(),
                      email: prev.email || emp?.email_address || "",
                      phone: prev.phone || emp?.phone_number || "",
                    }));
                  }}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email (calendar invites)</Label>
                <Input
                  className="h-9" type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="calendar@bestcomforthvac.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile (text reminders)</Label>
                <Input
                  className="h-9"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" variant="outline" size="sm" className="w-full"
                onClick={loadGoogleCalendars} disabled={loadingGoogle}>
                {loadingGoogle ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Load my Google calendars
              </Button>

              {googleCalendars.length > 0 && (
                <Select
                  value={formData.google_calendar_id || undefined}
                  onValueChange={(v) => setFormData({ ...formData, google_calendar_id: v })}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="Choose calendar" /></SelectTrigger>
                  <SelectContent>
                    {googleCalendars.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.summary}{c.primary ? " (primary)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Calendar ID</Label>
                <Input
                  className="h-9 text-xs"
                  value={formData.google_calendar_id}
                  onChange={(e) => setFormData({ ...formData, google_calendar_id: e.target.value })}
                  placeholder="primary"
                />
                <p className="text-xs text-muted-foreground">
                  Appointments assigned to this calendar are added to this Google calendar automatically.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color" className="h-9 w-14 p-1"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <Input
                    className="h-9"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editId ? "Update Calendar" : "Create Calendar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/calendar/list")}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CalendarAdd;
