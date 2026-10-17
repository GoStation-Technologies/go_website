export const LEGAL_PAGES = [
  {
    slug: "privacy-policy",
    en: "Privacy Policy",
    ar: "سياسة الخصوصية",
    descEn: "Manage the Arabic and English privacy policy displayed on the website.",
    descAr: "إدارة نص سياسة الخصوصية بالعربية والإنجليزية المعروض على الموقع.",
  },
  {
    slug: "terms-and-conditions",
    en: "Terms & Conditions",
    ar: "الشروط والأحكام",
    descEn: "Manage the Arabic and English terms and conditions displayed on the website.",
    descAr: "إدارة نص الشروط والأحكام بالعربية والإنجليزية المعروض على الموقع.",
  },
] as const;

export type LegalPageSlug = (typeof LEGAL_PAGES)[number]["slug"];

export type LegalDocument = {
  title_en: string | null;
  title_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
};

export function legalDocumentText(document: LegalDocument | null, language: "ar" | "en") {
  // Never substitute an unpublished or missing translation with a different legal text.
  return {
    title: document?.[`title_${language}`]?.trim().normalize("NFKC") ?? "",
    content: document?.[`content_${language}`]?.trim().normalize("NFKC") ?? "",
  };
}