import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { undoStore, type UndoEntry } from "./undo-store";

function makeEntry(id: string, ttlMs = 30_000): UndoEntry {
  const now = Date.now();
  return {
    id,
    message: `entry ${id}`,
    createdAt: now,
    expiresAt: now + ttlMs,
    payload: { kind: "submissions", submissionKind: "contact", rows: [] },
  };
}

// Minimal localStorage shim so the module treats us as a browser.
beforeEach(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  // Reset internal cache by removing every known entry.
  undoStore.list().forEach((e) => undoStore.remove(e.id));
});

describe("undoStore snapshot stability", () => {
  it("returns the same array reference across repeated list() calls without mutations", () => {
    undoStore.push(makeEntry("a"));
    const first = undoStore.list();
    const second = undoStore.list();
    const third = undoStore.list();
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it("keeps the reference stable when remove() is a no-op", () => {
    undoStore.push(makeEntry("a"));
    const before = undoStore.list();
    undoStore.remove("does-not-exist");
    expect(undoStore.list()).toBe(before);
  });

  it("keeps the reference stable when prune() finds nothing to remove", () => {
    undoStore.push(makeEntry("a", 30_000));
    const before = undoStore.list();
    undoStore.prune();
    expect(undoStore.list()).toBe(before);
  });

  it("produces a new reference only when the contents actually change", () => {
    undoStore.push(makeEntry("a"));
    const before = undoStore.list();
    undoStore.push(makeEntry("b"));
    const after = undoStore.list();
    expect(after).not.toBe(before);
    expect(after.map((e) => e.id).sort()).toEqual(["a", "b"]);
  });

  it("does not notify subscribers on no-op mutations", () => {
    undoStore.push(makeEntry("a"));
    const listener = vi.fn();
    const unsubscribe = undoStore.subscribe(listener);
    undoStore.remove("does-not-exist");
    undoStore.prune();
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("notifies subscribers exactly once per real mutation", () => {
    const listener = vi.fn();
    const unsubscribe = undoStore.subscribe(listener);
    undoStore.push(makeEntry("a"));
    undoStore.push(makeEntry("b"));
    undoStore.remove("a");
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });
});

describe("countdown ticks do not re-trigger store subscribers", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not fire store listeners while a 200ms countdown interval ticks", () => {
    undoStore.push(makeEntry("a", 30_000));
    const listener = vi.fn();
    const unsubscribe = undoStore.subscribe(listener);

    // Simulate the UndoToastContent countdown: setInterval(..., 200) for 5s.
    // Its local setState must NEVER touch the shared store, so no store
    // listener should ever be invoked from timer ticks.
    const tick = setInterval(() => {
      // local component state would update here — intentionally left blank
    }, 200);
    vi.advanceTimersByTime(5_000);
    clearInterval(tick);

    expect(listener).not.toHaveBeenCalled();

    // And the snapshot the parent reads is still the same reference,
    // so useSyncExternalStore would bail out on Object.is.
    const snapA = undoStore.list();
    vi.advanceTimersByTime(1_000);
    const snapB = undoStore.list();
    expect(snapB).toBe(snapA);

    unsubscribe();
  });
});
