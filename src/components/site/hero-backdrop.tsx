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
    let rx = 0;
    let ry = 0;
    let cx = 50;
    let cy = 12;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--px", `${tx.toFixed(2)}px`);
      el.style.setProperty("--py", `${ty.toFixed(2)}px`);
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
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
      tx = -nx * 46;
      ty = -ny * 30;
      rx = ny * 2.4;
      ry = -nx * 3.2;
      cx = (nx + 0.5) * 100;
      cy = (ny + 0.5) * 100;
      schedule();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      rx = 0;
      ry = 0;
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
    <div
      ref={rootRef}
      className="absolute inset-0 -z-10 overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      <div
        className="absolute -inset-[6%] will-change-transform"
        style={{
          transform:
            "translate3d(var(--px, 0px), calc(var(--py, 0px) + var(--sy, 0px)), 0) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(1.04)",
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
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/30" />
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background:
            "radial-gradient(900px 520px at var(--hx, 50%) var(--hy, 12%), color-mix(in oklab, var(--ember) 30%, transparent), transparent 65%)",
        }}
      />
      {/* cursor-following light sheen */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(420px 420px at var(--hx, 50%) var(--hy, 12%), rgba(255,255,255,0.35), transparent 70%)",
        }}
      />
    </div>
  );
}
