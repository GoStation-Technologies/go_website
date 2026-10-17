import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/site-layout";
import { getContentLanguage } from "@/lib/i18n";
import { LEGAL_PAGES, legalDocumentText, type LegalPageSlug } from "@/lib/legal-pages";
import { legalDocumentQuery } from "@/lib/legal-pages.query";

export function LegalPage({ slug }: { slug: LegalPageSlug }) {
  const { i18n } = useTranslation();
  const language = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const definition = LEGAL_PAGES.find((page) => page.slug === slug);
  const { data } = useSuspenseQuery(legalDocumentQuery(slug));
  const document = legalDocumentText(data, language);
  return (
    <SiteLayout>
      <article dir={language === "ar" ? "rtl" : "ltr"} lang={language} className="mx-auto max-w-4xl px-4 py-12 text-start sm:px-6 md:py-20">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{document.title || definition?.[language]}</h1>
        </header>
        {document.content ? (
          <div className="space-y-6 text-base leading-loose text-foreground/85">
            {document.content.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap break-words">{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="leading-loose text-muted-foreground">
            {language === "ar" ? "سيتم نشر النص المعتمد لهذه الصفحة قريباً." : "The approved text for this page will be published soon."}
          </p>
        )}
      </article>
    </SiteLayout>
  );
}