import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaffRoles } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Inbox, MessageSquare, MapPin, Newspaper, Briefcase, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  loader: async () => {
    const res = await getMyStaffRoles();
    if (!res.roles.length) {
      throw redirect({ to: "/" });
    }
    return { roles: res.roles };
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — GoStation" }, { name: "robots", content: "noindex" }] }),
});

function AdminLayout() {
  const { roles } = Route.useLoaderData();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2 font-semibold text-primary">
            <LayoutDashboard className="h-5 w-5" />
            GoStation Admin
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{roles.join(" · ")}</span>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <SideLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>Overview</SideLink>
          <SideLink to="/admin/stations" icon={<MapPin className="h-4 w-4" />}>Stations</SideLink>
          <SideLink to="/admin/news" icon={<Newspaper className="h-4 w-4" />}>News</SideLink>
          <SideLink to="/admin/careers" icon={<Briefcase className="h-4 w-4" />}>Careers</SideLink>
          <SideLink to="/admin/submissions" icon={<Inbox className="h-4 w-4" />}>Submissions</SideLink>
          <SideLink to="/admin/chats" icon={<MessageSquare className="h-4 w-4" />}>Chat logs</SideLink>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SideLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to as never}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent/10"
      activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
      activeOptions={{ exact: true }}
    >
      {icon}
      {children}
    </Link>
  );
}
