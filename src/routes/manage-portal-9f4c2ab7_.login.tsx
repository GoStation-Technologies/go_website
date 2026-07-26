import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/manage-portal-9f4c2ab7_/login")({
  ssr: false,
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin sign in — GoStation" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/manage-portal-9f4c2ab7" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/manage-portal-9f4c2ab7/login`,
    });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <div
      dir="ltr"
      className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12"
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">GoStation Admin</h1>
          <p className="text-sm text-muted-foreground">
            Staff access only. Sign in to continue.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" required autoComplete="email" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <div className="my-4 text-center text-xs text-muted-foreground">or</div>
            <Button variant="outline" className="w-full" onClick={google}>
              Continue with Google
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Accounts are provisioned by GoStation IT.
        </p>
      </div>
    </div>
  );
}
