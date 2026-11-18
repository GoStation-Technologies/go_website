import { z } from "zod";

/** site_settings key holding the external job application form link. */
export const CAREERS_SETTING_KEY = "careers";

/** Accepts only absolute http(s) links; returns the trimmed URL or null. */
export function careersApplicationUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = z.string().trim().url().max(2000).safeParse(value);
  if (!parsed.success) return null;
  try {
    const u = new URL(parsed.data);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
