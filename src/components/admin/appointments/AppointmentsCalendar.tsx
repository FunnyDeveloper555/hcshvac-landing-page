import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";

type AppointmentStatus = "open" | "closed" | "cancelled";
type AppointmentType = "residential" | "commercial" | "non_profit" | "church" | "school" | "government" | "other";

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_time: string;
  company_id: string | null;
  companies?: { name: string } | null;
}

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

export default function AppointmentsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const { data: companies } = useQuery({
    queryKey: ["companies-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, customer_name, customer_phone, appointment_type, status, scheduled_date, scheduled_time, company_id, companies(name)")
        .order("scheduled_time", { ascending: true });
      
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const filteredAppointments = appointments?.filter(apt => {
    if (companyFilter === "all") return true;
    return apt.company_id === companyFilter;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (date: Date) => {
    if (!filteredAppointments) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return filteredAppointments.filter(apt => apt.scheduled_date === dateStr);
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDay(selectedDate) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Appointments Calendar</h2>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies?.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(day => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const openCount = dayAppointments.filter(a => a.status === "open").length;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[80px] p-1 border rounded-md cursor-pointer transition-colors
                      ${!isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-background"}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      ${isToday ? "border-primary" : "border-border"}
                      hover:bg-accent/50
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className="space-y-0.5">
                        {dayAppointments.slice(0, 3).map(apt => (
                          <div
                            key={apt.id}
                            className={`text-xs truncate px-1 py-0.5 rounded ${typeColors[apt.appointment_type]} text-white`}
                          >
                            {apt.scheduled_time}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                    {openCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-1">
                        {openCount} open
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {Object.entries(typeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
            </h3>
            
            {selectedDate && selectedDateAppointments.length === 0 && (
              <p className="text-muted-foreground text-sm">No appointments scheduled</p>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDateAppointments.map(apt => (
                <div
                  key={apt.id}
                  className={`p-3 border-l-4 rounded-r-md bg-muted/30 ${statusColors[apt.status]}`}
                >
                  <div className="flex items-center justify-between mb-1">
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
                  {apt.companies?.name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Company: {apt.companies.name}
                    </div>
                  )}
                  <Badge variant="outline" className="mt-2 text-xs capitalize">
                    {apt.appointment_type.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
