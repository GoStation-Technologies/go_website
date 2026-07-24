import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyStaffRoles } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function UserMenu() {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!email) {
      setIsStaff(false);
      return;
    }
    getMyStaffRoles()
      .then((r) => setIsStaff((r?.roles ?? []).length > 0))
      .catch(() => setIsStaff(false));
  }, [email]);

  if (!email) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 rounded-full text-xs font-semibold"
      >
        <Link to="/auth">{t("nav.signin", { defaultValue: "Sign in" })}</Link>
      </Button>
    );
  }

  const initial = email.charAt(0).toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 rounded-full pe-3 ps-1 text-xs font-semibold"
          aria-label={`Signed in as ${email}`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initial}
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            Signed in as
          </span>
          <span className="max-w-[120px] truncate text-foreground sm:max-w-[160px]">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <UserIcon className="h-3.5 w-3.5" />
          <span className="truncate">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isStaff && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <LayoutDashboard className="me-2 h-4 w-4" />
              Admin dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="me-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
