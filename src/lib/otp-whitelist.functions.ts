import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * OTP whitelist management. Writes are restricted to super admins by RLS.
 * Entries with mode = "fixed" sign in with a fixed code and receive no SMS.
 */

const EntryInput = z.object({
  id: z.string().uuid().optional(),
  phone: z.string().min(6).max(24),
  label: z.string().max(160).nullish(),
  fixed_code: z
    .string()
    .regex(/^\d{6}$/u, "Fixed code must be exactly 6 digits")
    .nullish(),
  mode: z.enum(["fixed", "sms"]),
  is_active: z.boolean(),
  notes: z.string().max(1000).nullish(),
});

export const adminListOtpWhitelist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("otp_whitelist")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminUpsertOtpWhitelist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EntryInput.parse(d))
  .handler(async ({ data, context }) => {
    const phone = data.phone.replace(/[^\d]/gu, "");
    if (phone.length < 8) throw new Error("Enter a valid phone number");
    if (data.mode === "fixed" && !data.fixed_code) {
      throw new Error("A 6-digit fixed code is required for fixed-code mode");
    }
    const row = {
      ...(data.id ? { id: data.id } : {}),
      phone,
      label: data.label ?? null,
      fixed_code: data.mode === "fixed" ? (data.fixed_code ?? null) : null,
      mode: data.mode,
      is_active: data.is_active,
      notes: data.notes ?? null,
    };
    const { error } = await context.supabase
      .from("otp_whitelist")
      .upsert(row, { onConflict: "phone" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteOtpWhitelist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("otp_whitelist")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
