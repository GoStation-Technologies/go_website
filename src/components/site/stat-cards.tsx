import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

type Stat = { key: string; val: string; label: string; icon: LucideIcon };

/** Parses "180+" / "3,500,000+" / "50k+" into numeric part + prefix/suffix. */
function parse(val: string) {
  const m = val.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return null;
  const num = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  return { pre: m[1], num, suf: m[3], decimals: (m[2].split(".")[1] ?? "").length };
}

function CountUp({ value }: { value: string }) {
  const parsed = parse(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let started = false;
    const fmt = (n: number) =>
      parsed.pre +
      n.toLocaleString("en-US", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      }) +
      parsed.suf;

    const run = () => {
      const start = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(fmt(parsed.num * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          run();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} dir="ltr" className="tabular-nums">
      {display}
    </span>
  );
}

/** Professional stat cards that float over the section edge above them. */
export function StatCards({ stats }: { stats: readonly Stat[] }) {
  return (
    <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:gap-4">
      {stats.map((s, i) => (
        <div
          key={s.key}
          className="group relative rounded-2xl border border-border/60 bg-card px-4 pb-5 pt-8 text-center shadow-elegant transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <div className="absolute -top-5 start-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow transition-transform duration-300 group-hover:scale-110 rtl:translate-x-1/2">
            <s.icon className="h-4 w-4" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {s.label}
          </div>
          <div className="mt-1.5 font-display text-3xl font-black leading-none tracking-tight text-primary md:text-[2.25rem]">
            <CountUp value={s.val} />
          </div>
        </div>
      ))}
    </div>
  );
}
