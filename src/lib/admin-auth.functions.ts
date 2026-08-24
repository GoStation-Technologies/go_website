import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const LoginInput = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

const ResendInput = z.object({ challengeId: z.string().uuid() });

const VerifyInput = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

export type ChallengeResult =
  | { ok: true; challengeId: string; phoneMasked: string; expiresInSeconds: number }
  | { ok: false; status: number; error: string };

export type VerifyResult =
  | { ok: true; tokenHash: string }
  | { ok: false; status: number; error: string };

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LoginInput.parse(data))
  .handler(async ({ data }): Promise<ChallengeResult> => {
    const mod = await import("./admin-auth.server");
    const db = mod.adminDb();
    const email = data.email.trim().toLowerCase();
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
    }
    try {
      await mod.throttleLoginAttempts(db, email, ip);
      const userId = await mod.verifyPassword(db, email, data.password, ip);
      const { phone } = await mod.requireActiveAdminProfile(db, userId);
      await mod.throttleOtpRequests(db, userId);
      const challenge = await mod.issueChallenge(db, userId, phone);
      return { ok: true, ...challenge };
    } catch (err) {
      if (err instanceof mod.AuthError) return { ok: false, status: err.status, error: err.message };
      console.error("[admin-login] unexpected failure");
      return { ok: false, status: 500, error: "Something went wrong. Please try again." };
    }
  });

export const adminResendOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ResendInput.parse(data))
  .handler(async ({ data }): Promise<ChallengeResult> => {
    const mod = await import("./admin-auth.server");
    const db = mod.adminDb();
    try {
      const row = await mod.loadResendableChallenge(db, data.challengeId);
      await mod.throttleOtpRequests(db, row.user_id);
      const { phone } = await mod.requireActiveAdminProfile(db, row.user_id);
      await db.from("login_otps").update({ is_used: true }).eq("id", row.id);
      const challenge = await mod.issueChallenge(db, row.user_id, phone);
      return { ok: true, ...challenge };
    } catch (err) {
      if (err instanceof mod.AuthError) return { ok: false, status: err.status, error: err.message };
      console.error("[admin-resend-otp] unexpected failure");
      return { ok: false, status: 500, error: "Something went wrong. Please try again." };
    }
  });

export const adminVerifyOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => VerifyInput.parse(data))
  .handler(async ({ data }): Promise<VerifyResult> => {
    const mod = await import("./admin-auth.server");
    const db = mod.adminDb();
    const invalid = { ok: false as const, status: 400, error: "Invalid or expired code." };

    const { data: row } = await db
      .from("login_otps")
      .select("id, user_id, otp_hash, is_used, expires_at, attempts")
      .eq("id", data.challengeId)
      .maybeSingle();

    if (
      !row ||
      row.is_used ||
      new Date(row.expires_at).getTime() <= Date.now() ||
      row.attempts >= mod.MAX_OTP_ATTEMPTS
    ) {
      return invalid;
    }

    const candidate = await mod.sha256Hex(data.code + row.user_id);
    if (!mod.timingSafeEqualHex(candidate, row.otp_hash)) {
      const attempts = row.attempts + 1;
      await db
        .from("login_otps")
        .update({ attempts, is_used: attempts >= mod.MAX_OTP_ATTEMPTS })
        .eq("id", row.id);
      return invalid;
    }

    await db
      .from("login_otps")
      .update({ is_used: true })
      .eq("user_id", row.user_id)
      .eq("is_used", false);

    try {
      await mod.requireActiveAdminProfile(db, row.user_id);
    } catch (err) {
      if (err instanceof mod.AuthError) return { ok: false, status: err.status, error: err.message };
      throw err;
    }

    const { data: userRes, error: userErr } = await db.auth.admin.getUserById(row.user_id);
    const email = userRes?.user?.email;
    if (userErr || !email) {
      return { ok: false, status: 500, error: "Could not complete sign-in. Please try again." };
    }

    const { data: link, error: linkErr } = await db.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      return { ok: false, status: 500, error: "Could not complete sign-in. Please try again." };
    }
    return { ok: true, tokenHash };
  });
