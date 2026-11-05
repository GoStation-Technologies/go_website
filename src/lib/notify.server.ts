import { EmailAPIError } from "@lovable.dev/email-js";
import { sendTemplateEmail } from "./email-templates/send-email";
import { notificationRouting, type NotificationRouting } from "./notification-policy";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type NotifyCategory = "franchise" | "acquisition" | "contact" | "careers" | "investor";
export type NotificationSetting = NotificationRouting & { category: string };
export type NotifyResult = { sent: true; recipients: number } | { sent: false; reason: string; status?: number };

export async function getNotificationSetting(category: NotifyCategory, client?: SupabaseClient<Database>): Promise<NotificationSetting | null> {
  const db = client ?? (await import("./supabase-server.server").then(m => m.getAdminClientOrNull()));
  if (!db) throw new Error("configuration_error");
  const { data, error } = await db.from("notification_settings")
    .select("category,is_enabled,recipients,cc_recipients,from_name,from_email,reply_to,subject_prefix")
    .eq("category", category).maybeSingle();
  if (error) { console.error("[notify] settings failed", { category, code: error.code }); throw new Error("configuration_error"); }
  return data;
}

/** One configured owner notice with real CC; never fails the saved form submission. */
export async function notifySubmission(args: {
  category: NotifyCategory; title: string; reference: string; fields: Record<string, unknown>;
  client?: SupabaseClient<Database>; test?: boolean;
  attachments?: { bucket: "cvs" | "leasing-documents"; path: string; name: string }[];
}): Promise<NotifyResult> {
  try {
    const settings = await getNotificationSetting(args.category, args.client);
    if (!settings) return { sent: false, reason: "no_settings" };
    const routing = notificationRouting(settings, args.test);
    if (!routing.ok) return { sent: false, reason: routing.reason };
    const links: { label: string; url: string }[] = [];
    const db = args.client ?? await import("./supabase-server.server").then(m => m.getAdminClientOrNull());
    for (const attachment of args.attachments ?? []) {
      if (!db) break;
      const { data, error } = await db.storage.from(attachment.bucket).createSignedUrl(attachment.path, 60 * 60 * 24);
      if (error) console.warn("[notify] attachment link unavailable", { category: args.category, code: error.name });
      else if (data?.signedUrl) links.push({ label: attachment.name, url: data.signedUrl });
    }
    const subject = `${routing.prefix ? routing.prefix + " " : ""}${args.title} — ${args.reference}`;
    const result = await sendTemplateEmail("form-notification", routing.to, {
      cc: routing.cc, fromName: routing.fromName, fromEmail: settings.from_email, replyTo: routing.replyTo,
      idempotencyKey: `form-notification-${args.category}-${args.reference}`,
      templateData: { title: args.title, reference: args.reference, timestamp: new Date().toISOString(), fields: args.fields, links, subject },
    });
    return result.sent ? { sent: true, recipients: 1 + routing.cc.length } : result;
  } catch (error) {
    const reason = error instanceof EmailAPIError ? error.code : "configuration_error";
    const status = error instanceof EmailAPIError ? error.status : undefined;
    // Do not log credentials, recipient addresses or submitted personal details.
    console.error("[notify] dispatch failed", { category: args.category, reference: args.reference, reason, status });
    return { sent: false, reason, status };
  }
}
