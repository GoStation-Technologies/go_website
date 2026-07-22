// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Profiler, StrictMode } from "react";
import { render, screen, cleanup, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the server function BEFORE importing the host that pulls it in.
const { restoreMock } = vi.hoisted(() => ({
  restoreMock: vi.fn(async () => ({ restored: 2 })),
}));
vi.mock("@/lib/admin.functions", () => ({
  adminBulkRestoreSubmissions: restoreMock,
}));

import { UndoToastHost } from "@/components/admin/undo-toast-host";
import { undoStore, type UndoEntry } from "@/lib/undo-store";

function makeEntry(overrides: Partial<UndoEntry> = {}): UndoEntry {
  const now = Date.now();
  return {
    id: overrides.id ?? "undo-1",
    message: overrides.message ?? "Approved 2 submissions",
    createdAt: now,
    expiresAt: now + 30_000,
    payload: overrides.payload ?? {
      kind: "submissions",
      submissionKind: "contact",
      rows: [
        { id: "row-a", status: "new", assigned_to: null },
        { id: "row-b", status: "new", assigned_to: "user-1" },
      ],
    },
    ...overrides,
  };
}

function renderHost() {
  const renderCount = { current: 0 };
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const utils = render(
    <StrictMode>
      <QueryClientProvider client={qc}>
        <Profiler id="host" onRender={() => (renderCount.current += 1)}>
          <UndoToastHost />
        </Profiler>
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  );
  return { ...utils, renderCount, qc };
}

beforeEach(() => {
  restoreMock.mockClear();
  // jsdom doesn't implement pointer capture; sonner's Undo button uses it.
  const proto = Element.prototype as unknown as {
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
    hasPointerCapture?: (id: number) => boolean;
  };
  if (!proto.setPointerCapture) {
    proto.setPointerCapture = () => {};
    proto.releasePointerCapture = () => {};
    proto.hasPointerCapture = () => false;
  }
  // Fresh localStorage per test so the persistent store starts empty.
  window.localStorage.clear();
  for (const e of [...undoStore.list()]) undoStore.remove(e.id);
});

afterEach(() => {
  cleanup();
  for (const e of [...undoStore.list()]) undoStore.remove(e.id);
});

describe("UndoToastHost", () => {
  it("renders the countdown toast when an undo entry is pushed", async () => {
    renderHost();

    act(() => {
      undoStore.push(makeEntry({ message: "Approved 2 submissions" }));
    });

    // The message from the sonner toast body rendered by UndoToastContent.
    expect(await screen.findByText("Approved 2 submissions")).toBeTruthy();
    // The countdown seconds label lives next to the progress bar.
    expect(await screen.findByText(/^\d+s$/)).toBeTruthy();
    // And the Undo action button is exposed by sonner.
    expect(await screen.findByRole("button", { name: /undo/i })).toBeTruthy();
  });

  it("clicking Undo calls adminBulkRestoreSubmissions with the entry payload and dismisses the toast", async () => {
    const user = userEvent.setup();
    renderHost();

    const payload = {
      kind: "submissions" as const,
      submissionKind: "franchise" as const,
      rows: [
        { id: "row-1", status: "approved", assigned_to: null },
        { id: "row-2", status: "closed", assigned_to: "user-9" },
      ],
    };
    act(() => {
      undoStore.push(makeEntry({ id: "undo-x", payload }));
    });

    const undoBtn = await screen.findByRole("button", { name: /undo/i });
    await user.click(undoBtn);

    await waitFor(() => expect(restoreMock).toHaveBeenCalledTimes(1));
    expect(restoreMock).toHaveBeenCalledWith({
      data: {
        kind: "franchise",
        rows: [
          { id: "row-1", status: "approved", assigned_to: null },
          { id: "row-2", status: "closed", assigned_to: "user-9" },
        ],
      },
    });

    // The onSettled path removes the entry from the store.
    await waitFor(() => expect(undoStore.list()).toHaveLength(0));
  });

  it("does not enter a render loop while the countdown ticks", async () => {
    const { renderCount } = renderHost();

    act(() => {
      undoStore.push(makeEntry({ id: "loop-check" }));
    });

    // Let the initial subscribe + toast mount settle.
    await screen.findByRole("button", { name: /undo/i });
    const settled = renderCount.current;

    // The countdown component ticks every 200ms; over ~1.2s the host should
    // stay effectively idle. If useSyncExternalStore's snapshot became
    // unstable (as in the earlier bug) React would re-render every tick.
    await new Promise((r) => setTimeout(r, 1200));

    const delta = renderCount.current - settled;
    // A healthy host renders 0 extra times here; StrictMode double-invoke
    // effects can add a handful. Anything unbounded (>10) means a loop.
    expect(delta).toBeLessThanOrEqual(4);
  });

  it("survives a full page reload within the 30s window: the toast and working Undo re-appear from localStorage", async () => {
    const user = userEvent.setup();

    // First "page load": push an undo entry, confirm it renders, then unmount
    // as if the tab were closed / navigated away.
    const first = renderHost();
    const payload = {
      kind: "submissions" as const,
      submissionKind: "contact" as const,
      rows: [
        { id: "row-r1", status: "new", assigned_to: null },
        { id: "row-r2", status: "new", assigned_to: "user-2" },
      ],
    };
    act(() => {
      undoStore.push(
        makeEntry({ id: "reload-entry", message: "Closed 2 submissions", payload }),
      );
    });
    expect(await screen.findByText("Closed 2 submissions")).toBeTruthy();

    // Confirm the entry is durably in localStorage (this is what survives reload).
    const raw = window.localStorage.getItem("gostation:undo-entries:v1");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)[0].id).toBe("reload-entry");

    // Simulate a reload: fully unmount the previous render, wipe the store's
    // in-memory cache so a fresh read re-hydrates from persisted localStorage,
    // and mount a brand-new host + Toaster tree.
    first.unmount();
    cleanup();
    window.dispatchEvent(
      new StorageEvent("storage", { key: "gostation:undo-entries:v1" }),
    );

    // Sanity: the store re-hydrates its list from persisted localStorage.
    expect(undoStore.list().map((e) => e.id)).toContain("reload-entry");

    const qc2 = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc2}>
        {/* Toaster mounts first so its subscribe effect runs before the host
            dispatches rehydrated toasts (React fires effects bottom-up, so the
            first child's effect runs first). */}
        <Toaster />
        <UndoToastHost />
      </QueryClientProvider>,
    );

    // Toast rehydrates from persisted store with the original message + countdown.
    // Sonner renders both a visible node and an aria-live announcement, so match all.
    expect((await screen.findAllByText("Closed 2 submissions")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/^\d+s$/)).length).toBeGreaterThan(0);

    // And Undo still works end-to-end against the restored payload.
    const undoBtn = await screen.findByRole("button", { name: /undo/i });
    await user.click(undoBtn);

    await waitFor(() => expect(restoreMock).toHaveBeenCalledTimes(1));
    expect(restoreMock).toHaveBeenCalledWith({
      data: {
        kind: "contact",
        rows: [
          { id: "row-r1", status: "new", assigned_to: null },
          { id: "row-r2", status: "new", assigned_to: "user-2" },
        ],
      },
    });
    await waitFor(() => expect(undoStore.list()).toHaveLength(0));
  });
});
