// Abuse-protection helpers for the chat endpoint.
// Pure functions where possible so they can be unit-tested without a DB.

export type Lang = "en" | "ar";

export const LIMITS = {
  perSessionPerMinute: 10,
  perSessionPerHour: 60,
  perSessionPerDay: 200,
  perIpPerMinute: 30,
  perIpPerHour: 300,
  duplicateWindowMs: 30_000,
  minIntervalMs: 1_000, // hard floor between two messages in a session
  maxUrls: 3,
  maxRepeatedChar: 40,
} as const;

const BLOCKED_PATTERNS = [
  /\b(?:https?:\/\/\S+\s*){4,}/i, // URL flood
  /(.)\1{40,}/, // long char repetition
  /<script[\s>]/i,
];

export type AbuseReason =
  | "duplicate"
  | "too_fast"
  | "session_minute"
  | "session_hour"
  | "session_day"
  | "ip_minute"
  | "ip_hour"
  | "blocked_content"
  | "too_many_urls";

export function messageLooksAbusive(message: string): AbuseReason | null {
  const urlCount = (message.match(/https?:\/\/\S+/gi) ?? []).length;
  if (urlCount > LIMITS.maxUrls) return "too_many_urls";
  const longRepeat = new RegExp(`(.)\\1{${LIMITS.maxRepeatedChar},}`);
  if (longRepeat.test(message)) return "blocked_content";
  for (const p of BLOCKED_PATTERNS) if (p.test(message)) return "blocked_content";
  return null;
}

export function errorMessage(reason: AbuseReason, lang: Lang): string {
  const en: Record<AbuseReason, string> = {
    duplicate: "Please don't send the same message repeatedly.",
    too_fast: "You're sending messages too fast. Slow down a moment.",
    session_minute: "Rate limit exceeded. Try again in a minute.",
    session_hour: "Hourly limit reached. Try again later.",
    session_day: "Daily limit reached. Try again tomorrow.",
    ip_minute: "Too many requests from your network. Try again shortly.",
    ip_hour: "Too many requests from your network. Try again later.",
    blocked_content: "Your message was blocked by our content filter.",
    too_many_urls: "Too many links in one message.",
  };
  const ar: Record<AbuseReason, string> = {
    duplicate: "من فضلك لا تكرر نفس الرسالة.",
    too_fast: "ترسل رسائل بسرعة كبيرة. تمهّل قليلاً.",
    session_minute: "تجاوزت الحد. حاول بعد دقيقة.",
    session_hour: "تجاوزت حد الساعة. حاول لاحقاً.",
    session_day: "تجاوزت الحد اليومي. حاول غداً.",
    ip_minute: "طلبات كثيرة من شبكتك. حاول بعد قليل.",
    ip_hour: "طلبات كثيرة من شبكتك. حاول لاحقاً.",
    blocked_content: "تم حجب رسالتك بواسطة مرشح المحتوى.",
    too_many_urls: "روابط كثيرة في رسالة واحدة.",
  };
  return (lang === "ar" ? ar : en)[reason];
}

// Persistent, cross-instance rate-limit check backed by the Postgres
// `rate_limit_hit` RPC. Falls back to allowing the request if the RPC fails,
// so a transient DB glitch never takes the chat down (session-level limits
// in chatbot_messages still apply).
export async function checkPersistentRate(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> },
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<{ allowed: boolean; count: number; resetAt: string | null }> {
  try {
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      _key: key,
      _window_seconds: windowSeconds,
      _limit: limit,
    });
    if (error || !Array.isArray(data) || data.length === 0) {
      return { allowed: true, count: 0, resetAt: null };
    }
    const row = data[0] as { allowed: boolean; current_count: number; reset_at: string };
    return { allowed: row.allowed, count: row.current_count, resetAt: row.reset_at };
  } catch {
    return { allowed: true, count: 0, resetAt: null };
  }
}

export function extractIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}
