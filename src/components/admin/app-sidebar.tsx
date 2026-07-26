import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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

import { isRtl } from "@/lib/i18n";
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
} from "@/components/ui/sidebar";

const items: { key: string; url: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { key: "overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { key: "stations", url: "/admin/stations", icon: MapPin },
  { key: "news", url: "/admin/news", icon: Newspaper },
  { key: "careers", url: "/admin/careers", icon: Briefcase },
  { key: "submissions", url: "/admin/submissions", icon: Inbox },
  { key: "chats", url: "/admin/chats", icon: MessageSquare },
  { key: "abuse", url: "/admin/abuse", icon: ShieldAlert },
  { key: "audit", url: "/admin/audit", icon: ScrollText },
];

export function AdminSidebar() {
  const { t, i18n } = useTranslation();
  const rtl = isRtl(i18n.resolvedLanguage ?? i18n.language);
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? currentPath === url : currentPath === url || currentPath.startsWith(`${url}/`);

  return (
    <Sidebar collapsible="icon" side={rtl ? "right" : "left"}>
      <SidebarHeader className="border-b p-2">
        <Link
          to="/admin"
          className="flex h-10 items-center gap-2 overflow-hidden rounded-md px-2 font-semibold text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
            {t("admin.brand")}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("admin.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const label = t(`admin.nav.${item.key}`);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url, item.exact)}
                      tooltip={label}
                    >
                      <Link
                        to={item.url as never}
                        className="flex w-full min-w-0 items-center gap-2 text-start"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export const adminNavItems = items;
