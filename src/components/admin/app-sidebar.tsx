import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  MapPin,
  Newspaper,
  Briefcase,
  ShieldAlert,
  ScrollText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items: { title: string; url: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Stations", url: "/admin/stations", icon: MapPin },
  { title: "News", url: "/admin/news", icon: Newspaper },
  { title: "Careers", url: "/admin/careers", icon: Briefcase },
  { title: "Submissions", url: "/admin/submissions", icon: Inbox },
  { title: "Chat logs", url: "/admin/chats", icon: MessageSquare },
  { title: "Abuse events", url: "/admin/abuse", icon: ShieldAlert },
  { title: "Audit log", url: "/admin/audit", icon: ScrollText },
];


export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? currentPath === url : currentPath === url || currentPath.startsWith(`${url}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link
          to="/admin"
          className="flex items-center gap-2 px-2 py-2 font-semibold text-primary"
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">GoStation Admin</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    tooltip={item.title}
                  >
                    <Link to={item.url as never} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export const adminNavItems = items;
