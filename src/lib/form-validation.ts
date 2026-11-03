import { z } from "zod";

/** Normalizes Saudi mobile numbers (+966 5x, 9665x, 05x, 5x) to 05XXXXXXXX; returns null when invalid. */
export function normalizeSaudiPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, "").replace(/^\+/, "").replace(/^00/, "");
  const local = digits.startsWith("966") ? digits.slice(3) : digits.replace(/^0/, "");
  if (/^5\d{8}$/.test(local)) return `0${local}`;
  if (/^1\d{7,8}$/.test(local)) return `0${local}`; // landline (011…)
  if (/^9200\d{5}$/.test(digits)) return digits; // unified numbers
  return null;
}

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizeSaudiPhone(v) !== null, { message: "phone" })
  .transform((v) => normalizeSaudiPhone(v) ?? v);

export const optionalPhoneSchema = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || normalizeSaudiPhone(v) !== null, { message: "phone" })
  .transform((v) => (v === "" ? "" : normalizeSaudiPhone(v) ?? v));

export const optionalUrlSchema = z
  .string()
  .trim()
  .max(2048, { message: "url" })
  .default("")
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, { message: "url" });

export const MAX_CV_BYTES = 4 * 1024 * 1024;
export const CV_EXTENSIONS = ["pdf", "doc", "docx"] as const;
export const MAX_LEASING_DOC_BYTES = 5 * 1024 * 1024;

export function fileExtension(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

/** Maps zod issues to { field: messageKey }, keeping the first issue per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[issue.path.length - 1] ?? "form");
    if (out[key]) continue;
    const custom = issue.message;
    if (["phone", "url"].includes(custom)) out[key] = custom;
    else if (issue.code === "invalid_string" && (issue as { validation?: string }).validation === "email") out[key] = "email";
    else if (issue.code === "too_small") out[key] = "required";
    else if (issue.code === "too_big") out[key] = "tooLong";
    else out[key] = "invalid";
  }
  return out;
}

export const FORM_MESSAGES = {
  ar: {
    required: "هذا الحقل مطلوب.",
    email: "يرجى إدخال بريد إلكتروني صحيح.",
    phone: "يرجى إدخال رقم جوال سعودي صحيح مثل 05xxxxxxxx أو ‎+966 5xxxxxxxx.",
    url: "يرجى إدخال رابط صحيح (مثل رابط لينكد إن).",
    tooLong: "النص أطول من الحد المسموح.",
    invalid: "القيمة المدخلة غير صحيحة.",
    cvTooLarge: "حجم الملف يتجاوز 4 ميجابايت.",
    cvType: "يُسمح فقط بملفات PDF أو DOC أو DOCX.",
    docTooLarge: "أحد الملفات المرفقة أكبر من 5 ميجابايت.",
    docType: "يُسمح فقط بملفات PDF أو JPG أو PNG (حتى 5 ملفات).",
    uploadFailed: "تعذّر رفع الملف المرفق. تحقق من اتصالك وحاول مرة أخرى.",
    invalidJob: "هذه الوظيفة لم تعد متاحة للتقديم.",
    serverError: "تعذّر إرسال الطلب حالياً بسبب خطأ في الخادم. يرجى المحاولة بعد قليل.",
    fixFields: "يرجى تصحيح الحقول المظللة.",
  },
  en: {
    required: "This field is required.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid Saudi number, e.g. 05xxxxxxxx or +966 5xxxxxxxx.",
    url: "Please enter a valid link (e.g. your LinkedIn profile).",
    tooLong: "This text is longer than allowed.",
    invalid: "This value is not valid.",
    cvTooLarge: "The file is larger than 4 MB.",
    cvType: "Only PDF, DOC or DOCX files are allowed.",
    docTooLarge: "One of the attached files is larger than 5 MB.",
    docType: "Only PDF, JPG or PNG files are allowed (up to 5 files).",
    uploadFailed: "The attachment could not be uploaded. Check your connection and try again.",
    invalidJob: "This position is no longer open for applications.",
    serverError: "We couldn't send your request because of a server problem. Please try again shortly.",
    fixFields: "Please correct the highlighted fields.",
  },
} as const;

export type FormMessageKey = keyof (typeof FORM_MESSAGES)["ar"];

export function formMessage(lang: string | undefined, key: string): string {
  const table = FORM_MESSAGES[lang?.startsWith("ar") ? "ar" : "en"] as Record<string, string>;
  return table[key] ?? table.invalid;
}

/** Turns a thrown server error into a friendly message key. */
export function serverErrorKey(error: unknown): FormMessageKey {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  if (msg.includes("invalid_job")) return "invalidJob";
  if (msg.includes("upload")) return "uploadFailed";
  if (msg.includes("too_large")) return "cvTooLarge";
  return "serverError";
}
