import { LayoutDashboard, Image, Briefcase, Building2, Store, Users, ChevronDown, Plus, List, MapPin, Search, XCircle, Wrench, Package, Droplet, Map, ImageIcon, Layout, MapPinned } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
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
    title: "Cities", 
    icon: MapPin,
    children: [
      { title: "Import CSV", url: "/admin/cities/import", icon: Plus },
    ]
  },
  { 
    title: "Page Builder", 
    icon: Layout,
    children: [
      { 
        title: "HVAC Keywords", 
        url: "/admin/page-builder/hvac-keywords", 
        icon: Search,
        children: [
          { title: "Negative Keywords", url: "/admin/page-builder/negative-keywords", icon: XCircle },
        ]
      },
      { title: "HVAC Parts", url: "/admin/page-builder/hvac-parts", icon: Wrench },
      { title: "Equipment Brands", url: "/admin/page-builder/equipment-brands", icon: Package },
      { title: "Plumbing Brands", url: "/admin/page-builder/plumbing-brands", icon: Droplet },
      { title: "Areas We Service", url: "/admin/page-builder/areas-service", icon: Map },
      { title: "Images & Logos", url: "/admin/page-builder/images-logos", icon: ImageIcon },
      { title: "Site Templates", url: "/admin/page-builder/site-templates", icon: Layout },
      { title: "Local Business", url: "/admin/page-builder/local-business", icon: MapPinned },
    ]
  },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    menuItems.reduce((acc, item) => {
      const isGroupActive = item.children.some(child => currentPath.startsWith(child.url));
      acc[item.title] = isGroupActive;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const isActive = (path: string) => currentPath === path;

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Collapsible
                  key={item.title}
                  open={openGroups[item.title]}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <item.icon className="h-4 w-4" />
                        {open && (
                          <>
                            <span>{item.title}</span>
                            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openGroups[item.title] ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {open && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.url} className="w-full">
                              {child.children ? (
                                <Collapsible defaultOpen={child.children.some(subChild => isActive(subChild.url))}>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton
                                      onClick={() => navigate(child.url)}
                                      className={`cursor-pointer w-full ${isActive(child.url) ? "bg-accent text-accent-foreground" : ""}`}
                                    >
                                      <child.icon className="h-4 w-4" />
                                      <span>{child.title}</span>
                                      <ChevronDown className="ml-auto h-3 w-3" />
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <SidebarMenuSub>
                                      {child.children.map((subChild) => (
                                        <SidebarMenuSubItem key={subChild.url} className="w-full">
                                          <SidebarMenuSubButton
                                            onClick={() => navigate(subChild.url)}
                                            className={`cursor-pointer pl-2 w-full ${isActive(subChild.url) ? "bg-accent text-accent-foreground" : ""}`}
                                          >
                                            <subChild.icon className="h-4 w-4" />
                                            <span>{subChild.title}</span>
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      ))}
                                    </SidebarMenuSub>
                                  </CollapsibleContent>
                                </Collapsible>
                              ) : (
                                <SidebarMenuSubButton
                                  onClick={() => navigate(child.url)}
                                  className={`cursor-pointer w-full ${isActive(child.url) ? "bg-accent text-accent-foreground" : ""}`}
                                >
                                  <child.icon className="h-4 w-4" />
                                  <span>{child.title}</span>
                                </SidebarMenuSubButton>
                              )}
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
