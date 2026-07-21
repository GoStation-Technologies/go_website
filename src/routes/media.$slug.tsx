import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/media/$slug")({
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const { data, isLoading } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data } = await supabase.from("news_articles").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      return data;
    },
  });

  if (!isLoading && !data) throw notFound();

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <Link to="/media" className="mb-6 inline-flex items-center gap-2 text-sm text-accent hover:underline">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("media.back")}
        </Link>
        {data && (
          <>
            <div className="text-sm text-muted-foreground">{data.published_at ? new Date(data.published_at).toLocaleDateString(lng === "ar" ? "ar-SA" : "en-US") : ""}</div>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">{lng === "ar" ? data.title_ar : data.title_en}</h1>
            <div className="my-8 aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary to-accent/60" />
            <p className="text-lg text-muted-foreground">{lng === "ar" ? data.excerpt_ar : data.excerpt_en}</p>
            <div className="prose mt-6 max-w-none text-foreground/90">{lng === "ar" ? data.body_ar : data.body_en}</div>
          </>
        )}
      </article>
    </SiteLayout>
  );
}
