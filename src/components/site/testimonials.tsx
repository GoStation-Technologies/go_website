import { ExternalLink, Quote, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTestimonials } from "@/hooks/use-cms";
import { getPublicGoogleReviews } from "@/lib/google-reviews.functions";
import { googleReviewUrl } from "@/lib/google-reviews";
import { Button } from "@/components/ui/button";

/** Customer reviews grid: admin-selected Google Maps reviews (live) + CMS testimonials. */
export function Testimonials({ title, subtitle }: { title: string; subtitle?: string }) {
  const { items: cms, isLoading } = useTestimonials();
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language).startsWith("ar") ? "ar" : "en";
  const g = useQuery({
    queryKey: ["public", "google-reviews", lang],
    queryFn: () => getPublicGoogleReviews({ data: { lang } }),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const google = (g.data?.reviews ?? []).map((r) => ({
    id: r.id,
    author: r.author,
    role: lang === "ar" ? "تقييم على Google Maps" : "Google Maps review",
    quote: r.text,
    avatar_url: r.authorPhoto,
    rating: Math.round(r.rating),
    googleMapsUri: googleReviewUrl(r.googleMapsUri),
  }));
  const live = [...google, ...cms.map((r) => ({ ...r, googleMapsUri: null }))];

  if ((isLoading && g.isLoading) || live.length === 0) return null;
  // Only actual published CMS records and selected Google reviews are displayed.
  const items = live;


  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
        ) : null}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((r) => (
          <figure
            key={r.id}
            className="relative flex h-full flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <Quote className="h-6 w-6 text-accent" aria-hidden />
            <blockquote className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              {r.quote}
            </blockquote>
            <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-5">
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
              ) : null}
              <figcaption className="min-w-0">
                <div className="truncate text-sm font-semibold">{r.author}</div>
                {r.role ? <div className="truncate text-xs text-muted-foreground">{r.role}</div> : null}
              </figcaption>
              <div className="ms-auto flex gap-0.5" aria-label={`${r.rating}/5`}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                ))}
              </div>
            </div>
            {r.googleMapsUri ? (
              <Button asChild variant="link" size="sm" className="mt-4 h-auto justify-start whitespace-normal px-0 text-start">
                <a href={r.googleMapsUri} target="_blank" rel="noopener noreferrer">
                  <span>{lang === "ar" ? "عرض التقييم على خرائط Google" : "View review on Google Maps"}</span>
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
