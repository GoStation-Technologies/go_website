import { useId, type ReactNode } from "react";

export function StatementPair({ children }: { children: ReactNode }) {
  const pattern = useId().replace(/:/g, "");
  return (
    <div className="relative isolate overflow-hidden bg-muted/40">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full text-border/50">
        <defs><pattern id={pattern} width="64" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 16 Q8 4 16 16 T32 16 T48 16 T64 16" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern></defs>
        <rect width="100%" height="100%" fill={`url(#${pattern})`} />
      </svg>
      <div className="relative grid md:grid-cols-2 [&>figure+figure]:border-t [&>figure+figure]:border-border/70 md:[&>figure+figure]:border-t-0 md:[&>figure+figure]:border-s">
        {children}
      </div>
    </div>
  );
}

export function LeadershipStatement({ name, role, quote, photo, initials }: {
  name: string;
  role: string;
  quote: string;
  photo?: string | null;
  initials?: string;
}) {
  return (
    <figure className="flex min-w-0 flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
      <div className="h-36 w-36 shrink-0 overflow-hidden rounded-full bg-secondary sm:h-40 sm:w-40">
        {photo ? <img src={photo} alt={name} className="h-full w-full object-cover object-top" loading="lazy" /> : (
          <span className="grid h-full w-full place-items-center font-display text-3xl font-semibold text-accent">{initials || name.split(" ").slice(0, 2).map((part) => part[0]).join(" ")}</span>
        )}
      </div>
      <blockquote className="mt-6 max-w-lg flex-1 text-pretty text-lg font-medium leading-8 text-foreground sm:text-xl sm:leading-9">
        <span aria-hidden="true" className="me-1 font-serif text-3xl font-bold text-accent">“</span>
        {quote}
        <span aria-hidden="true" className="ms-1 font-serif text-3xl font-bold text-statement-quote-end">”</span>
      </blockquote>
      <figcaption className="mt-7">
        <h3 className="text-sm font-bold uppercase leading-6 tracking-normal text-accent">{name}</h3>
        <p className="mt-1 text-sm leading-6 text-foreground">{role}</p>
      </figcaption>
    </figure>
  );
}