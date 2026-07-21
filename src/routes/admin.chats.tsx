import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { adminListChats } from "@/lib/admin.functions";

const SORTS = ["newest", "oldest", "messages"] as const;

const searchSchema = z.object({
  page: fallback(z.number().int(), 1).default(1),
  pageSize: fallback(z.number().int(), 10).default(10),
  sort: fallback(z.string(), "newest").default("newest"),
});

export const Route = createFileRoute("/admin/chats")({
  validateSearch: zodValidator(searchSchema),
  component: ChatsPage,
});

type ChatsError = {
  status: number;
  error?: string;
  message: string;
  fields?: string[];
  fieldErrors?: Record<string, string[]>;
};

/** Try to normalize whatever the server-fn client threw into a ChatsError. */
async function coerceError(e: unknown): Promise<ChatsError> {
  if (e instanceof Response) {
    try {
      const body = (await e.json()) as Partial<ChatsError>;
      return {
        status: e.status,
        error: body.error ?? "error",
        message: body.message ?? `Request failed with status ${e.status}`,
        fields: body.fields,
        fieldErrors: body.fieldErrors,
      };
    } catch {
      return { status: e.status, message: `Request failed with status ${e.status}` };
    }
  }
  if (e && typeof e === "object") {
    const rec = e as Record<string, unknown>;
    // Some server-fn transports surface a structured payload directly.
    const status = typeof rec.status === "number" ? rec.status : 500;
    const message =
      typeof rec.message === "string" ? rec.message : "Request failed.";
    return {
      status,
      error: typeof rec.error === "string" ? rec.error : undefined,
      message,
      fields: Array.isArray(rec.fields) ? (rec.fields as string[]) : undefined,
      fieldErrors:
        rec.fieldErrors && typeof rec.fieldErrors === "object"
          ? (rec.fieldErrors as Record<string, string[]>)
          : undefined,
    };
  }
  return { status: 500, message: e instanceof Error ? e.message : "Request failed." };
}

function ChatsPage() {
  const { page, pageSize, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/chats" });

  const [filter, setFilter] = useState("");

  const { data, error, isLoading, isFetching, isError } = useQuery({
    queryKey: ["admin", "chats", page, pageSize, sort],
    // Pass URL params through as-is; the server owns validation + clamping and
    // is the source of truth for the normalized page/pageSize/sort we render.
    queryFn: async () => {
      try {
        return await adminListChats({ data: { page, pageSize, sort } });
      } catch (e) {
        throw await coerceError(e);
      }
    },
    placeholderData: keepPreviousData,
    retry: false,
  });

  const chatsError = isError ? (error as ChatsError) : null;

  // Prefer server-normalized values; fall back to URL for the very first
  // render before any response arrives.
  const shownPage = data?.page ?? page;
  const shownPageSize = data?.pageSize ?? pageSize;
  const shownSort = data?.sort ?? sort;
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  const visibleSessions = useMemo(() => {
    const all = data?.sessions ?? [];
    const q = filter.trim().toLowerCase();
    return q ? all.filter((s) => s.sessionId.toLowerCase().includes(q)) : all;
  }, [data, filter]);

  const setSearch = (patch: Partial<{ page: number; pageSize: number; sort: string }>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) });

  const selectSort = (SORTS as readonly string[]).includes(shownSort)
    ? (shownSort as (typeof SORTS)[number])
    : "newest";
  const selectPageSize = [5, 10, 25, 50].includes(shownPageSize) ? shownPageSize : 10;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Chat logs</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            aria-label="Filter by session ID"
            placeholder="Filter by session ID…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64 rounded-md border bg-background px-3 py-1.5 font-mono text-xs"
          />
          <label className="text-xs text-muted-foreground" htmlFor="chats-sort">
            Sort
          </label>
          <select
            id="chats-sort"
            aria-label="Sort chats"
            value={selectSort}
            onChange={(e) => setSearch({ sort: e.target.value, page: 1 })}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="newest">Newest activity</option>
            <option value="oldest">Oldest first</option>
            <option value="messages">Most messages</option>
          </select>
          <label className="text-xs text-muted-foreground" htmlFor="chats-page-size">
            Per page
          </label>
          <select
            id="chats-page-size"
            aria-label="Rows per page"
            value={selectPageSize}
            onChange={(e) => setSearch({ pageSize: Number(e.target.value), page: 1 })}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {chatsError ? (
        <div
          role="alert"
          data-testid="chats-error"
          data-status={chatsError.status}
          data-error={chatsError.error ?? ""}
          data-fields={(chatsError.fields ?? []).join(",")}
          className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <p className="font-medium text-destructive" data-testid="chats-error-message">
            {chatsError.message}
          </p>
          {chatsError.fields && chatsError.fields.length > 0 ? (
            <ul className="mt-2 list-disc ps-5 text-destructive/90" data-testid="chats-error-fields">
              {chatsError.fields.map((f) => (
                <li key={f} data-field={f}>
                  <span className="font-mono">{f}</span>
                  {chatsError.fieldErrors?.[f]?.length
                    ? `: ${chatsError.fieldErrors[f].join("; ")}`
                    : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !visibleSessions.length ? (
        <p className="text-sm text-muted-foreground" data-testid="chats-empty">
          {total ? "No sessions match this filter." : "No chatbot conversations yet."}
        </p>
      ) : (
        <div
          className="space-y-4"
          data-testid="chats-list"
          data-total={total}
          data-page={shownPage}
          data-page-size={shownPageSize}
          data-page-count={pageCount}
          data-sort={shownSort}
        >
          {visibleSessions.map((s) => (
            <details
              key={s.sessionId}
              className="rounded-lg border bg-background p-4"
              data-session-id={s.sessionId}
              data-message-count={s.messageCount}
              data-last-at={s.lastAt ?? ""}
              open={Boolean(filter)}
            >
              <summary className="cursor-pointer text-sm font-medium">
                <span className="font-mono text-xs text-muted-foreground">
                  {s.sessionId.slice(0, 8)}
                </span>
                <span className="ms-3 text-xs text-muted-foreground">
                  {s.lastAt ? new Date(s.lastAt).toLocaleString() : ""}
                </span>
                <span className="ms-3 text-xs">{s.messageCount} msg</span>
              </summary>
              <div className="mt-3 space-y-2">
                {s.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      data-role={m.role}
                      className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                        m.role === "user" ? "bg-primary/10 text-primary" : "bg-muted"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-xs text-muted-foreground" data-testid="chats-summary">
          {chatsError
            ? "—"
            : total === 0
              ? "0 sessions"
              : `Page ${shownPage} of ${pageCount} · ${total} sessions`}
          {isFetching && !chatsError ? " · updating…" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setSearch({ page: Math.max(1, shownPage - 1) })}
            disabled={Boolean(chatsError) || shownPage <= 1}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setSearch({ page: Math.min(pageCount, shownPage + 1) })}
            disabled={Boolean(chatsError) || shownPage >= pageCount}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
