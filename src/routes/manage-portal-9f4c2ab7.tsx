import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminAccess } from "@/lib/admin.functions";
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

async function waitForSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Give the client one tick to finish restoring from storage / an OAuth hash.
  return await new Promise<any>((resolve) => {
    const timer = setTimeout(() => {
      sub.data.subscription.unsubscribe();
      resolve(null);
    }, 1200);
    const sub = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        clearTimeout(timer);
        sub.data.subscription.unsubscribe();
        resolve(s);
      }
    });
  });
}

export const Route = createFileRoute("/manage-portal-9f4c2ab7")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Wait for the Supabase client to rehydrate its persisted session before
    // deciding — a cold load resolves storage asynchronously.
    const session = await waitForSession();
    if (!session) {
      // Only protected portal routes bounce; the login page lives outside this
      // layout (`manage-portal-9f4c2ab7_/login`) and is never guarded.
      throw redirect({
        to: "/manage-portal-9f4c2ab7/login",
        search: { redirect: location.href },
      });
    }
  },
  loader: async () => {
    const res = await getMyAdminAccess();
    // Authenticated but not staff, or admin profile disabled: no portal, no hints.
    if (!res.roles.length || !res.isActive) throw redirect({ to: "/" });
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
    router.navigate({ to: "/manage-portal-9f4c2ab7/login", search: { redirect: undefined } });
  };

  const defaultOpen =
    typeof document !== "undefined"
      ? !/(?:^|;\s*)sidebar_state=false(?:;|$)/.test(document.cookie)
      : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <LangBoot />
      <div className="admin-shell admin-scope flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="min-w-0 flex-1 bg-transparent">
          <header className="glass sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/70 px-3 sm:h-16 sm:gap-3 sm:px-5">
            <SidebarTrigger aria-label={t("admin.toggleSidebar")} />
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <div className="min-w-0 flex-1 overflow-hidden text-sm font-medium">
              <AdminBreadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-0.5 text-xs sm:gap-1.5 text-muted-foreground">
              <span className="hidden rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent lg:inline">
                {roles.map((r: string) => t(`admin.roles.${r}`, { defaultValue: r.replace(/_/g, " ") })).join(" · ")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLang}
                className="h-8 gap-1.5 rounded-full text-xs font-semibold hover:bg-accent/10 hover:text-accent"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{t("common.lang")}</span>
              </Button>
              <ThemeToggle />
              <Button
                size="sm"
                variant="ghost"
                onClick={signOut}
                aria-label={t("admin.signout")}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">
            <Outlet />
          </main>

        </SidebarInset>
      </div>
      <UndoToastHost />
    </SidebarProvider>
  );
}

