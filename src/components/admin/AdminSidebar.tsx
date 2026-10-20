import { LayoutDashboard, Image, Briefcase, Building2, Store, Users, ChevronDown, Plus, List, MapPin, Search, XCircle, CheckCircle, Wrench, Package, Droplet, Map, ImageIcon, Layout, MapPinned, Database, CalendarDays, Calendar, FileText, UserCheck, MessageSquare, Send, Building, FileCheck, Car, MapPinned as GpsIcon, Camera, ClipboardList, Archive, BookOpen, Stethoscope, FileStack, Award, Warehouse, CalendarPlus, ServerCog, Cog, Layers, FileStack as PageStack, Loader2, MousePointer, Library, Settings, Shield, Eye, FolderOpen, HardDrive, Globe, FolderClosed, UserPlus, Bell, Phone, History as HistoryIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
  children?: MenuItem[];
}

const staticMenuItems: MenuItem[] = [
  {
    title: "Chat",
    icon: MessageSquare,
    children: [{ title: "Messages", url: "/admin/chat", icon: MessageSquare }],
  },
  { 
    title: "Hero Content", 
    icon: LayoutDashboard,
    children: [
      { title: "Add", url: "/admin/hero/add", icon: Plus },
      { title: "List", url: "/admin/hero/list", icon: List },
    ]
  },
  { 
    title: "Hero Images", 
    icon: Image,
    children: [
      { title: "Add", url: "/admin/images/add", icon: Plus },
      { title: "List", url: "/admin/images/list", icon: List },
    ]
  },
  { 
    title: "Services", 
    icon: Briefcase,
    children: [
      { title: "Add", url: "/admin/services/add", icon: Plus },
      { title: "List", url: "/admin/services/list", icon: List },
    ]
  },
  { 
    title: "Service Terms", 
    icon: FileText,
    children: [
      { title: "Add", url: "/admin/services/terms/add", icon: Plus },
      { title: "List", url: "/admin/services/terms", icon: List },
    ]
  },
  { 
    title: "Companies", 
    icon: Building2,
    children: [
      { title: "Add", url: "/admin/companies/add", icon: Plus },
      { title: "Active Companies", url: "/admin/companies/active", icon: List },
      { title: "Deactive Companies", url: "/admin/companies/deactive", icon: List },
    ]
  },
  { 
    title: "Vendors", 
    icon: Store,
    children: [
      { title: "Add", url: "/admin/vendors/add", icon: Plus },
      { title: "List", url: "/admin/vendors/list", icon: List },
    ]
  },
  { 
    title: "Customers", 
    icon: UserCheck,
    children: [
      { title: "Add", url: "/admin/customers/add", icon: Plus },
      { title: "List", url: "/admin/customers/list", icon: List },
    ]
  },

  { 
    title: "Appointments", 
    icon: CalendarDays,
    children: [
      { title: "Book New", url: "/admin/appointments/add", icon: Plus },
      { title: "New Ticket", url: "/admin/tickets/add", icon: Plus },
      { title: "New Task", url: "/admin/tasks/add", icon: Plus },
      { title: "Open", url: "/admin/appointments/open", icon: CheckCircle },
      { title: "Closed", url: "/admin/appointments/closed", icon: FolderClosed },
      { title: "Tickets", url: "/admin/tickets/list", icon: List },
      { title: "Tasks", url: "/admin/tasks/list", icon: List },
      { title: "Tickets & Tasks Board", url: "/admin/work-items/board", icon: ClipboardList },
      { title: "Calendar", url: "/admin/appointments/calendar", icon: Calendar },
      { title: "Diagnostic Fees", url: "/admin/diagnostic-fees", icon: Stethoscope },
    ]
  },
  {
    title: "Site Profiles",
    icon: ClipboardList,
    children: [
      { title: "List", url: "/admin/site-profiles/list", icon: List },
      { title: "Logs", url: "/admin/site-profiles/logs", icon: List },
    ]
  },
  {
    title: "Installations",
    icon: Wrench,
    children: [
      { title: "We Installed", url: "/admin/installations/add", icon: Plus },
      { title: "We Installed History", url: "/admin/installations/list", icon: List },
    ]
  },
  {
    title: "Inventory",
    icon: Warehouse,
    children: [
      { title: "Receiving", url: "/admin/inventory/receiving", icon: Archive },
      { title: "Add New Inventory", url: "/admin/inventory/add", icon: Plus },
      { title: "History", url: "/admin/inventory/history", icon: List },
    ]
  },
  {
    title: "ScreenPops",
    icon: Bell,
    children: [
      { title: "Calls", url: "/admin/screen-pops/calls", icon: Phone },
      { title: "SMS", url: "/admin/screen-pops/sms", icon: MessageSquare },
    ]
  },
  {
    title: "SMS Link",
    icon: MessageSquare,
    children: [
      { title: "Send", url: "/admin/sms-link/send", icon: Send },
      { title: "List", url: "/admin/sms-link/list", icon: List },
    ]
  },
  { 
    title: "My Company", 
    icon: Building,
    children: [
      {
        title: "Active Employees",
        icon: Users,
        children: [
          { title: "Employee Bios", url: "/admin/employees/list", icon: List },
          { title: "Add Employee", url: "/admin/employees/add", icon: Plus },
        ]
      },
      {
        title: "Employee Archive",
        icon: Archive,
        children: [
          { title: "Non-Active Employees", url: "/admin/employees/archive", icon: List },
        ]
      },
      {
        title: "Applicants",
        icon: UserPlus,
        children: [
          { title: "Applicant List", url: "/admin/new-hire/list", icon: List },
          { title: "Application / Hiring File", url: "/admin/employees/application", icon: FileText },
          { title: "Send Application Link", url: "/admin/new-hire/send", icon: Send },
        ]
      },
      { 
        title: "Insurance Documents", 
        icon: FileStack,
        children: [
          { title: "Upload New Documents", url: "/admin/my-company/insurance/add", icon: Plus },
          { title: "Active Documents", url: "/admin/my-company/insurance/active", icon: CheckCircle },
          { title: "Expired / Archived Documents", url: "/admin/my-company/insurance/archived", icon: Archive },
        ]
      },
      { 
        title: "Company Licensing", 
        icon: Award,
        children: [
          { title: "Upload Licensing Document", url: "/admin/my-company/licensing/add", icon: Plus },
          { title: "Active Licensing Documents", url: "/admin/my-company/licensing/active", icon: CheckCircle },
          { title: "Expired / Archived Documents", url: "/admin/my-company/licensing/archived", icon: Archive },
        ]
      },
      { 
        title: "Other Office Locations", 
        icon: MapPinned,
        children: [
          { title: "List Locations", url: "/admin/office-locations/list", icon: List },
          { title: "Add Location", url: "/admin/office-locations/add", icon: Plus },
        ]
      },
      { 
        title: "Fleet Vehicles", 
        icon: Car,
        children: [
          { title: "Add New Fleet Vehicle", url: "/admin/fleet/add", icon: Plus },
          { title: "Current Fleet Vehicles", url: "/admin/fleet/list", icon: List },
          { title: "Fleet Alerts", url: "/admin/fleet/alerts", icon: ClipboardList },
          { title: "GPS Location", url: "/admin/fleet/gps", icon: GpsIcon },
          { title: "Dash Camera", url: "/admin/fleet/dash-camera", icon: Camera },
          { title: "Maintenance Logs", url: "/admin/fleet/maintenance", icon: FileText },
        ]
      },
      { 
        title: "Tools and Inventory", 
        icon: Warehouse,
        children: [
          { title: "Add Tool", url: "/admin/tools/add", icon: Plus },
          { title: "Inventory List", url: "/admin/tools/list", icon: List },
          { title: "Assignments", url: "/admin/tools/assignments", icon: ClipboardList },
        ]
      },
    ]
  },
  { 
    title: "Calendar", 
    icon: CalendarPlus,
    children: [
      { title: "Create New Calendar Entry", url: "/admin/calendar/add", icon: Plus },
      { title: "Current Calendar", url: "/admin/calendar/list", icon: List },
    ]
  },
  { 
    title: "Database Content PROFILE", 
    icon: ServerCog,
    children: [
      { title: "Areas We Service", url: "/admin/db-profile/areas-service", icon: Map },
      { title: "Services We Offer", url: "/admin/db-profile/services-offer", icon: Briefcase },
      { title: "Visit Types We Complete", url: "/admin/db-profile/visit-types", icon: ClipboardList },
      { title: "Equipment Brands We Service", url: "/admin/db-profile/equipment-brands-service", icon: Package },
      { title: "Equipment Brands We Install", url: "/admin/db-profile/equipment-brands-install", icon: Package },
      { title: "Plumbing Brands We Service", url: "/admin/db-profile/plumbing-brands-service", icon: Droplet },
      { title: "Plumbing Brands We Install", url: "/admin/db-profile/plumbing-brands-install", icon: Droplet },
      { title: "Equipment Types We Service", url: "/admin/db-profile/equipment-types-service", icon: Cog },
      { title: "Equipment Types We Install", url: "/admin/db-profile/equipment-types-install", icon: Cog },
      { title: "HVAC Parts We Install", url: "/admin/db-profile/hvac-parts-install", icon: Wrench },
      { title: "HVAC Comfort Accessories We Install", url: "/admin/db-profile/hvac-accessories-install", icon: Wrench },
    ]
  },
  { 
    title: "Cities", 
    icon: MapPin,
    children: [
      { title: "Import CSV", url: "/admin/cities/import", icon: Plus },
    ]
  },
  { 
    title: "Business", 
    icon: Database,
    children: [
      { title: "Import CSV", url: "/admin/business/import", icon: Plus },
    ]
  },
  { 
    title: "Logs", 
    icon: FileText,
    children: [
      { title: "Log Call", url: "/admin/logs/call", icon: Plus },
      { title: "Call Log", url: "/admin/logs/call-log", icon: List },
      { title: "Tickets", url: "/admin/logs/tickets", icon: List },
      { title: "Tasks", url: "/admin/logs/tasks", icon: List },
      { title: "Activity Log", url: "/admin/logs/list", icon: List },
    ]
  },
  {
    title: "User Management",
    icon: Shield,
    children: [
      { title: "Users & Roles", url: "/admin/users", icon: Users },
      { title: "User Groups", url: "/admin/users?tab=groups", icon: FolderOpen },
    ],
  },
  {
    title: "Email Lists",
    icon: Send,
    children: [
      { title: "All Lists", url: "/admin/email-lists", icon: List },
      { title: "New List", url: "/admin/email-lists/add", icon: Plus },
      { title: "Templates", url: "/admin/email-templates", icon: Library },
    ],
  },
  {
    title: "Products",
    icon: Package,
    children: [
      { title: "Add", url: "/admin/products/add", icon: Plus },
      { title: "List", url: "/admin/products/list", icon: List },
      { title: "Categories", url: "/admin/products/categories", icon: FolderOpen },
    ],
  },
  {
    title: "Content",
    icon: BookOpen,
    children: [
      { title: "Add", url: "/admin/contents/add", icon: Plus },
      { title: "List", url: "/admin/contents/list", icon: List },
    ],
  },
  {
    title: "Gallery",
    icon: Camera,
    children: [
      { title: "Add", url: "/admin/galleries/add", icon: Plus },
      { title: "List", url: "/admin/galleries/list", icon: List },
    ],
  },
  {
    title: "File Manager",
    icon: HardDrive,
    url: "/admin/file-manager",
  },
];

// Simplified company submenus - cascading items merged into single tabbed entries
const companySubmenus: MenuItem[] = [
  { title: "Website Preview", url: "/admin/page-builder/profile", icon: Eye },
  { title: "Top Header", url: "/admin/page-builder/top-header", icon: Layout },
  { title: "Banner", url: "/admin/page-builder/banner", icon: Layout },
  { title: "Header Menus", url: "/admin/page-builder/header-menus", icon: FileText },
  { title: "HVAC", url: "/admin/page-builder/hvac", icon: Cog },
  { title: "Plumbing", url: "/admin/page-builder/plumbing", icon: Droplet },
  { title: "Coupons", url: "/admin/page-builder/accordion-list/coupon", icon: FileText },
  { title: "Partner Listings", url: "/admin/page-builder/partner-listings", icon: Building2 },
  { title: "Marquee", url: "/admin/page-builder/marquee", icon: Layout },
  { title: "Popups", url: "/admin/page-builder/popups", icon: Eye },
  { title: "CTA Icons", url: "/admin/page-builder/cta-icons", icon: MousePointer },
  { title: "Campaigns", url: "/admin/page-builder/campaigns", icon: Layers },
  { title: "Templates", url: "/admin/page-builder/templates", icon: PageStack },
  { title: "Keywords", url: "/admin/page-builder/hvac-keywords", icon: Search },
  { title: "HVAC Parts", url: "/admin/page-builder/hvac-parts", icon: Wrench },
  { title: "Equipment Brands", url: "/admin/page-builder/equipment-brands", icon: Package },
  { title: "Plumbing Brands", url: "/admin/page-builder/plumbing-brands", icon: Droplet },
  { title: "Images", url: "/admin/page-builder/images-logos", icon: ImageIcon },
  { title: "Site Templates", url: "/admin/page-builder/site-templates", icon: Layout },
  { title: "Local Business", url: "/admin/page-builder/local-business", icon: MapPinned },
  {
    title: "Mass Pages",
    url: "/admin/page-builder/mass-pages",
    icon: MapPinned,
    children: [
      { title: "Campaigns", url: "/admin/page-builder/mass-pages", icon: MapPinned },
      { title: "Active Campaigns", url: "/admin/page-builder/mass-pages/master", icon: Layers },
      { title: "Campaign Template", url: "/admin/page-builder/mass-pages/templates", icon: PageStack },
      { title: "History", url: "/admin/page-builder/mass-pages/history", icon: HistoryIcon },



    ],
  },
  { title: "Domain Settings", url: "/admin/page-builder/domain-settings", icon: Globe },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["sidebar-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: appointmentCounts } = useQuery({
    queryKey: ["sidebar-appointment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("status");
      if (error) throw error;
      const open = data?.filter(a => a.status === "open").length ?? 0;
      const closed = data?.filter(a => a.status === "closed").length ?? 0;
      return { open, closed };
    },
  });

  const appointmentBadges: Record<string, number> = {
    "/admin/appointments/open": appointmentCounts?.open ?? 0,
    "/admin/appointments/closed": appointmentCounts?.closed ?? 0,
  };

  const updateUrlsWithCompanyId = (items: MenuItem[], companyId: string): MenuItem[] => {
    return items.map(item => ({
      ...item,
      url: item.url ? `/admin/page-builder/company/${companyId}${item.url.replace('/admin/page-builder', '')}` : undefined,
      children: item.children ? updateUrlsWithCompanyId(item.children, companyId) : undefined,
    }));
  };

  const pageBuilderMenu: MenuItem = useMemo(() => ({
    title: "Page Builder",
    icon: Layout,
    children: [
      ...companies.map(company => ({
        title: company.name,
        url: `/admin/page-builder/company/${company.id}`,
        icon: Building2,
        children: updateUrlsWithCompanyId(companySubmenus, company.id),
      })),
      { title: "Templates", url: "/admin/page-builder/templates", icon: PageStack },
      { title: "Site Templates", url: "/admin/page-builder/site-templates", icon: Layout },
    ],
  }), [companies]);

  const menuItems = useMemo(() => {
    const companiesIndex = staticMenuItems.findIndex(item => item.title === "Companies");
    const items = [...staticMenuItems];
    items.splice(companiesIndex + 1, 0, pageBuilderMenu);
    return items;
  }, [pageBuilderMenu]);

  const getInitialOpenGroups = useCallback(() => {
    return menuItems.reduce((acc, item) => {
      const isGroupActive = item.children?.some(child => 
        child.url ? currentPath.startsWith(child.url) : 
        child.children?.some(subChild => subChild.url && currentPath.startsWith(subChild.url))
      ) ?? false;
      acc[item.title] = isGroupActive;
      return acc;
    }, {} as Record<string, boolean>);
  }, [currentPath, menuItems]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => getInitialOpenGroups());
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({});

  const isActive = (path: string) => currentPath === path;

  const { data: unreadReplies } = useQuery({
    queryKey: ["sidebar-unread-replies"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await supabase
        .from("work_item_replies")
        .select("item_type")
        .eq("direction", "inbound")
        .is("read_at", null)
        .limit(500);
      const counts = { ticket: 0, task: 0 };
      (data || []).forEach((r: any) => { if (r.item_type in counts) counts[r.item_type as "ticket" | "task"]++; });
      return counts;
    },
  });
  const { data: chatUnread = 0 } = useQuery({
    queryKey: ["sidebar-chat-unread"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("chat_unread_counts");
      return (data || []).reduce((n: number, r: any) => n + Number(r.unread || 0), 0);
    },
  });
  const unreadDot: Record<string, boolean> = {
    "/admin/chat": chatUnread > 0,
    "/admin/tickets/list": (unreadReplies?.ticket || 0) > 0,
    "/admin/tasks/list": (unreadReplies?.task || 0) > 0,
    "/admin/work-items/board": ((unreadReplies?.ticket || 0) + (unreadReplies?.task || 0)) > 0,
  };
  const groupHasDot = (item: MenuItem) => !!item.children?.some((c) => c.url && unreadDot[c.url]);
  const Dot = () => <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-label="New replies" />;

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleSubGroup = (title: string) => {
    setOpenSubGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const renderMenuChildren = (children: MenuItem[], depth = 0) => {
    return children.map((child) => {
      const hasChildren = child.children && child.children.length > 0;
      const isSubGroupOpen = openSubGroups[child.title] ?? 
        (hasChildren && child.children?.some(subChild => subChild.url && currentPath.startsWith(subChild.url)));

      return (
        <div key={child.url || child.title} className="w-full min-w-0">
          {hasChildren ? (
            <Collapsible open={isSubGroupOpen} onOpenChange={() => toggleSubGroup(child.title)}>
              <CollapsibleTrigger asChild>
                <button
                  className={`cursor-pointer w-full min-w-0 flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${child.url && isActive(child.url) ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <child.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 min-w-0 text-left">{child.title}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${isSubGroupOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-4 border-l border-sidebar-border ml-4 mt-1">
                  {child.children && renderMenuChildren(child.children, depth + 1)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <button
              onClick={() => { child.url && navigate(child.url); onNavigate?.(); }}
              className={`cursor-pointer w-full min-w-0 flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${child.url && isActive(child.url) ? "bg-accent text-accent-foreground" : ""}`}
            >
              <child.icon className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1 min-w-0 text-left">{child.title}</span>
              {child.url && unreadDot[child.url] && <Dot />}
              {child.url && appointmentBadges[child.url] !== undefined && appointmentBadges[child.url] > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0 h-5 min-w-[1.25rem] flex items-center justify-center">{appointmentBadges[child.url]}</Badge>
              )}
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <div className="min-w-0 px-2">
          <div className="truncate px-2 mb-2 text-sm font-semibold text-sidebar-foreground/70">Admin Panel</div>
          <div className="min-w-0 space-y-1">
            <button
              onClick={() => { navigate("/admin"); onNavigate?.(); }}
              className={`w-full min-w-0 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${currentPath === "/admin" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1 min-w-0 text-left">Dashboard</span>
            </button>

            {menuItems.map((item) => (
              item.children ? (
                <Collapsible
                  key={item.title}
                  open={openGroups[item.title]}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <div className="min-w-0">
                    <CollapsibleTrigger asChild>
                      <button
                        className="w-full min-w-0 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        title={item.title}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1 min-w-0 text-left">{item.title}</span>
                        {groupHasDot(item) && <Dot />}
                        {item.title === "Page Builder" && companiesLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : (
                          <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${openGroups[item.title] ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="min-w-0 pl-4 border-l border-sidebar-border ml-4 mt-1">
                        {renderMenuChildren(item.children)}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ) : (
                <button
                  key={item.title}
                  onClick={() => { item.url && navigate(item.url); onNavigate?.(); }}
                  className={`w-full min-w-0 flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${item.url && isActive(item.url) ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 min-w-0 text-left">{item.title}</span>
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
