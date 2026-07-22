import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { undoStore, type UndoEntry } from "@/lib/undo-store";
import { UndoToastContent } from "./undo-toast";
import { adminBulkRestoreSubmissions } from "@/lib/admin.functions";

// Mounted once at the app root. Watches the persistent undo store and renders
// a sonner toast per entry with the matching id so the countdown and Undo
// button survive route/tab changes and page reloads within the undo window.
export function UndoToastHost() {
  const qc = useQueryClient();

  const entries = useSyncExternalStore(
    (fn) => undoStore.subscribe(fn),
    () => undoStore.list(),
    () => [] as UndoEntry[],
  );

  // Prune expired entries on a slow interval so the store doesn't leak.
  useEffect(() => {
    const id = setInterval(() => undoStore.prune(), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const shown = new Set<string>();
    for (const entry of entries) {
      const remaining = entry.expiresAt - Date.now();
      if (remaining <= 0) continue;
      shown.add(entry.id);

      // sonner de-dupes by id: subsequent calls with the same id just update
      // the existing toast (safe to call on every render pass).
      toast.success(
        <UndoToastContent message={entry.message} expiresAt={entry.expiresAt} />,
        {
          id: entry.id,
          duration: remaining,
          onAutoClose: () => undoStore.remove(entry.id),
          onDismiss: () => undoStore.remove(entry.id),
          action: {
            label: "Undo",
            onClick: () => {
              if (entry.payload.kind !== "submissions") return;
              const submissionKind = entry.payload.submissionKind;
              toast.promise(
                adminBulkRestoreSubmissions({
                  data: {
                    kind: submissionKind,
                    rows: entry.payload.rows.map((r) => ({
                      id: r.id,
                      status: r.status as never,
                      assigned_to: r.assigned_to,
                    })),
                  },
                }),
                {
                  loading: "Reverting…",
                  success: (r) =>
                    `Reverted ${r.restored} submission${r.restored === 1 ? "" : "s"}`,
                  error: (e: Error) => e.message || "Undo failed",
                  finally: () => {
                    undoStore.remove(entry.id);
                    toast.dismiss(entry.id);
                    qc.invalidateQueries({
                      queryKey: ["admin", "submissions", submissionKind],
                    });
                    qc.invalidateQueries({ queryKey: ["admin", "overview"] });
                  },
                },
              );
            },
          },
        },
      );
    }
    return () => {
      // Nothing to tear down per-render: entries not in the next snapshot
      // are either expired (auto-closed by sonner) or removed explicitly.
      void shown;
    };
  }, [entries, qc]);

  return null;
}
