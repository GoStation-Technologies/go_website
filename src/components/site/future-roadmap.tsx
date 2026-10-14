import { useState } from "react";
import { useAboutStory } from "@/lib/about-story";


export function FutureRoadmap() {
  const { story, L } = useAboutStory();
  const PHASES = story.roadmap.items;
  if (PHASES.length === 0) return null;
  const [active, setActive] = useState(0);

  return (
    <section className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background:radial-gradient(60%_80%_at_10%_0%,var(--color-accent),transparent_60%)]"
      />

      <div className="relative">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
          {L(story.roadmap.eyebrow)}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{L(story.roadmap.title)}</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">{L(story.roadmap.lead)}</p>

        {/* Rail */}
        <div className="relative mt-10">
          <div className="absolute inset-x-0 top-[38px] h-[3px] rounded-full bg-border" aria-hidden />
          <div
            className="absolute top-[38px] h-[3px] rounded-full bg-accent transition-all duration-500"
            style={{
              insetInlineStart: 0,
              width: `${((active + 1) / PHASES.length) * 100}%`,
            }}
            aria-hidden
          />

          <ol className="relative grid gap-8 sm:grid-cols-3">
            {PHASES.map((k, i) => {
              const isActive = i <= active;
              return (
                <li key={i} className="flex flex-col items-center text-center">
                  <span className="font-display text-sm font-extrabold tabular-nums text-accent">
                    {k.range}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={i === active}
                    aria-label={L(k.title)}
                    className={`mt-3 grid h-7 w-7 place-items-center rounded-full ring-4 transition ${
                      isActive
                        ? "bg-accent ring-accent/25"
                        : "bg-muted-foreground/40 ring-muted-foreground/15 hover:bg-accent/60"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-background/80" />
                  </button>

                  <div
                    className={`mt-6 w-full rounded-2xl border p-5 text-start transition ${
                      i === active ? "border-accent/50 bg-accent/5 shadow-sm" : "bg-background/60"
                    }`}
                  >
                    <h3 className="font-display text-lg font-bold">{L(k.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {L(k.body)}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {L(k.points).split("\n").map((x) => x.trim()).filter(Boolean).map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
