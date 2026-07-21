import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminListChats } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/chats")({
  component: ChatsPage,
});

function ChatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "chats"],
    queryFn: () => adminListChats(),
  });
  const [filter, setFilter] = useState("");

  const sessions = useMemo(() => {
    const all = data?.sessions ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) => s.sessionId.toLowerCase().includes(q));
  }, [data, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Chat logs</h1>
        <input
          type="search"
          aria-label="Filter by session ID"
          placeholder="Filter by session ID…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-72 rounded-md border bg-background px-3 py-1.5 font-mono text-xs"
        />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !sessions.length ? (
        <p className="text-sm text-muted-foreground" data-testid="chats-empty">
          {data?.sessions.length ? "No sessions match this filter." : "No chatbot conversations yet."}
        </p>
      ) : (
        <div className="space-y-4" data-testid="chats-list">
          {sessions.map((s) => (
            <details key={s.sessionId} className="rounded-lg border bg-background p-4" data-session-id={s.sessionId} open={Boolean(filter)}>
              <summary className="cursor-pointer text-sm font-medium">
                <span className="font-mono text-xs text-muted-foreground">{s.sessionId.slice(0, 8)}</span>
                <span className="ms-3 text-xs text-muted-foreground">
                  {s.lastAt ? new Date(s.lastAt).toLocaleString() : ""}
                </span>
                <span className="ms-3 text-xs">{s.messages.length} msg</span>
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
    </div>
  );
}
