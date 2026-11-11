import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isAppointmentPast } from "@/lib/overdueAppointments";

export default function OverdueAppointmentAlerts() {
  const navigate = useNavigate();
  const { data = [] } = useQuery({
    queryKey: ["overdue-appointments"],
    refetchInterval: 60000,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, customer_name, scheduled_date, scheduled_time")
        .eq("status", "open")
        .lte("scheduled_date", format(new Date(), "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []).filter((a: any) => isAppointmentPast(a.scheduled_date, a.scheduled_time));
    },
  });
  if (!data.length) return null;
  return (
    <section aria-label="Past appointments needing action" className="border-b border-destructive/30 bg-background px-4 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <CalendarClock className="h-4 w-4" />Past appointments — close or reschedule ({data.length})
        <span className="font-normal text-muted-foreground">Auto-closed after 2 business days</span>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        {data.slice(0, 5).map((a: any) => (
          <Button key={a.id} variant="outline" size="sm" className="h-auto whitespace-normal text-left" onClick={() => navigate(`/admin/appointments/add?id=${a.id}`)}>
            {a.customer_name || "Appointment"} · {a.scheduled_date}{a.scheduled_time ? ` ${a.scheduled_time}` : ""}
          </Button>
        ))}
        {data.length > 5 && <Button variant="ghost" size="sm" onClick={() => navigate("/admin/appointments/open")}>View all</Button>}
      </div>
    </section>
  );
}
