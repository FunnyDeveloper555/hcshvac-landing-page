import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  CalendarDays,
  Briefcase,
  Store,
  UserCheck,
  MessageSquare,
  FileText,
  Layout,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  href: string;
  color: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: companiesCount = 0 } = useQuery({
    queryKey: ["dashboard-companies"],
    queryFn: async () => {
      const { count } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count ?? 0;
    },
  });

  const { data: employeesCount = 0 } = useQuery({
    queryKey: ["dashboard-employees"],
    queryFn: async () => {
      const { count } = await supabase.from("employees").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: servicesCount = 0 } = useQuery({
    queryKey: ["dashboard-services"],
    queryFn: async () => {
      const { count } = await supabase.from("services").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count ?? 0;
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
    queryKey: ["dashboard-appointments"],
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("status");
      const open = data?.filter((a) => a.status === "open").length ?? 0;
      const closed = data?.filter((a) => a.status === "closed").length ?? 0;
      return { total: data?.length ?? 0, open, closed };
    },
  });

  const { data: smsCount = 0 } = useQuery({
    queryKey: ["dashboard-sms"],
    queryFn: async () => {
      const { count } = await supabase.from("booking_invitations").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: serviceTermsCount = 0 } = useQuery({
    queryKey: ["dashboard-service-terms"],
    queryFn: async () => {
      const { count } = await supabase.from("service_terms").select("*", { count: "exact", head: true }).eq("is_active", true);
      return count ?? 0;
    },
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["dashboard-recent-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_logs")
        .select("action, entity_type, user_email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const stats: StatCard[] = [
    { title: "Active Companies", value: companiesCount, icon: Building2, href: "/admin/companies/active", color: "text-primary", description: "Currently active" },
    { title: "Employees", value: employeesCount, icon: Users, href: "/admin/employees/list", color: "text-chart-2", description: "Total registered" },
    { title: "Services", value: servicesCount, icon: Briefcase, href: "/admin/services/list", color: "text-chart-3", description: "Active services" },
    { title: "Vendors", value: vendorsCount, icon: Store, href: "/admin/vendors/list", color: "text-chart-5", description: "Registered vendors" },
    { title: "Customers", value: customersCount, icon: UserCheck, href: "/admin/customers/list", color: "text-chart-2", description: "Total registrations" },
    { title: "Appointments", value: appointmentsData?.total ?? 0, icon: CalendarDays, href: "/admin/appointments/list", color: "text-chart-4", description: `${appointmentsData?.open ?? 0} open` },
    { title: "SMS Links", value: smsCount, icon: MessageSquare, href: "/admin/sms-link/list", color: "text-chart-1", description: "Total sent" },
    { title: "Service Terms", value: serviceTermsCount, icon: FileText, href: "/admin/services/terms", color: "text-chart-3", description: "Active terms" },
  ];

  const quickActions = [
    { label: "Add Company", href: "/admin/companies/add", icon: Building2 },
    { label: "Book Appointment", href: "/admin/appointments/add", icon: CalendarDays },
    { label: "Add Employee", href: "/admin/employees/add", icon: Users },
    { label: "Add Customer", href: "/admin/customers/add", icon: UserCheck },
    { label: "Send SMS Link", href: "/admin/sms-link/send", icon: MessageSquare },
    { label: "Log Call", href: "/admin/logs/call", icon: FileText },
  ];

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your admin panel activity and resources.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section: Quick Actions + Recent Activity */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-3 flex items-center justify-start gap-2"
                onClick={() => navigate(action.href)}
              >
                <action.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/logs/list")} className="text-xs">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5">
                      {log.action.includes("delete") ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {log.action} — {log.entity_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.user_email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointments Overview */}
      {appointmentsData && appointmentsData.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Appointments Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-foreground">{appointmentsData.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-chart-3">{appointmentsData.open}</div>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-primary">{appointmentsData.closed}</div>
                <p className="text-sm text-muted-foreground">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
