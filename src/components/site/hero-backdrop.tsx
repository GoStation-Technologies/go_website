/** Static hero image with a fixed navy veil; no cursor or scroll tracking. */
export function HeroBackdrop({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
      <img
        src={src}
        alt={alt}
        width={1600}
        height={1600}
        className="h-full w-full object-cover"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/70" />
    </div>
  );
}
