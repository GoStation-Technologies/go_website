import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { adminListChats } from "@/lib/admin.functions";

const SORTS = ["newest", "oldest", "messages"] as const;
type Sort = (typeof SORTS)[number];

const searchSchema = z.object({
  page: fallback(z.number().int(), 1).default(1),
  pageSize: fallback(z.number().int(), 10).default(10),
  sort: fallback(z.string(), "newest").default("newest"),
});

export const Route = createFileRoute("/admin/chats")({
  validateSearch: zodValidator(searchSchema),
  component: ChatsPage,
});

function ChatsPage() {
  const { page, pageSize, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/chats" });

  const safePage = Math.max(1, Math.min(1000, page));
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const safeSort: Sort = (SORTS as readonly string[]).includes(sort) ? (sort as Sort) : "newest";

  const [filter, setFilter] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "chats", safePage, safePageSize, safeSort],
    queryFn: () =>
      adminListChats({ data: { page: safePage, pageSize: safePageSize, sort: safeSort } }),
    placeholderData: keepPreviousData,
  });

  const visibleSessions = useMemo(() => {
    const all = data?.sessions ?? [];
    const q = filter.trim().toLowerCase();
    return q ? all.filter((s) => s.sessionId.toLowerCase().includes(q)) : all;
  }, [data, filter]);

  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  const setSearch = (patch: Partial<{ page: number; pageSize: number; sort: string }>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) });

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
            value={safeSort}
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
            value={safePageSize}
            onChange={(e) => setSearch({ pageSize: Number(e.target.value), page: 1 })}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
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
          data-page={safePage}
          data-page-size={safePageSize}
          data-page-count={pageCount}
          data-sort={safeSort}
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
          {total === 0
            ? "0 sessions"
            : `Page ${safePage} of ${pageCount} · ${total} sessions`}
          {isFetching ? " · updating…" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setSearch({ page: Math.max(1, safePage - 1) })}
            disabled={safePage <= 1}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setSearch({ page: Math.min(pageCount, safePage + 1) })}
            disabled={safePage >= pageCount}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
