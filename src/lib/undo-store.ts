// Persistent, cross-tab undo registry.
//
// The bulk-actions toast used to live inside the submissions route component,
// so switching tabs (or navigating away) unmounted the countdown and the Undo
// button vanished mid-window. This store keeps pending undos alive in
// localStorage and exposes a subscribe/emit API so a globally-mounted host
// component can render them regardless of which route is active. Entries are
// pruned automatically when they expire.

export type UndoPayload = {
  kind: "submissions";
  submissionKind: "franchise" | "acquisitions" | "contact";
  rows: Array<{
    id: string;
    status: string;
    assigned_to: string | null;
  }>;
};

export type UndoEntry = {
  id: string;
  message: string;
  createdAt: number;
  expiresAt: number;
  payload: UndoPayload;
};

const STORAGE_KEY = "gostation:undo-entries:v1";
const listeners = new Set<() => void>();
let cache: UndoEntry[] | null = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read(): UndoEntry[] {
  if (!isBrowser()) return [];
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: UndoEntry[] = raw ? JSON.parse(raw) : [];
    cache = parsed.filter((e) => e && e.expiresAt > Date.now());
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

function write(next: UndoEntry[]) {
  cache = next;
  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota / privacy mode — the in-memory cache still works */
    }
  }
  listeners.forEach((fn) => fn());
}

export const undoStore = {
  list(): UndoEntry[] {
    // Must return a stable reference between mutations — useSyncExternalStore
    // bails out on Object.is equality. Filtering here would allocate a new
    // array on every render and loop forever.
    return read();
  },
  push(entry: UndoEntry) {
    const next = read().filter((e) => e.id !== entry.id && e.expiresAt > Date.now());
    next.push(entry);
    write(next);
  },
  remove(id: string) {
    const current = read();
    const next = current.filter((e) => e.id !== id);
    if (next.length !== current.length) write(next);
  },
  prune() {
    const now = Date.now();
    const current = read();
    const next = current.filter((e) => e.expiresAt > now);
    if (next.length !== current.length) write(next);
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

// Cross-tab sync: mirror writes made by other tabs into this tab's cache.
if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    listeners.forEach((fn) => fn());
  });
}
