import { useEffect, useRef } from "react";

/**
 * Interactive hero backdrop: slow ken-burns zoom + pointer/scroll parallax.
 * Pure presentation, SSR-safe (all pointer work happens in an effect).
 */
export function HeroBackdrop({ src, alt }: { src: string; alt: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 50;
    let cy = 12;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--px", `${tx.toFixed(2)}px`);
      el.style.setProperty("--py", `${ty.toFixed(2)}px`);
      el.style.setProperty("--hx", `${cx.toFixed(1)}%`);
      el.style.setProperty("--hy", `${cy.toFixed(1)}%`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tx = -nx * 26;
      ty = -ny * 18;
      cx = (nx + 0.5) * 100;
      cy = (ny + 0.5) * 100;
      schedule();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      cx = 50;
      cy = 12;
      schedule();
    };
    const onScroll = () => {
      const y = Math.min(window.scrollY, 600);
      el.style.setProperty("--sy", `${(y * 0.18).toFixed(1)}px`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -inset-[6%] will-change-transform"
        style={{
          transform: "translate3d(var(--px, 0px), calc(var(--py, 0px) + var(--sy, 0px)), 0)",
          transition: "transform 600ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <img
          src={src}
          alt={alt}
          width={1600}
          height={1600}
          className="animate-ken-burns h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/25" />
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background:
            "radial-gradient(900px 520px at var(--hx, 50%) var(--hy, 12%), color-mix(in oklab, var(--ember) 30%, transparent), transparent 65%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
