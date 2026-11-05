import { z } from "zod";

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
  // The managed sender accepts one To address and at most five total recipients.
  if (to.length !== 1 || to.length + cc.length > 5) return { ok: false as const, reason: "recipient_limit" };
  return { ok: true as const, to: to[0], cc, fromName: s.from_name.trim() || "GoStation", replyTo: s.reply_to || undefined, prefix: s.subject_prefix?.trim() || "" };
}

export function notificationSender(from: string | null, domain: string) {
  const address = from?.trim();
  return address && z.string().email().safeParse(address).success && address.split("@")[1]?.toLowerCase() === domain
    ? address : `noreply@${domain}`;
}

export function notificationDiagnostic(reason: string, ar: boolean) {
  const messages: Record<string, [string, string]> = {
    disabled: ["Notifications are disabled for this category.", "الإشعارات غير مفعلة لهذا النوع."],
    no_settings: ["Save the notification settings first.", "يرجى حفظ إعدادات الإشعارات أولاً."],
    no_recipients: ["Enter a recipient email.", "يرجى إدخال بريد المستلم."],
    invalid_recipient: ["A recipient email is invalid.", "أحد عناوين البريد الإلكتروني غير صحيح."],
    recipient_limit: ["Use one recipient and up to four CC addresses.", "استخدم مستلماً واحداً وحتى أربعة عناوين في نسخة إلى."],
    domain_not_verified: ["The sending domain is still awaiting verification in More → Emails.", "نطاق الإرسال ينتظر التحقق في المزيد ← البريد الإلكتروني."],
    emails_disabled: ["Email sending is disabled in More → Emails.", "إرسال البريد معطل في المزيد ← البريد الإلكتروني."],
    recipient_suppressed: ["Sending to this recipient is blocked after a bounce, complaint or unsubscribe.", "الإرسال لهذا المستلم محظور بعد ارتداد البريد أو شكوى أو إلغاء الاشتراك."],
    configuration_error: ["Email sending is not configured on this server.", "إرسال البريد غير مُعد على هذا الخادم."],
    rate_limited: ["Email sending is temporarily rate-limited; try again later.", "تم بلوغ حد الإرسال مؤقتاً؛ حاول لاحقاً."],
    error: ["The email provider rejected the send. Check server logs.", "رفض مزود البريد الإرسال. راجع سجل الخادم."],
  };
  return (messages[reason] ?? messages.error)[ar ? 1 : 0];
}