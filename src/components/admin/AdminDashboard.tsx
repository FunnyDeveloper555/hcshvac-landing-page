import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Users,
  CalendarDays,
  Briefcase,
  Store,
  UserCheck,
  MessageSquare,
  FileText,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Phone,
  Send,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Parallel data fetches
  const { data: companiesData } = useQuery({
    queryKey: ["dashboard-companies-detail"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name, is_active, slug, company_city, company_state");
      const active = data?.filter((c) => c.is_active).length ?? 0;
      const inactive = data?.filter((c) => !c.is_active).length ?? 0;
      return { total: data?.length ?? 0, active, inactive, recent: data?.slice(0, 3) ?? [] };
    },
  });

  const { data: employeesCount = 0 } = useQuery({
    queryKey: ["dashboard-employees"],
    queryFn: async () => {
      const { count } = await supabase.from("employees").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: servicesData } = useQuery({
    queryKey: ["dashboard-services-detail"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, title, is_active, icon");
      const active = data?.filter((s) => s.is_active).length ?? 0;
      return { total: data?.length ?? 0, active, list: data?.filter(s => s.is_active).slice(0, 5) ?? [] };
    },
  });

  const { data: vendorsCount = 0 } = useQuery({
    queryKey: ["dashboard-vendors"],
    queryFn: async () => {
      const { count } = await supabase.from("vendors").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: customersCount = 0 } = useQuery({
    queryKey: ["dashboard-customers"],
    queryFn: async () => {
      const { count } = await supabase.from("customer_registrations").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["dashboard-appointments-detail"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, customer_name, scheduled_date, scheduled_time, status, appointment_type, customer_phone")
        .order("scheduled_date", { ascending: true });
      const open = data?.filter((a) => a.status === "open").length ?? 0;
      const closed = data?.filter((a) => a.status === "closed").length ?? 0;
      const cancelled = data?.filter((a) => a.status === "cancelled").length ?? 0;
      const upcoming = data?.filter((a) => a.status === "open" && new Date(a.scheduled_date) >= new Date()).slice(0, 5) ?? [];
      return { total: data?.length ?? 0, open, closed, cancelled, upcoming };
    },
  });

  const { data: smsData } = useQuery({
    queryKey: ["dashboard-sms-detail"],
    queryFn: async () => {
      const { data } = await supabase.from("booking_invitations").select("status, created_at");
      const pending = data?.filter((s) => s.status === "pending").length ?? 0;
      const sent = data?.filter((s) => s.status === "sent").length ?? 0;
      const opened = data?.filter((s) => s.status === "opened").length ?? 0;
      const completed = data?.filter((s) => s.status === "completed").length ?? 0;
      return { total: data?.length ?? 0, pending, sent, opened, completed };
    },
  });

  const { data: serviceTermsCount = 0 } = useQuery({
    queryKey: ["dashboard-service-terms"],
    queryFn: async () => {
      const { count } = await supabase.from("service_terms").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count ?? 0;
    },
  });

  const { data: bookingsData } = useQuery({
    queryKey: ["dashboard-bookings"],
    queryFn: async () => {
      const { data } = await supabase.from("service_bookings").select("status, full_name, preferred_date, created_at").order("created_at", { ascending: false }).limit(5);
      const pending = data?.filter((b) => b.status === "pending").length ?? 0;
      return { total: data?.length ?? 0, pending, recent: data ?? [] };
    },
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["dashboard-recent-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_logs")
        .select("action, entity_type, user_email, created_at, details")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: brandsCount = 0 } = useQuery({
    queryKey: ["dashboard-brands"],
    queryFn: async () => {
      const { count } = await supabase.from("brands").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count ?? 0;
    },
  });

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return format(new Date(dateStr), "MMM d");
  };

  const getActionIcon = (action: string) => {
    if (action.includes("delete")) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (action.includes("create") || action.includes("add")) return <Plus className="h-4 w-4 text-primary" />;
    if (action.includes("update") || action.includes("edit")) return <CheckCircle className="h-4 w-4 text-chart-2" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("delete")) return "destructive";
    if (action.includes("create") || action.includes("add")) return "default";
    return "secondary";
  };

  const appointmentTotal = appointmentsData?.total ?? 0;
  const openPct = appointmentTotal > 0 ? Math.round(((appointmentsData?.open ?? 0) / appointmentTotal) * 100) : 0;
  const closedPct = appointmentTotal > 0 ? Math.round(((appointmentsData?.closed ?? 0) / appointmentTotal) * 100) : 0;

  const smsTotal = smsData?.total ?? 0;
  const smsCompletionRate = smsTotal > 0 ? Math.round(((smsData?.completed ?? 0) / smsTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 to-primary p-6 md:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxek0yNCAyNGgxMnYtMkgyNHYyem0wLTRoMTJ2LTJIMjR2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-6 w-6" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          </div>
          <p className="text-primary-foreground/80 max-w-lg">
            Monitor your business operations, track appointments, and manage resources — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm">
              <Building2 className="h-3 w-3 mr-1" /> {companiesData?.active ?? 0} Active Companies
            </Badge>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm">
              <CalendarDays className="h-3 w-3 mr-1" /> {appointmentsData?.open ?? 0} Open Appointments
            </Badge>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm">
              <Users className="h-3 w-3 mr-1" /> {employeesCount} Employees
            </Badge>
          </div>
        </div>
      </div>

      {/* Primary Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Companies", value: companiesData?.active ?? 0, sub: `${companiesData?.inactive ?? 0} inactive`, icon: Building2, href: "/admin/companies/active", gradient: "from-primary/10 to-primary/5" },
          { title: "Appointments", value: appointmentsData?.total ?? 0, sub: `${appointmentsData?.open ?? 0} open`, icon: CalendarDays, href: "/admin/appointments/list", gradient: "from-chart-2/10 to-chart-2/5" },
          { title: "Customers", value: customersCount, sub: "Registered", icon: UserCheck, href: "/admin/customers/list", gradient: "from-chart-3/10 to-chart-3/5" },
          { title: "Employees", value: employeesCount, sub: "On team", icon: Users, href: "/admin/employees/list", gradient: "from-chart-5/10 to-chart-5/5" },
        ].map((stat) => (
          <Card
            key={stat.title}
            className="group cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            onClick={() => navigate(stat.href)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.title}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "Services", value: servicesData?.active ?? 0, icon: Briefcase, href: "/admin/services/list" },
          { title: "Vendors", value: vendorsCount, icon: Store, href: "/admin/vendors/list" },
          { title: "SMS Links", value: smsTotal, icon: MessageSquare, href: "/admin/sms-link/list" },
          { title: "Brands", value: brandsCount, icon: Zap, href: "/admin/page-builder/equipment-brands" },
        ].map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60"
            onClick={() => navigate(stat.href)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <stat.icon className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/admin/appointments/calendar")}>
                Calendar <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(!appointmentsData?.upcoming || appointmentsData.upcoming.length === 0) ? (
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Button size="sm" className="mt-3" onClick={() => navigate("/admin/appointments/add")}>
                  <Plus className="h-3 w-3 mr-1" /> Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {appointmentsData.upcoming.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium text-primary leading-none">{format(new Date(apt.scheduled_date), "MMM")}</span>
                      <span className="text-sm font-bold text-primary leading-tight">{format(new Date(apt.scheduled_date), "d")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{apt.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{apt.scheduled_time} · {apt.appointment_type}</p>
                    </div>
                    <Badge variant={apt.status === "open" ? "outline" : "secondary"} className="shrink-0 text-xs">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Breakdown */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Appointment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{appointmentTotal}</div>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Open</span>
                  <span className="font-medium text-foreground">{appointmentsData?.open ?? 0}</span>
                </div>
                <Progress value={openPct} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Cancelled</span>
                  <span className="font-medium text-foreground">{appointmentsData?.cancelled ?? 0}</span>
                </div>
                <Progress value={appointmentTotal > 0 ? Math.round(((appointmentsData?.cancelled ?? 0) / appointmentTotal) * 100) : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Closed</span>
                  <span className="font-medium text-foreground">{appointmentsData?.closed ?? 0}</span>
                </div>
                <Progress value={closedPct} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMS & Activity Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* SMS Link Performance */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              SMS Link Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {smsTotal === 0 ? (
              <div className="text-center py-6">
                <Send className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No SMS links sent yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="text-lg font-bold text-primary">{smsCompletionRate}%</span>
                </div>
                {[
                  { label: "Pending", count: smsData?.pending ?? 0, color: "bg-muted-foreground" },
                  { label: "Sent", count: smsData?.sent ?? 0, color: "bg-chart-2" },
                  { label: "Opened", count: smsData?.opened ?? 0, color: "bg-chart-3" },
                  { label: "Completed", count: smsData?.completed ?? 0, color: "bg-primary" },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${step.color} shrink-0`} />
                    <span className="text-sm text-muted-foreground flex-1">{step.label}</span>
                    <span className="text-sm font-medium text-foreground">{step.count}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/admin/logs/list")}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{log.entity_type}</p>
                        <Badge variant={getActionBadgeVariant(log.action)} className="text-[10px] px-1.5 py-0 h-4">
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{log.user_email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Add Company", href: "/admin/companies/add", icon: Building2 },
              { label: "Book Appointment", href: "/admin/appointments/add", icon: CalendarDays },
              { label: "Add Employee", href: "/admin/employees/add", icon: Users },
              { label: "Add Customer", href: "/admin/customers/add", icon: UserCheck },
              { label: "Send SMS", href: "/admin/sms-link/send", icon: Send },
              { label: "Log Call", href: "/admin/logs/call", icon: Phone },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                onClick={() => navigate(action.href)}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Companies Preview + Service Terms */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Active Companies */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Active Companies
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/admin/companies/active")}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(!companiesData?.recent || companiesData.recent.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No companies yet</p>
            ) : (
              <div className="space-y-2">
                {companiesData.recent.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/companies/view/${company.id}`)}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[company.company_city, company.company_state].filter(Boolean).join(", ") || "No location set"}
                      </p>
                    </div>
                    {company.slug && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); navigate(`/company/${company.slug}`); }}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Services */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Active Services
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/admin/services/list")}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(!servicesData?.list || servicesData.list.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No services yet</p>
            ) : (
              <div className="space-y-2">
                {servicesData.list.map((service) => (
                  <div key={service.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{service.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
