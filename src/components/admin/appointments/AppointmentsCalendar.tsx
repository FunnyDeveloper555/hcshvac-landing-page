import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2, ChevronLeft, ChevronRight, RefreshCw, MessageSquare, CalendarCheck, Pencil, CheckCircle2, Users } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, addDays, subDays, addWeeks, subWeeks,
} from "date-fns";

type AppointmentStatus = "open" | "closed" | "cancelled";
type AppointmentType = "residential" | "commercial" | "non_profit" | "church" | "school" | "government" | "other";
type ViewMode = "month" | "week" | "day";

type EntryKind = "appointment" | "ticket" | "task";

interface Appointment {
  kind?: EntryKind;
  id: string;
  appointment_number: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number | null;
  notes: string | null;
  company_id: string | null;
  calendar_id: string | null;
  google_event_id: string | null;
  reminder_sms_sent_at: string | null;
  booking_sms_sent_at: string | null;
  assigned_team?: Array<{ id?: string; name?: string; phone?: string; email?: string }> | null;
  companies?: { name: string } | null;
  calendars?: { calendar_name: string; color: string } | null;
}

const entryKind = (apt: Appointment): EntryKind => apt.kind || "appointment";

// Tickets and tasks get their own colours so they stand out from real jobs.
const entryColor = (apt: Appointment): string =>
  entryKind(apt) === "ticket" ? "bg-rose-600" : entryKind(apt) === "task" ? "bg-indigo-600" : typeColors[apt.appointment_type];

const entryPath = (apt: Appointment): string =>
  entryKind(apt) === "ticket"
    ? `/admin/tickets/add?id=${apt.id}`
    : entryKind(apt) === "task"
      ? `/admin/tasks/add?id=${apt.id}`
      : `/admin/appointments/add?id=${apt.id}`;

const teamNames = (apt: Appointment): string[] =>
  Array.isArray(apt.assigned_team)
    ? apt.assigned_team.map((m) => (m?.name || "").trim()).filter(Boolean)
    : [];

const typeColors: Record<AppointmentType, string> = {
  residential: "bg-blue-500",
  commercial: "bg-purple-500",
  non_profit: "bg-green-500",
  church: "bg-amber-500",
  school: "bg-cyan-500",
  government: "bg-red-500",
  other: "bg-gray-500",
};

const statusColors: Record<AppointmentStatus, string> = {
  open: "border-l-green-500",
  closed: "border-l-gray-400",
  cancelled: "border-l-red-500",
};

// 7 AM – 7 PM hour rows for the week/day grids
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

// Handles "9:30 AM", "9 AM", "12 Noon", "12 Midnight" and ranges like "1 PM to 3 PM"
function timeToMinutes(t: string): number {
  const raw = (t || "").trim();
  const first = raw.split(/\s+(?:to|-|–|—|through|until)\s+/i)[0]?.trim() || raw;
  if (/noon/i.test(first)) return 12 * 60;
  if (/midnight/i.test(first)) return 0;
  const m = first.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]?\.?/);
  if (!m) return 9 * 60;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const suf = m[3]?.toUpperCase();
  if (suf === "P" && h < 12) h += 12;
  if (suf === "A" && h === 12) h = 0;
  return h * 60 + min;
}

export default function AppointmentsCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [calendarFilter, setCalendarFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ["companies-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: calendars } = useQuery({
    queryKey: ["calendars-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendars")
        .select("id, calendar_name, calendar_type, company_id, employee_id, phone, google_calendar_id, is_active")
        .eq("is_active", true)
        .order("calendar_name");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, appointment_number, customer_name, customer_phone, customer_address, appointment_type, status, scheduled_date, scheduled_time, duration_minutes, notes, company_id, calendar_id, google_event_id, reminder_sms_sent_at, booking_sms_sent_at, assigned_team, companies(name), calendars(calendar_name, color)"
        )
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data as unknown as Appointment[];
    },
    staleTime: 15_000,
  });

  const filtered = useMemo(
    () =>
      (appointments || []).filter((apt) => {
        if (companyFilter !== "all" && apt.company_id !== companyFilter) return false;
        if (calendarFilter !== "all" && apt.calendar_id !== calendarFilter) return false;
        return true;
      }),
    [appointments, companyFilter, calendarFilter],
  );

  const forDay = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return filtered
      .filter((a) => a.scheduled_date === key)
      .sort((a, b) => timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time));
  };

  const goPrev = () =>
    setCursor((c) => (view === "month" ? subMonths(c, 1) : view === "week" ? subWeeks(c, 1) : subDays(c, 1)));
  const goNext = () =>
    setCursor((c) => (view === "month" ? addMonths(c, 1) : view === "week" ? addWeeks(c, 1) : addDays(c, 1)));
  const goToday = () => {
    setCursor(new Date());
    setSelectedDate(new Date());
  };

  const heading =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d, yyyy")}`
        : format(cursor, "EEEE, MMMM d, yyyy");

  const resync = async (apt: Appointment) => {
    setBusyId(apt.id);
    try {
      const { data, error } = await supabase.functions.invoke("sync-appointment-calendar", {
        body: { appointment_id: apt.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Google Calendar updated");
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
    } catch (e) {
      toast.error("Calendar sync failed: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const syncAllVisible = async () => {
    const start = view === "month" ? startOfWeek(startOfMonth(cursor)) : view === "week" ? startOfWeek(cursor) : cursor;
    const end = view === "month" ? endOfWeek(endOfMonth(cursor)) : view === "week" ? endOfWeek(cursor) : cursor;
    const startKey = format(start, "yyyy-MM-dd");
    const endKey = format(end, "yyyy-MM-dd");
    const targets = filtered.filter(
      (a) => a.status !== "cancelled" && a.scheduled_date >= startKey && a.scheduled_date <= endKey,
    );
    if (targets.length === 0) {
      toast.info("No appointments to send for this period");
      return;
    }
    setSyncingAll(true);
    let ok = 0;
    const failures: string[] = [];
    for (const apt of targets) {
      try {
        const { data, error } = await supabase.functions.invoke("sync-appointment-calendar", {
          body: { appointment_id: apt.id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        ok++;
      } catch (e) {
        failures.push(`${apt.customer_name}: ${(e as Error).message}`);
      }
    }
    setSyncingAll(false);
    queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
    if (failures.length === 0) toast.success(`${ok} appointment${ok === 1 ? "" : "s"} added to Google Calendar`);
    else toast.error(`${ok} added, ${failures.length} failed. ${failures[0]}`);
  };

  const sendReminder = async (apt: Appointment) => {
    setBusyId(apt.id);
    try {
      const { data, error } = await supabase.functions.invoke("appointment-sms", {
        body: { appointment_id: apt.id, kind: "reminder" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const sent = (data?.results || []).filter((r: any) => r.status === "sent").length;
      toast.success(sent ? `Reminder text sent (${sent})` : "No mobile numbers to text");
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
    } catch (e) {
      toast.error("Text failed: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const AppointmentCard = ({ apt, compact }: { apt: Appointment; compact?: boolean }) => (
    <div className={`p-2.5 border-l-4 rounded-r-md bg-muted/30 ${statusColors[apt.status]}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-medium text-sm">{apt.scheduled_time}</span>
        <Badge
          variant={apt.status === "open" ? "default" : apt.status === "cancelled" ? "destructive" : "secondary"}
          className="text-xs"
        >
          {apt.status}
        </Badge>
      </div>
      <div className="text-sm font-medium">{apt.customer_name}</div>
      <div className="text-xs text-muted-foreground">{apt.customer_phone}</div>
      {!compact && apt.customer_address && (
        <div className="text-xs text-muted-foreground">{apt.customer_address}</div>
      )}
      {teamNames(apt).length > 0 && (
        <div className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5">
          <Users className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>{teamNames(apt).join(", ")}</span>
        </div>
      )}
      {apt.companies?.name && <div className="text-xs text-muted-foreground mt-0.5">{apt.companies.name}</div>}
      {apt.calendars?.calendar_name && (
        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: apt.calendars.color }} />
          {apt.calendars.calendar_name}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <Badge variant="outline" className="text-xs capitalize">
          {apt.appointment_type.replace("_", " ")}
        </Badge>
        {apt.google_event_id && (
          <Badge variant="outline" className="text-xs gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" /> On calendar
          </Badge>
        )}
        {apt.reminder_sms_sent_at && (
          <Badge variant="outline" className="text-xs gap-1">
            <MessageSquare className="h-3 w-3 text-green-600" /> Reminded
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
          onClick={() => navigate(`/admin/appointments/add?id=${apt.id}`)}>
          <Pencil className="h-3 w-3 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
          disabled={busyId === apt.id} onClick={() => resync(apt)}>
          {busyId === apt.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CalendarCheck className="h-3 w-3 mr-1" />}
          Sync
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
          disabled={busyId === apt.id} onClick={() => sendReminder(apt)}>
          <MessageSquare className="h-3 w-3 mr-1" /> Text
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthStart = startOfMonth(cursor);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(cursor)),
  });
  const weekDays = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <h2 className="text-xl font-bold">Appointments Calendar</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="h-9 w-[180px] text-sm"><SelectValue placeholder="Company" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={calendarFilter} onValueChange={setCalendarFilter}>
            <SelectTrigger className="h-9 w-[180px] text-sm"><SelectValue placeholder="Calendar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All calendars</SelectItem>
              {calendars?.map((c) => <SelectItem key={c.id} value={c.id}>{c.calendar_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={syncingAll} onClick={syncAllVisible}>
            {syncingAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-1" />}
            Sync all shown
          </Button>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] })}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-base font-semibold min-w-[220px] text-center">{heading}</h3>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
        </div>
        <div className="flex items-center rounded-md border p-0.5">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? "default" : "ghost"}
              className="h-7 px-3 text-xs capitalize"
              onClick={() => setView(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardContent className="p-3">
            {view === "month" && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dayAppointments = forDay(day);
                    const isCurrentMonth = isSameMonth(day, cursor);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        onDoubleClick={() => { setCursor(day); setView("day"); }}
                        className={`min-h-[74px] p-1 border rounded-md cursor-pointer transition-colors
                          ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-background"}
                          ${isSelected ? "ring-2 ring-primary" : ""}
                          ${isToday ? "border-primary" : "border-border"} hover:bg-accent/50`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-0.5">
                          {dayAppointments.slice(0, 3).map((apt) => (
                            <div
                              key={apt.id}
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/appointments/add?id=${apt.id}`); }}
                              className={`text-[10px] truncate px-1 py-0.5 rounded text-white ${typeColors[apt.appointment_type]}`}
                              title={`${apt.scheduled_time} — ${apt.customer_name}`}
                            >
                              {apt.scheduled_time} {apt.customer_name}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{dayAppointments.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {view === "week" && (
              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1 mb-1">
                    <div />
                    {weekDays.map((d) => (
                      <div
                        key={d.toISOString()}
                        onClick={() => setSelectedDate(d)}
                        className={`text-center text-xs py-1 rounded cursor-pointer ${
                          isSameDay(d, new Date()) ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        {format(d, "EEE d")}
                      </div>
                    ))}
                  </div>
                  {HOURS.map((h) => (
                    <div key={h} className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
                      <div className="text-[10px] text-muted-foreground text-right pr-1 pt-1">
                        {format(new Date(2000, 0, 1, h), "h a")}
                      </div>
                      {weekDays.map((d) => {
                        const slot = forDay(d).filter(
                          (a) => Math.floor(timeToMinutes(a.scheduled_time) / 60) === h,
                        );
                        return (
                          <div
                            key={d.toISOString() + h}
                            className="min-h-[38px] border rounded-sm p-0.5 space-y-0.5 hover:bg-accent/40"
                            onClick={() => setSelectedDate(d)}
                          >
                            {slot.map((apt) => (
                              <div
                                key={apt.id}
                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/appointments/add?id=${apt.id}`); }}
                                className={`text-[10px] truncate px-1 py-0.5 rounded text-white cursor-pointer ${typeColors[apt.appointment_type]}`}
                                title={`${apt.scheduled_time} — ${apt.customer_name}`}
                              >
                                {apt.scheduled_time} {apt.customer_name}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === "day" && (
              <div className="space-y-1">
                {HOURS.map((h) => {
                  const slot = forDay(cursor).filter(
                    (a) => Math.floor(timeToMinutes(a.scheduled_time) / 60) === h,
                  );
                  return (
                    <div key={h} className="grid grid-cols-[64px_1fr] gap-2">
                      <div className="text-xs text-muted-foreground text-right pt-2">
                        {format(new Date(2000, 0, 1, h), "h a")}
                      </div>
                      <div className="min-h-[46px] border rounded-md p-1 space-y-1">
                        {slot.length === 0 && <div className="text-xs text-muted-foreground/60 px-1">—</div>}
                        {slot.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => navigate(`/admin/appointments/add?id=${apt.id}`)}
                            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded cursor-pointer hover:bg-accent"
                          >
                            <span className={`w-2 h-2 rounded-full ${typeColors[apt.appointment_type]}`} />
                            <span className="font-medium">{apt.scheduled_time}</span>
                            <span>{apt.customer_name}</span>
                            <span className="text-muted-foreground">{apt.customer_phone}</span>
                            {apt.google_event_id && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
              {Object.entries(typeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <h3 className="font-semibold text-sm mb-3">
              {view === "day"
                ? format(cursor, "EEEE, MMMM d, yyyy")
                : selectedDate
                  ? format(selectedDate, "EEEE, MMMM d, yyyy")
                  : "Select a date"}
            </h3>

            {(() => {
              const day = view === "day" ? cursor : selectedDate;
              const list = day ? forDay(day) : [];
              if (!day) return <p className="text-muted-foreground text-sm">Pick a day to see its jobs.</p>;
              if (list.length === 0) return <p className="text-muted-foreground text-sm">No appointments scheduled</p>;
              return (
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {list.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
