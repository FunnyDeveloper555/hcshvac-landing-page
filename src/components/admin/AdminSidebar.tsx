import { LayoutDashboard, Image, Briefcase, Building2, Store, Users, ChevronDown, Plus, List } from "lucide-react";
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
      { title: "List", url: "/admin/companies/list", icon: List },
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
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
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
                            <SidebarMenuSubItem key={child.url}>
                              <SidebarMenuSubButton
                                onClick={() => navigate(child.url)}
                                className={`cursor-pointer ${isActive(child.url) ? "bg-accent text-accent-foreground" : ""}`}
                              >
                                <child.icon className="h-4 w-4" />
                                <span>{child.title}</span>
                              </SidebarMenuSubButton>
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
    </Sidebar>
  );
}
