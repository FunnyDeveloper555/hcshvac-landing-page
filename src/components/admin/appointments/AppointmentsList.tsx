import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, Calendar, Pencil, Send, Eye } from "lucide-react";
import { format, isToday, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from "date-fns";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useNavigate, useLocation } from "react-router-dom";
import SendInvitationDialog from "./SendInvitationDialog";
import SubmissionDetailsDialog from "./SubmissionDetailsDialog";

type AppointmentStatus = "open" | "closed" | "cancelled";
type AppointmentType = "residential" | "commercial" | "non_profit" | "church" | "school" | "government" | "other";

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
  created_at: string;
  closed_at: string | null;
  company_id: string | null;
  companies?: { name: string } | null;
}

type FilterType = "all" | "open" | "closed" | "open_today" | "closed_today" | "closed_week" | "closed_month" | "closed_year";

const ITEMS_PER_PAGE = 20;

export default function AppointmentsList() {
  const location = useLocation();
  const routeFilter: FilterType = location.pathname.endsWith("/open") ? "open" : location.pathname.endsWith("/closed") ? "closed" : "all";
  const [filter, setFilter] = useState<FilterType>(routeFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [invitationTarget, setInvitationTarget] = useState<Appointment | null>(null);
  const [submissionTarget, setSubmissionTarget] = useState<Appointment | null>(null);
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const navigate = useNavigate();

  useEffect(() => {
    setFilter(routeFilter);
    setCurrentPage(1);
  }, [routeFilter]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, companies(name)")
        .order("scheduled_date", { ascending: false });
      
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const { data: invitations } = useQuery({
    queryKey: ["booking_invitations_for_appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_invitations")
        .select("id, company_id, recipient_phone, recipient_email, status, sent_at, opened_at, completed_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });

  const normalizePhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-10);

  const getInvitationFor = (appt: Appointment) => {
    if (!invitations) return null;
    const phone = normalizePhone(appt.customer_phone);
    const email = (appt.customer_email || "").toLowerCase().trim();
    return invitations.find((inv) => {
      if (appt.company_id && inv.company_id && inv.company_id !== appt.company_id) return false;
      const invPhone = normalizePhone(inv.recipient_phone);
      const invEmail = (inv.recipient_email || "").toLowerCase().trim();
      return (phone && invPhone && phone === invPhone) || (email && invEmail && email === invEmail);
    }) || null;
  };

  const getInvitationBadge = (appt: Appointment) => {
    const inv = getInvitationFor(appt);
    if (!inv) return <Badge variant="outline" className="text-muted-foreground">Not sent</Badge>;
    switch (inv.status) {
      case "completed":
        return <Badge className="bg-green-600">Submitted</Badge>;
      case "opened":
        return <Badge className="bg-blue-500">Opened</Badge>;
      case "sent":
        return <Badge className="bg-amber-500">Sent</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{inv.status}</Badge>;
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, customerName }: { id: string; status: AppointmentStatus; customerName: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "closed") {
        updateData.closed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
      return { id, status, customerName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment status updated");
      logAction("status_change", "appointment", data.id, { 
        new_status: data.status,
        customer_name: data.customerName 
      });
    },
    onError: () => {
      toast.error("Failed to update appointment status");
    },
  });

  const filterAppointments = (appointments: Appointment[] | undefined): Appointment[] => {
    if (!appointments) return [];
    
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    switch (filter) {
      case "open":
        return appointments.filter(a => a.status === "open");
      case "closed":
        return appointments.filter(a => a.status === "closed");
      case "open_today":
        return appointments.filter(a => a.status === "open" && isToday(parseISO(a.scheduled_date)));
      case "closed_today":
        return appointments.filter(a => a.status === "closed" && a.closed_at && isToday(parseISO(a.closed_at)));
      case "closed_week":
        return appointments.filter(a => a.status === "closed" && a.closed_at && isAfter(parseISO(a.closed_at), weekStart));
      case "closed_month":
        return appointments.filter(a => a.status === "closed" && a.closed_at && isAfter(parseISO(a.closed_at), monthStart));
      case "closed_year":
        return appointments.filter(a => a.status === "closed" && a.closed_at && isAfter(parseISO(a.closed_at), yearStart));
      default:
        return appointments;
    }
  };

  const getStats = () => {
    if (!appointments) return { open: 0, closed: 0, openToday: 0, closedToday: 0, closedWeek: 0, closedMonth: 0, closedYear: 0 };
    
    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    return {
      open: appointments.filter(a => a.status === "open").length,
      closed: appointments.filter(a => a.status === "closed").length,
      openToday: appointments.filter(a => a.status === "open" && isToday(parseISO(a.scheduled_date))).length,
      closedToday: appointments.filter(a => a.status === "closed" && a.closed_at && isToday(parseISO(a.closed_at))).length,
      closedWeek: appointments.filter(a => a.status === "closed" && a.closed_at && isAfter(parseISO(a.closed_at), weekStart)).length,
      closedMonth: appointments.filter(a => a.status === "closed" && a.closed_at && isAfter(parseISO(a.closed_at), monthStart)).length,
      closedYear: appointments.filter(a => a.status === "closed" && a.closed_at && isAfter(parseISO(a.closed_at), yearStart)).length,
    };
  };

  const stats = getStats();
  const filteredAppointments = filterAppointments(appointments);
  
  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/appointments/add?id=${id}`);
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "open":
        return <Badge variant="default" className="bg-green-500">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
    }
  };

  const getTypeBadge = (type: AppointmentType) => {
    const labels: Record<AppointmentType, string> = {
      residential: "Residential",
      commercial: "Commercial",
      non_profit: "Non-Profit",
      church: "Church",
      school: "School",
      government: "Government",
      other: "Other",
    };
    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Appointments</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("open")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.open}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("open_today")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.openToday}</div>
            <div className="text-xs text-muted-foreground">Open Today</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("closed_today")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closedToday}</div>
            <div className="text-xs text-muted-foreground">Closed Today</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("closed_week")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closedWeek}</div>
            <div className="text-xs text-muted-foreground">Closed This Week</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("closed_month")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closedMonth}</div>
            <div className="text-xs text-muted-foreground">Closed This Month</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("closed_year")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closedYear}</div>
            <div className="text-xs text-muted-foreground">Closed YTD</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => handleFilterChange("closed")}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <div className="text-xs text-muted-foreground">Total Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(v) => handleFilterChange(v as FilterType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter appointments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Appointments</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="open_today">Open Today</SelectItem>
            <SelectItem value="closed_today">Closed Today</SelectItem>
            <SelectItem value="closed_week">Closed This Week</SelectItem>
            <SelectItem value="closed_month">Closed This Month</SelectItem>
            <SelectItem value="closed_year">Closed This Year</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">
          Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(parseISO(appointment.scheduled_date), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.scheduled_time}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{appointment.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{appointment.customer_phone}</div>
                          {appointment.customer_email && (
                            <div className="text-sm text-muted-foreground">{appointment.customer_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(appointment.appointment_type)}</TableCell>
                      <TableCell>{appointment.companies?.name || "-"}</TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell>{getInvitationBadge(appointment)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(appointment.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!appointment.customer_phone && !appointment.customer_email}
                            onClick={() => setInvitationTarget(appointment)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send Invitation
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSubmissionTarget(appointment)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Submission
                          </Button>
                          {appointment.status === "open" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "closed", customerName: appointment.customer_name })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Close
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "cancelled", customerName: appointment.customer_name })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {appointment.status === "closed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: "open", customerName: appointment.customer_name })}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Reopen
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      <SendInvitationDialog
        appointment={invitationTarget}
        open={!!invitationTarget}
        onOpenChange={(v) => {
          if (!v) {
            setInvitationTarget(null);
            queryClient.invalidateQueries({ queryKey: ["booking_invitations_for_appointments"] });
          }
        }}
      />
    </div>
  );
}
