import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

  // Live-region announcement text. Updated when a new undo entry appears
  // AND when an undo attempt resolves (success/error), so screen readers
  // hear each state change exactly once.
  const [announcement, setAnnouncement] = useState("");
  const announcedRef = useRef<Set<string>>(new Set());
  const announceSeqRef = useRef(0);

  // Ensure two consecutive announcements with the same text still fire
  // by appending a growing run of the invisible-separator char (U+2063),
  // which screen readers ignore but React treats as a distinct string.
  const announce = (text: string) => {
    announceSeqRef.current += 1;
    const pad = "\u2063".repeat(announceSeqRef.current % 3);
    setAnnouncement(text + pad);
  };

  // Shared undo trigger used by both the toast action button and the
  // keyboard shortcut (Ctrl/Cmd+Z).
  const runUndo = (entry: UndoEntry) => {
    if (entry.payload.kind !== "submissions") return;
    const submissionKind = entry.payload.submissionKind;
    announce("Reverting undo action.");
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
        success: (r) => {
          const msg = `Reverted ${r.restored} submission${r.restored === 1 ? "" : "s"}`;
          announce(`${msg}. Undo successful.`);
          return msg;
        },
        error: (e: Error) => {
          const msg = e.message || "Undo failed";
          announce(`Undo failed: ${msg}.`);
          return msg;
        },
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
  };


  // Global keyboard shortcut: Ctrl+Z (or Cmd+Z on macOS) triggers the same
  // undo action as clicking the Undo button on the most recent live entry.
  // Ignored while the user is typing in an input/textarea/contentEditable so
  // it doesn't hijack native text-editing undo.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isUndo =
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey &&
        (e.key === "z" || e.key === "Z");
      if (!isUndo) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const now = Date.now();
      const live = undoStore
        .list()
        .filter((entry) => entry.expiresAt > now)
        .sort((a, b) => b.expiresAt - a.expiresAt);
      const next = live[0];
      if (!next) return;

      e.preventDefault();
      runUndo(next);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [qc]);

  // Live-region announcement text. Updated only when a new undo entry
  // appears (not on every countdown tick), so screen readers hear the
  // undo opportunity exactly once per bulk action.
  const [announcement, setAnnouncement] = useState("");
  const announcedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const shown = new Set<string>();
    for (const entry of entries) {
      const remaining = entry.expiresAt - Date.now();
      if (remaining <= 0) continue;
      shown.add(entry.id);

      if (!announcedRef.current.has(entry.id)) {
        announcedRef.current.add(entry.id);
        setAnnouncement(
          `${entry.message}. Press Control or Command Z, or activate the Undo button within 30 seconds to revert.`,
        );
      }

      // sonner de-dupes by id: subsequent calls with the same id just update
      // the existing toast (safe to call on every render pass).
      toast.success(
        <UndoToastContent message={entry.message} expiresAt={entry.expiresAt} />,
        {
          id: entry.id,
          duration: remaining,
          onAutoClose: () => undoStore.remove(entry.id),
          onDismiss: () => undoStore.remove(entry.id),
          // Note: sonner's Toaster already renders toasts inside an
          // aria-live region; the host's own status region above adds a
          // one-shot announcement with the undo instructions.

          action: {
            // Visible "Undo" plus a hidden, descriptive accessible name so
            // screen-reader users hear which action they'd be reverting.
            label: (
              <>
                <span aria-hidden="true">Undo</span>
                <span className="sr-only">{`Undo: ${entry.message}`}</span>
              </>
            ),
            onClick: () => runUndo(entry),
          },
        },
      );
    }
    // Drop announced ids that are no longer live so the same id can
    // re-announce if it's ever re-pushed after being cleared.
    for (const id of Array.from(announcedRef.current)) {
      if (!shown.has(id)) announcedRef.current.delete(id);
    }
    return () => {
      // Nothing to tear down per-render: entries not in the next snapshot
      // are either expired (auto-closed by sonner) or removed explicitly.
      void shown;
    };
  }, [entries, qc]);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}


