import { z } from "zod";

export const NOTIFICATION_SENDER = "noreply@gostation.sa";
export const NOTIFICATION_SENDER_NAME = "GoStation | قوستيشن";

export type NotificationRouting = {
  is_enabled: boolean;
  recipients: string[];
  cc_recipients: string[];
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  subject_prefix: string | null;
};

export function notificationRouting(s: NotificationRouting, test = false) {
  if (!s.is_enabled && !test) return { ok: false as const, reason: "disabled" };
  const emails = (values: string[]) => [...new Set(values.map(v => v.trim().toLowerCase()).filter(Boolean))];
  const to = emails(s.recipients);
  const cc = emails(s.cc_recipients).filter(v => !to.includes(v));
  if (!to.length) return { ok: false as const, reason: "no_recipients" };
  if ([...to, ...cc].some(v => !z.string().email().safeParse(v).success)) return { ok: false as const, reason: "invalid_recipient" };
  if (to.length + cc.length > 50) return { ok: false as const, reason: "recipient_limit" };
  return { ok: true as const, to, cc, fromName: NOTIFICATION_SENDER_NAME, replyTo: notificationReplyTo(undefined, s.reply_to), prefix: s.subject_prefix?.trim() || "" };
}

export function notificationSender() {
  return NOTIFICATION_SENDER;
}

export function notificationReplyTo(visitor: unknown, fallback?: string | null) {
  for (const value of [visitor, fallback]) {
    if (typeof value === "string" && z.string().email().safeParse(value.trim()).success) return value.trim();
  }
  return undefined;
}

export function notificationDiagnostic(reason: string, ar: boolean) {
  const messages: Record<string, [string, string]> = {
    disabled: ["Notifications are disabled for this category.", "الإشعارات غير مفعلة لهذا النوع."],
    no_settings: ["Save the notification settings first.", "يرجى حفظ إعدادات الإشعارات أولاً."],
    no_recipients: ["Enter a recipient email.", "يرجى إدخال بريد المستلم."],
    invalid_recipient: ["A recipient email is invalid.", "أحد عناوين البريد الإلكتروني غير صحيح."],
    recipient_limit: ["Use at most 50 recipients including CC.", "استخدم حتى 50 مستلماً شاملاً النسخ."],
    domain_not_verified: ["Verify gostation.sa in Resend before sending.", "تحقق من نطاق gostation.sa في Resend قبل الإرسال."],
    validation_error: ["Resend rejected the email settings; check recipient addresses and sender domain.", "رفض Resend إعدادات البريد؛ تحقق من المستلمين ونطاق المرسل."],
    restricted_api_key: ["The Resend key does not have permission to send emails.", "مفتاح Resend لا يملك صلاحية إرسال البريد."],
    missing_api_key: ["Connect Resend before sending emails.", "اربط Resend قبل إرسال البريد."],
    emails_disabled: ["Email sending is disabled in More → Emails.", "إرسال البريد معطل في المزيد ← البريد الإلكتروني."],
    recipient_suppressed: ["Sending to this recipient is blocked after a bounce, complaint or unsubscribe.", "الإرسال لهذا المستلم محظور بعد ارتداد البريد أو شكوى أو إلغاء الاشتراك."],
    configuration_error: ["Email sending is not configured on this server.", "إرسال البريد غير مُعد على هذا الخادم."],
    rate_limited: ["Email sending is temporarily rate-limited; try again later.", "تم بلوغ حد الإرسال مؤقتاً؛ حاول لاحقاً."],
    error: ["The email provider rejected the send. Check server logs.", "رفض مزود البريد الإرسال. راجع سجل الخادم."],
  };
  return (messages[reason] ?? messages.error)[ar ? 1 : 0];
}