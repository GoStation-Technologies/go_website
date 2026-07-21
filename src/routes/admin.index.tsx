import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { adminOverviewStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function Overview() {
  const { data } = useSuspenseQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminOverviewStats(),
  });
  const cards = [
    { label: "Stations", value: data.stations },
    { label: "New franchise applications", value: data.pendingFranchise },
    { label: "New acquisition requests", value: data.pendingAcquisitions },
    { label: "Unread contact messages", value: data.unreadContacts },
    { label: "Chatbot messages (24h)", value: data.chats24h },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-background p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
