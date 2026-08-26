import { Quote, Star } from "lucide-react";
import { useTestimonials } from "@/hooks/use-cms";

/** Customer reviews carousel-free grid, fully CMS driven. */
export function Testimonials({ title, subtitle }: { title: string; subtitle?: string }) {
  const { items, isLoading } = useTestimonials();

  if (isLoading || items.length === 0) return null;

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
          </figure>
        ))}
      </div>
    </section>
  );
}
