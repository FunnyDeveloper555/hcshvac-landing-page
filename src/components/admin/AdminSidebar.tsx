import { LayoutDashboard, Image, Briefcase, Building2, Store, Users, ChevronDown, Plus, List, MapPin, Search, XCircle, CheckCircle, Wrench, Package, Droplet, Map, ImageIcon, Layout, MapPinned, Database, CalendarDays, Calendar, FileText, UserCheck, MessageSquare, Send, Building, FileCheck, Car, MapPinned as GpsIcon, Camera, ClipboardList, Archive, BookOpen, Stethoscope, FileStack, Award, Warehouse, CalendarPlus, ServerCog, Cog, Layers, FileStack as PageStack, Loader2, MousePointer, Library, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
  children?: MenuItem[];
  isDynamic?: boolean;
}

const staticMenuItems: MenuItem[] = [
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
    title: "Employees", 
    icon: Users,
    children: [
      { title: "Add", url: "/admin/employees/add", icon: Plus },
      { title: "List", url: "/admin/employees/list", icon: List },
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
      { title: "Open & Closed", url: "/admin/appointments/list", icon: List },
      { title: "Calendar", url: "/admin/appointments/calendar", icon: Calendar },
    ]
  },
  { 
    title: "SMS Link", 
    icon: MessageSquare,
    children: [
      { title: "Send Link", url: "/admin/sms-link/send", icon: Send },
      { title: "Sent Links", url: "/admin/sms-link/list", icon: List },
    ]
  },
  { 
    title: "My Company", 
    icon: Building,
    children: [
      { 
        title: "Employees", 
        url: "/admin/my-company/employees", 
        icon: Users,
        children: [
          { title: "Add New Employee", url: "/admin/my-company/employees/add", icon: Plus },
          { title: "Current Employees", url: "/admin/my-company/employees/current", icon: List },
          { title: "Archived Employees", url: "/admin/my-company/employees/archived", icon: Archive },
          { title: "Assign & Assigned Items", url: "/admin/my-company/employees/assign", icon: ClipboardList },
          { title: "Employee Handbook", url: "/admin/my-company/employees/handbook", icon: BookOpen },
          { title: "Employee Consultations", url: "/admin/my-company/employees/consultations", icon: Stethoscope },
        ]
      },
      { 
        title: "Insurance Documents", 
        url: "/admin/my-company/insurance", 
        icon: FileStack,
        children: [
          { title: "Add New Documents", url: "/admin/my-company/insurance/add", icon: Plus },
          { title: "Expired / Archived Documents", url: "/admin/my-company/insurance/archived", icon: Archive },
        ]
      },
      { 
        title: "Company Licensing", 
        url: "/admin/my-company/licensing", 
        icon: Award,
        children: [
          { title: "Add New License Document", url: "/admin/my-company/licensing/add", icon: Plus },
          { title: "Expired / Archived License Documents", url: "/admin/my-company/licensing/archived", icon: Archive },
        ]
      },
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
    title: "Tools Inventory & Assignment", 
    icon: Warehouse,
    children: [
      { title: "Add Tool", url: "/admin/tools/add", icon: Plus },
      { title: "Inventory List", url: "/admin/tools/list", icon: List },
      { title: "Assignments", url: "/admin/tools/assignments", icon: ClipboardList },
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
      { title: "Activity Log", url: "/admin/logs/list", icon: List },
    ]
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Fetch active companies for Page Builder submenu
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

  // Common submenus that appear under each company
  const companySubmenus: MenuItem[] = [
    { title: "Website Preview", url: "/admin/page-builder/profile", icon: FileCheck },
    { title: "Top Header", url: "/admin/page-builder/top-header", icon: Layout },
    { title: "Banner", url: "/admin/page-builder/banner", icon: Layout },
    { 
      title: "Header Menus", 
      url: "/admin/page-builder/header-menus", 
      icon: FileText,
      children: [
        { title: "About Us", url: "/admin/page-builder/header-pages/about-us", icon: FileText },
        { title: "Financing", url: "/admin/page-builder/header-pages/financing", icon: FileText },
        { title: "Services", url: "/admin/page-builder/header-pages/services", icon: Briefcase },
        { title: "Residential", url: "/admin/page-builder/header-pages/residential", icon: Building2 },
        { title: "Commercial", url: "/admin/page-builder/header-pages/commercial", icon: Building },
        { title: "Air Quality", url: "/admin/page-builder/header-pages/air-quality", icon: Droplet },
      ]
    },
    { 
      title: "Accordion List", 
      url: "/admin/page-builder/accordion-list", 
      icon: Layers,
      children: [
        { 
          title: "HVAC", 
          url: "/admin/page-builder/accordion-list/hvac", 
          icon: Cog,
          children: [
            { title: "Brands We Install", url: "/admin/page-builder/accordion-list/hvac/brands-install", icon: Package },
            { title: "We Service", url: "/admin/page-builder/accordion-list/hvac/service", icon: Wrench },
            { title: "We Repair", url: "/admin/page-builder/accordion-list/hvac/repair", icon: Wrench },
            { title: "We Install", url: "/admin/page-builder/accordion-list/hvac/install", icon: Package },
            { title: "Parts We Install", url: "/admin/page-builder/accordion-list/hvac/parts-install", icon: Wrench },
            { title: "Comfort Accessories We Install", url: "/admin/page-builder/accordion-list/hvac/accessories-install", icon: Package },
          ]
        },
        { 
          title: "Plumbing", 
          url: "/admin/page-builder/accordion-list/plumbing", 
          icon: Droplet,
          children: [
            { title: "Brands We Service", url: "/admin/page-builder/accordion-list/plumbing/brands-service", icon: Package },
            { title: "Types We Service", url: "/admin/page-builder/accordion-list/plumbing/types-service", icon: Wrench },
            { title: "Types We Install", url: "/admin/page-builder/accordion-list/plumbing/types-install", icon: Package },
            { title: "Water Quality We Install", url: "/admin/page-builder/accordion-list/plumbing/water-quality", icon: Droplet },
            { title: "Hot Water Boiler", url: "/admin/page-builder/accordion-list/plumbing/hot-water-boiler", icon: Droplet },
            { title: "Steam Boilers", url: "/admin/page-builder/accordion-list/plumbing/steam-boilers", icon: Droplet },
            { title: "Tankless Water Heaters", url: "/admin/page-builder/accordion-list/plumbing/tankless-heaters", icon: Droplet },
          ]
        },
        { title: "Coupon", url: "/admin/page-builder/accordion-list/coupon", icon: FileText },
      ]
    },
    { title: "Campaign Dashboard", url: "/admin/page-builder/campaigns", icon: Layers },
    { title: "Page Templates", url: "/admin/page-builder/templates", icon: PageStack },
    { 
      title: "CTA Icons", 
      url: "/admin/page-builder/cta-icons", 
      icon: MousePointer,
      children: [
        { title: "Add Icon", url: "/admin/page-builder/cta-icons/add", icon: Plus },
        { title: "Library", url: "/admin/page-builder/cta-icons/library", icon: Library },
        { title: "Assignments", url: "/admin/page-builder/cta-icons/assignments", icon: Settings },
      ]
    },
    { 
      title: "HVAC Keywords", 
      url: "/admin/page-builder/hvac-keywords", 
      icon: Search,
      children: [
        { title: "Positive Keywords", url: "/admin/page-builder/positive-keywords", icon: CheckCircle },
        { title: "Negative Keywords", url: "/admin/page-builder/negative-keywords", icon: XCircle },
        { title: "Negative Search Terms", url: "/admin/page-builder/negative-search-terms", icon: XCircle },
        { title: "Positive Search Terms", url: "/admin/page-builder/positive-search-terms", icon: CheckCircle },
      ]
    },
    { title: "HVAC Parts", url: "/admin/page-builder/hvac-parts", icon: Wrench },
    { title: "Equipment Brands", url: "/admin/page-builder/equipment-brands", icon: Package },
    { title: "Plumbing Brands", url: "/admin/page-builder/plumbing-brands", icon: Droplet },
    { title: "Areas We Service", url: "/admin/page-builder/areas-service", icon: Map },
    { title: "Images", url: "/admin/page-builder/images-logos", icon: ImageIcon },
    { title: "Site Templates", url: "/admin/page-builder/site-templates", icon: Layout },
    { title: "Local Business", url: "/admin/page-builder/local-business", icon: MapPinned },
  ];

  // Build dynamic Page Builder menu with companies containing all submenus
  const pageBuilderMenu: MenuItem = useMemo(() => ({
    title: "Page Builder",
    icon: Layout,
    children: companies.map(company => ({
      title: company.name,
      url: `/admin/page-builder/company/${company.id}`,
      icon: Building2,
      children: companySubmenus.map(submenu => ({
        ...submenu,
        // Update URLs to include company ID
        url: submenu.url ? `/admin/page-builder/company/${company.id}${submenu.url.replace('/admin/page-builder', '')}` : undefined,
        children: submenu.children?.map(child => ({
          ...child,
          url: child.url ? `/admin/page-builder/company/${company.id}${child.url.replace('/admin/page-builder', '')}` : undefined,
        })),
      })),
    })),
  }), [companies]);

  // Build menu items with Page Builder inserted after Companies
  const menuItems = useMemo(() => {
    const companiesIndex = staticMenuItems.findIndex(item => item.title === "Companies");
    const items = [...staticMenuItems];
    items.splice(companiesIndex + 1, 0, pageBuilderMenu);
    return items;
  }, [pageBuilderMenu]);

  // Initialize open groups based on current path - only runs once per path change
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
              onClick={() => child.url && navigate(child.url)}
              className={`cursor-pointer w-full min-w-0 flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${child.url && isActive(child.url) ? "bg-accent text-accent-foreground" : ""}`}
            >
              <child.icon className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1 min-w-0 text-left">{child.title}</span>
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
            {menuItems.map((item) => (
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
                      {item.title === "Page Builder" && companiesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      ) : (
                        <ChevronDown className={`h-4 w-4 transition-transform shrink-0 ${openGroups[item.title] ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  {item.children && (
                    <CollapsibleContent>
                      <div className="min-w-0 pl-4 border-l border-sidebar-border ml-4 mt-1">
                        {renderMenuChildren(item.children)}
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
