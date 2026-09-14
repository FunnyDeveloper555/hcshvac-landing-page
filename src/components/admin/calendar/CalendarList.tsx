import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, User, CalendarPlus, Mail, Phone, Plus, Search, Loader2, Trash2, Pencil, CheckCircle2,
} from "lucide-react";

interface CalendarRow {
  id: string;
  calendar_name: string;
  calendar_type: string;
  email: string | null;
  phone: string | null;
  color: string;
  google_calendar_id: string | null;
  is_active: boolean;
  company_id: string | null;
  employee_id: string | null;
}

const CalendarList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: calendars, isLoading } = useQuery({
    queryKey: ["calendars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendars")
        .select("id, calendar_name, calendar_type, email, phone, color, google_calendar_id, is_active, company_id, employee_id")
        .order("calendar_type")
        .order("calendar_name");
      if (error) throw error;
      return data as CalendarRow[];
    },
    staleTime: 30_000,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("calendars").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      toast.success("Calendar updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCalendar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      toast.success("Calendar deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (calendars || []).filter((cal) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      cal.calendar_name.toLowerCase().includes(q) || (cal.email || "").toLowerCase().includes(q);
    const matchesType = filterType === "all" || cal.calendar_type === filterType;
    return matchesSearch && matchesType;
  });

  const companyCalendars = filtered.filter((c) => c.calendar_type === "company");
  const employeeCalendars = filtered.filter((c) => c.calendar_type === "employee");

  const CalendarItem = ({ calendar }: { calendar: CalendarRow }) => (
    <div className="flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-md transition-colors group">
      <div
        className="w-8 h-8 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: calendar.color + "20" }}
      >
        {calendar.calendar_type === "company" ? (
          <Building2 className="h-4 w-4" style={{ color: calendar.color }} />
        ) : (
          <User className="h-4 w-4" style={{ color: calendar.color }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{calendar.calendar_name}</span>
          {!calendar.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
          {calendar.google_calendar_id && (
            <Badge variant="outline" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" /> Google linked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {calendar.email && (
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{calendar.email}</span>
          )}
          {calendar.phone && (
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{calendar.phone}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Switch
          checked={calendar.is_active}
          onCheckedChange={(v) => toggleActive.mutate({ id: calendar.id, is_active: v })}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => navigate(`/admin/calendar/add?edit=${calendar.id}`)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
          onClick={() => { if (confirm(`Delete "${calendar.calendar_name}"?`)) removeCalendar.mutate(calendar.id); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Calendars
        </div>
        <Button size="sm" onClick={() => navigate("/admin/calendar/add")}>
          <Plus className="h-4 w-4 mr-1" /> New Calendar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search calendars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No calendars yet. Create one to start syncing appointments.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Company Calendars ({companyCalendars.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {companyCalendars.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">None</p>
              )}
              {companyCalendars.map((c) => <CalendarItem key={c.id} calendar={c} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Employee Calendars ({employeeCalendars.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {employeeCalendars.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">None</p>
              )}
              {employeeCalendars.map((c) => <CalendarItem key={c.id} calendar={c} />)}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CalendarList;
