import { useEffect, useState } from "react";

export function UndoToastContent({
  message,
  durationMs,
}: {
  message: string;
  durationMs: number;
}) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, durationMs - (Date.now() - start));
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [durationMs]);

  const seconds = Math.ceil(remaining / 1000);
  const pct = Math.max(0, Math.min(100, (remaining / durationMs) * 100));

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="text-sm font-medium">{message}</div>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className="text-xs tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {seconds}s
        </span>
      </div>
    </div>
  );
}
