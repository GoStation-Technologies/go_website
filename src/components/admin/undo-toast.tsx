import { useEffect, useState } from "react";

export function UndoToastContent({
  message,
  expiresAt,
}: {
  message: string;
  expiresAt: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const total = 30_000; // canonical undo window used across bulk actions
  const remaining = Math.max(0, expiresAt - now);
  const seconds = Math.ceil(remaining / 1000);
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="text-sm font-medium">{message}</div>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-200 ease-linear"
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
