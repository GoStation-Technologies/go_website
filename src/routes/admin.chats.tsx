import { createFileRoute } from "@tanstack/react-router";
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Chat logs</h1>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.sessions.length ? (
        <p className="text-sm text-muted-foreground">No chatbot conversations yet.</p>
      ) : (
        <div className="space-y-4">
          {data.sessions.map((s) => (
            <details key={s.sessionId} className="rounded-lg border bg-background p-4">
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
