import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaffRoles } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { LogOut, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AdminSidebar } from "@/components/admin/app-sidebar";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { UndoToastHost } from "@/components/admin/undo-toast-host";
import { LangBoot } from "@/components/site/lang-boot";
import { getContentLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/manage-portal-9f4c2ab7")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    // Unauthenticated visitors are bounced to the public home page — the hidden
    // portal never reveals a login screen on deeper routes.
    if (!data.session) throw redirect({ to: "/" });
  },
  loader: async () => {
    const res = await getMyStaffRoles();
    if (!res.roles.length) throw redirect({ to: "/" });
    return { roles: res.roles };
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — GoStation" }, { name: "robots", content: "noindex" }] }),
});

function AdminLayout() {
  const { roles } = Route.useLoaderData();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next =
      getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar" ? "en" : "ar";
    document.cookie = `gs_lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    i18n.changeLanguage(next);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/manage-portal-9f4c2ab7/login" });
  };

  const defaultOpen =
    typeof document !== "undefined"
      ? !/(?:^|;\s*)sidebar_state=false(?:;|$)/.test(document.cookie)
      : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <LangBoot />
      <div className="flex min-h-screen w-full bg-muted/30">
        <AdminSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger aria-label={t("admin.toggleSidebar")} />
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <AdminBreadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="hidden sm:inline">{roles.join(" · ")}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                className="h-8 gap-1.5 rounded-full text-xs font-semibold"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{t("common.lang")}</span>
              </Button>
              <ThemeToggle />
              <Button size="sm" variant="ghost" onClick={signOut} aria-label={t("admin.signout")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <UndoToastHost />
    </SidebarProvider>
  );
}

