// Server-only notification dispatch.
// Routing rules live in public.notification_settings, one row per submission
// category, so each form type can notify its own recipients / sender.
import { sendLovableEmail } from "@lovable.dev/email-js";

export type NotifyCategory =
  | "franchise"
  | "acquisition"
  | "contact"
  | "careers"
  | "investor";

export interface NotificationSetting {
  category: string;
  is_enabled: boolean;
  recipients: string[];
  cc_recipients: string[];
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  subject_prefix: string | null;
}

export type NotifyResult =
  | { sent: false; reason: "disabled" | "no_recipients" | "no_sender" | "no_settings" | "error" }
  | { sent: true; recipients: number };

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(fields: Record<string, unknown>) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#0f172a;white-space:nowrap">${esc(
          k.replace(/_/g, " "),
        )}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#334155">${esc(v)}</td></tr>`,
    )
    .join("");
  const text = Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`)
    .join("\n");
  return { rows, text };
}

export async function getNotificationSetting(
  category: NotifyCategory,
): Promise<NotificationSetting | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin.from("notification_settings") as any)
    .select(
      "category,is_enabled,recipients,cc_recipients,from_name,from_email,reply_to,subject_prefix",
    )
    .eq("category", category)
    .maybeSingle();
  if (error) {
    console.error("[notify] failed to load settings", category, error);
    return null;
  }
  return (data as NotificationSetting) ?? null;
}

/**
 * Dispatch a submission notification using the routing rules stored for the
 * given category. Never throws — a failed notification must not fail a
 * public form submission.
 */
export async function notifySubmission(args: {
  category: NotifyCategory;
  title: string;
  reference: string;
  fields: Record<string, unknown>;
}): Promise<NotifyResult> {
  try {
    const s = await getNotificationSetting(args.category);
    if (!s) return { sent: false, reason: "no_settings" };
    if (!s.is_enabled) return { sent: false, reason: "disabled" };

    const to = (s.recipients ?? []).filter(Boolean);
    if (to.length === 0) return { sent: false, reason: "no_recipients" };

    const from = (s.from_email ?? "").trim();
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!from || !apiKey) return { sent: false, reason: "no_sender" };

    const senderDomain = from.split("@")[1];
    const subject = `${s.subject_prefix ? `${s.subject_prefix} ` : ""}${args.title} — ${args.reference}`;
    const { rows, text } = renderRows({ reference: args.reference, ...args.fields });
    const html = `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:24px">
<h1 style="margin:0 0 4px;font-size:20px;color:#0f172a">${esc(args.title)}</h1>
<p style="margin:0 0 16px;color:#64748b;font-size:13px">Reference ${esc(args.reference)}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
</div></body></html>`;

    const allRecipients = [...to, ...((s.cc_recipients ?? []).filter(Boolean))];
    let delivered = 0;
    for (const recipient of allRecipients) {
      try {
        await sendLovableEmail(
          {
            to: recipient,
            from: s.from_name ? `${s.from_name} <${from}>` : from,
            sender_domain: senderDomain,
            subject,
            html,
            text: `${args.title}\nReference: ${args.reference}\n\n${text}`,
            reply_to: s.reply_to ?? undefined,
            idempotency_key: `${args.category}-${args.reference}-${recipient}`,
          },
          { apiKey },
        );
        delivered++;
      } catch (err) {
        console.error("[notify] send failed", args.category, recipient, err);
      }
    }
    return delivered > 0 ? { sent: true, recipients: delivered } : { sent: false, reason: "error" };
  } catch (err) {
    console.error("[notify] dispatch error", err);
    return { sent: false, reason: "error" };
  }
}
