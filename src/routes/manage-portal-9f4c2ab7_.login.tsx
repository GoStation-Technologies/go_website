import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminLogin, adminResendOtp, adminVerifyOtp } from "@/lib/admin-auth.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/manage-portal-9f4c2ab7_/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin sign in — GoStation" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function formatClock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();

  const login = useServerFn(adminLogin);
  const resend = useServerFn(adminResendOtp);
  const verify = useServerFn(adminVerifyOtp);

  // challengeId lives ONLY in component state — never storage, cookies or the URL.
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [phoneMasked, setPhoneMasked] = useState("");
  const [code, setCode] = useState("");
  const [expiresIn, setExpiresIn] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const goToPortal = useCallback(() => {
    // Always use client-side routing. A hard reload here (window.location)
    // can re-enter a partially-invalidated module graph and throw
    // "Cannot read properties of null (reading 'useContext')".
    const target =
      redirectTo && redirectTo.startsWith("/manage-portal-9f4c2ab7")
        ? redirectTo
        : "/manage-portal-9f4c2ab7";
    const [pathname, search] = target.split("?");
    navigate({
      to: pathname ?? "/manage-portal-9f4c2ab7",
      search: search ? Object.fromEntries(new URLSearchParams(search)) : undefined,
      replace: true,
    } as never);

  }, [navigate, redirectTo]);


  // Already signed in: skip the whole flow.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) goToPortal();
    });
    return () => {
      active = false;
    };
  }, [goToPortal]);

  // Countdowns.
  useEffect(() => {
    if (!challengeId) return;
    const t = setInterval(() => {
      setExpiresIn((v) => (v > 0 ? v - 1 : 0));
      setCooldown((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [challengeId]);

  useEffect(() => {
    if (challengeId) codeRef.current?.focus();
  }, [challengeId]);

  const startChallenge = (r: { challengeId: string; phoneMasked: string; expiresInSeconds: number }) => {
    setChallengeId(r.challengeId);
    setPhoneMasked(r.phoneMasked);
    setExpiresIn(r.expiresInSeconds);
    setCooldown(60);
    setCode("");
  };

  const submitCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setBusy(true);
    setError(null);
    try {
      const res = await login({ data: { email, password } });
      // Password is never kept in state; the form is unmounted on success.
      if (!res.ok) {
        setError(res.error);
        return;
      }
      startChallenge(res);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!challengeId || code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verify({ data: { challengeId, code } });
      if (!res.ok) {
        setError(res.error);
        setCode("");
        return;
      }
      const { error: sessErr } = await supabase.auth.verifyOtp({
        token_hash: res.tokenHash,
        type: "magiclink",
      });
      if (sessErr) {
        setError("Could not complete sign-in. Please try again.");
        return;
      }
      toast.success("Welcome back");
      goToPortal();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (!challengeId || cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await resend({ data: { challengeId } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      startChallenge(res);
      toast.success("A new code has been sent");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const backToLogin = () => {
    setChallengeId(null);
    setCode("");
    setError(null);
    setExpiresIn(0);
    setCooldown(0);
  };

  return (
    <div dir="ltr" className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">GoStation Admin</h1>
          <p className="text-sm text-muted-foreground">
            {challengeId
              ? `Enter the 6-digit code sent to ${phoneMasked}`
              : "Staff access only. Sign in to continue."}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {!challengeId ? (
              <form onSubmit={submitCredentials} className="grid gap-4">
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
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {busy ? "Signing in…" : "Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitCode} className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    ref={codeRef}
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    placeholder="000000"
                    className="text-center text-lg tracking-[0.5em]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {expiresIn > 0
                      ? `Code expires in ${formatClock(expiresIn)}`
                      : "This code has expired — request a new one."}
                  </p>
                </div>
                <Button type="submit" disabled={busy || code.length !== 6 || expiresIn === 0}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {busy ? "Verifying…" : "Verify and sign in"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resendCode}
                  disabled={busy || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend code in ${formatClock(cooldown)}` : "Resend code"}
                </Button>
                <button
                  type="button"
                  onClick={backToLogin}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Accounts are provisioned by GoStation IT.
        </p>
      </div>
    </div>
  );
}
