import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — GoStation" }] }),
});

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setBusy(true);
    const res = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(mode === "signin" ? "Welcome back!" : "Account created!");
    navigate({ to: "/" });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 py-20">
        <Card><CardContent className="p-8">
          <h1 className="text-2xl font-bold">{t("auth.title")}</h1>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <div className="grid gap-1.5"><Label>{t("auth.email")}</Label><Input type="email" name="email" required /></div>
            <div className="grid gap-1.5"><Label>{t("auth.password")}</Label><Input type="password" name="password" required minLength={6} /></div>
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? t("common.submitting") : mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </Button>
          </form>
          <div className="my-4 text-center text-xs text-muted-foreground">{t("auth.or")}</div>
          <Button variant="outline" className="w-full" onClick={google}>{t("auth.google")}</Button>
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 block w-full text-center text-sm text-accent hover:underline">
            {mode === "signin" ? t("auth.noAccount") + " " + t("auth.signup") : t("auth.hasAccount") + " " + t("auth.signin")}
          </button>
        </CardContent></Card>
      </section>
    </SiteLayout>
  );
}
