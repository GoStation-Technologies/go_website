// Server-only helpers for the two-step admin sign-in (password -> SMS OTP).
// Nothing here may be imported from client code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const OTP_TTL_SECONDS = 180;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_PER_HOUR = 10;
const MAX_FAILED_LOGINS = 10;
const LOGIN_WINDOW_MINUTES = 15;
const CHALLENGE_MAX_AGE_MINUTES = 15;
export const MAX_OTP_ATTEMPTS = 5;

export type AuthFailure = { status: number; message: string };

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

/** Service-role client — all reads/writes for this flow. Bypasses RLS. */
export function adminDb() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Publishable-key client — used ONLY to verify a password. */
function anonAuthClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_PUBLISHABLE_KEY");
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-safe constant-time string comparison. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Cryptographically random, zero-padded 6-digit code. */
function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0]! % 1_000_000).padStart(6, "0");
}

export function maskPhone(phone: string): string {
  return "•••• " + phone.slice(-4);
}

type Db = ReturnType<typeof adminDb>;

export async function throttleLoginAttempts(db: Db, email: string, ip: string | null) {
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60_000).toISOString();
  const orFilter = ip ? `email.eq.${email},ip.eq.${ip}` : `email.eq.${email}`;
  const { count } = await db
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("succeeded", false)
    .gte("created_at", since)
    .or(orFilter);
  if ((count ?? 0) >= MAX_FAILED_LOGINS) {
    throw new AuthError(429, "Too many login attempts. Try again later.");
  }
}

/** Verifies credentials with the anon client. The returned session is discarded. */
export async function verifyPassword(
  db: Db,
  email: string,
  password: string,
  ip: string | null,
): Promise<string> {
  const auth = anonAuthClient();
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  const userId = error ? null : (data.user?.id ?? null);
  // Never log `data` — it carries a valid access/refresh token pair.
  await db.from("login_attempts").insert({ email, ip, succeeded: Boolean(userId) });
  if (!userId) throw new AuthError(401, "Invalid email or password.");
  // Discard the session immediately.
  await auth.auth.signOut({ scope: "local" }).catch(() => {});
  return userId;
}

export async function requireActiveAdminProfile(db: Db, userId: string) {
  const { data } = await db
    .from("admin_profiles")
    .select("user_id, phone, is_active")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !data.is_active || !data.phone?.trim()) {
    throw new AuthError(403, "This account is not enabled for admin access.");
  }
  return { phone: data.phone.trim() };
}

export async function throttleOtpRequests(db: Db, userId: string) {
  const { data: newest } = await db
    .from("login_otps")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (newest && Date.now() - new Date(newest.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    throw new AuthError(429, "Please wait before requesting a new code.");
  }
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db
    .from("login_otps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= MAX_OTP_PER_HOUR) {
    throw new AuthError(429, "Too many code requests. Try again later.");
  }
}

async function sendSms(db: Db, phone: string, code: string) {
  const url = requireEnv("SMS_API_URL");
  const token = requireEnv("SMS_API_TOKEN");
  const sender = requireEnv("SMS_SENDER");
  const redacted = "Your verification code is: ******";

  let statusCode: number | null = null;
  let responseBody = "";
  let jobId: string | null = null;

  // Most GCC gateways expect a bare MSISDN (966XXXXXXXXX), not an E.164 "+" prefix.
  const dest = phone.replace(/[^\d]/g, "");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        src: sender,
        body: `Your verification code is: ${code}`,
        dests: [dest],
      }),
    });
    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 2000);
    try {
      const parsed = JSON.parse(responseBody) as { jobId?: unknown };
      if (parsed && typeof parsed.jobId !== "undefined" && parsed.jobId !== null) {
        jobId = String(parsed.jobId);
      }
    } catch {
      /* non-JSON response */
    }
    await db.from("sms_logs").insert({
      phone,
      message: redacted,
      status_code: statusCode,
      response_body: responseBody,
      job_id: jobId,
    });
    return res.ok;
  } catch (err) {
    await db.from("sms_logs").insert({
      phone,
      message: redacted,
      status_code: statusCode,
      response_body: `request failed: ${err instanceof Error ? err.message : "unknown"}`,
      job_id: null,
    });
    return false;
  }
}

/** Creates an OTP row, sends the SMS, and burns the row if the send fails. */
export async function issueChallenge(db: Db, userId: string, phone: string) {
  const code = generateCode();
  const otpHash = await sha256Hex(code + userId);
  const { data: row, error } = await db
    .from("login_otps")
    .insert({
      user_id: userId,
      phone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !row) throw new AuthError(500, "Could not start verification. Please try again.");

  const sent = await sendSms(db, phone, code);
  if (!sent) {
    await db.from("login_otps").update({ is_used: true }).eq("id", row.id);
    throw new AuthError(502, "Could not send the verification code. Please try again.");
  }

  return {
    challengeId: row.id,
    phoneMasked: maskPhone(phone),
    expiresInSeconds: OTP_TTL_SECONDS,
  };
}

export async function loadResendableChallenge(db: Db, challengeId: string) {
  const { data } = await db
    .from("login_otps")
    .select("id, user_id, is_used, created_at")
    .eq("id", challengeId)
    .maybeSingle();
  const tooOld =
    !data ||
    Date.now() - new Date(data.created_at).getTime() > CHALLENGE_MAX_AGE_MINUTES * 60_000;
  if (!data || data.is_used || tooOld) {
    throw new AuthError(400, "Invalid or expired session.");
  }
  return data;
}
