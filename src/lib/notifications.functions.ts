import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeAudit } from "./audit";

export const NOTIFY_CATEGORIES = [
  "franchise",
  "acquisition",
  "contact",
  "careers",
  "investor",
] as const;

const emailList = z
  .array(z.string().trim().email().max(255))
  .max(20)
  .default([]);

const SettingsInput = z.object({
  category: z.enum(NOTIFY_CATEGORIES),
  is_enabled: z.boolean(),
  recipients: emailList,
  cc_recipients: emailList,
  from_name: z.string().trim().min(1).max(120),
  from_email: z.string().trim().email().max(255).or(z.literal("")).default(""),
  reply_to: z.string().trim().email().max(255).or(z.literal("")).default(""),
  subject_prefix: z.string().trim().max(60).default(""),
});

export type NotificationSettingRow = z.infer<typeof SettingsInput> & {
  id: string;
  updated_at: string;
};

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error || !data) throw new Error("forbidden");
}

export const adminNotificationSettingsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context as any);
    const { data, error } = await (context.supabase.from("notification_settings") as any)
      .select("*")
      .order("category");
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as NotificationSettingRow[] };
  });

export const adminNotificationSettingsSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => SettingsInput.parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    const payload = {
      category: data.category,
      is_enabled: data.is_enabled,
      recipients: data.recipients,
      cc_recipients: data.cc_recipients,
      from_name: data.from_name,
      from_email: data.from_email || null,
      reply_to: data.reply_to || null,
      subject_prefix: data.subject_prefix || null,
    };
    const { error } = await (context.supabase.from("notification_settings") as any)
      .upsert(payload, { onConflict: "category" });
    if (error) throw new Error(error.message);

    await writeAudit(
      context.supabase as any,
      { id: context.userId, email: (context.claims as any)?.email ?? null },
      {
        action: "upsert",
        entity: "notification_settings" as any,
        entity_ids: [data.category],
        diff: payload as any,
      },

    );
    return { ok: true };
  });

export const adminNotificationTestSend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ category: z.enum(NOTIFY_CATEGORIES) }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    const { notifySubmission } = await import("./notify.server");
    const res = await notifySubmission({
      category: data.category,
      title: `Test notification (${data.category})`,
      reference: `TEST-${Date.now()}`,
      fields: { note: "This is a test notification triggered from the admin panel." },
    });
    return res;
  });
