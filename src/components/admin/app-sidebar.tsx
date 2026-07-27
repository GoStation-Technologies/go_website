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
  MailCog,

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
  { key: "overview", url: "/manage-portal-9f4c2ab7", icon: LayoutDashboard, exact: true },
  { key: "stations", url: "/manage-portal-9f4c2ab7/stations", icon: MapPin },
  { key: "news", url: "/manage-portal-9f4c2ab7/news", icon: Newspaper },
  { key: "careers", url: "/manage-portal-9f4c2ab7/careers", icon: Briefcase },
  { key: "submissions", url: "/manage-portal-9f4c2ab7/submissions", icon: Inbox },
  { key: "chats", url: "/manage-portal-9f4c2ab7/chats", icon: MessageSquare },
  { key: "abuse", url: "/manage-portal-9f4c2ab7/abuse", icon: ShieldAlert },
  { key: "audit", url: "/manage-portal-9f4c2ab7/audit", icon: ScrollText },
  { key: "notifications", url: "/manage-portal-9f4c2ab7/notifications", icon: MailCog },
];


export function AdminSidebar() {
  const { t, i18n } = useTranslation();
  const rtl = isRtl(i18n.resolvedLanguage ?? i18n.language);
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? currentPath === url : currentPath === url || currentPath.startsWith(`${url}/`);

  return (
    <Sidebar collapsible="icon" side={rtl ? "right" : "left"} className="border-0 [&>[data-sidebar=sidebar]]:border-e [&>[data-sidebar=sidebar]]:border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">

        <Link
          to="/manage-portal-9f4c2ab7"
          className="flex h-11 items-center gap-3 overflow-hidden rounded-lg px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="bg-ember flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-glow">
            <LayoutDashboard className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-sm font-bold tracking-tight text-sidebar-foreground">
              {t("admin.brand")}
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">
              GoStation
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
            {t("admin.workspace")}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const label = t(`admin.nav.${item.key}`);
                const active = isActive(item.url, item.exact);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={label}
                      className="h-10 rounded-xl text-[13px] font-medium text-sidebar-foreground/75 transition hover:bg-accent/10 hover:text-accent data-[active=true]:bg-accent/12 data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground"
                    >
                      <Link
                        to={item.url as never}
                        className="relative flex w-full min-w-0 items-center gap-3 text-start"
                      >
                        {active && (
                          <span className="bg-ember absolute inset-y-2 start-0 w-1 rounded-full group-data-[collapsible=icon]:hidden" />
                        )}
                        <item.icon
                          className={`h-4.5 w-4.5 shrink-0 ${active ? "text-accent" : "text-sidebar-foreground/55"}`}
                        />
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
