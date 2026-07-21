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

// In-memory IP rate-limit store (per Worker isolate — best-effort).
type IpBucket = { minute: number[]; hour: number[] };
const ipStore = new Map<string, IpBucket>();
const IP_STORE_MAX = 5000;

export function checkIpRate(ip: string, now: number = Date.now()): AbuseReason | null {
  if (!ip) return null;
  let b = ipStore.get(ip);
  if (!b) {
    if (ipStore.size >= IP_STORE_MAX) {
      // simple eviction: drop first key
      const first = ipStore.keys().next().value;
      if (first) ipStore.delete(first);
    }
    b = { minute: [], hour: [] };
    ipStore.set(ip, b);
  }
  const minuteAgo = now - 60_000;
  const hourAgo = now - 3_600_000;
  b.minute = b.minute.filter((t) => t > minuteAgo);
  b.hour = b.hour.filter((t) => t > hourAgo);
  if (b.minute.length >= LIMITS.perIpPerMinute) return "ip_minute";
  if (b.hour.length >= LIMITS.perIpPerHour) return "ip_hour";
  b.minute.push(now);
  b.hour.push(now);
  return null;
}

export function extractIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

// Helper used by unit tests to reset the IP store.
export function __resetIpStore() {
  ipStore.clear();
}
