import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminListSubmissions, adminUpdateStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Kind = "franchise" | "acquisitions" | "contact";
const TABS: { key: Kind; label: string }[] = [
  { key: "franchise", label: "Franchise" },
  { key: "acquisitions", label: "Acquisitions" },
  { key: "contact", label: "Contact" },
];
const STATUSES = ["new", "reviewing", "closed"] as const;

export const Route = createFileRoute("/_admin/submissions")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const [kind, setKind] = useState<Kind>("franchise");
  const [status, setStatus] = useState<string>("");
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "submissions", kind, status],
    queryFn: () => adminListSubmissions({ data: { kind, status: status || undefined, limit: 100 } }),
  });

  const updateMut = useMutation({
    mutationFn: (args: { id: string; status: (typeof STATUSES)[number] }) =>
      adminUpdateStatus({ data: { kind, ...args } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "submissions", kind] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setKind(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
              kind === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        {isFetching && !rows.length ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No submissions.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start">Ref / ID</th>
                <th className="px-3 py-2 text-start">Contact</th>
                <th className="px-3 py-2 text-start">Details</th>
                <th className="px-3 py-2 text-start">Received</th>
                <th className="px-3 py-2 text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: Record<string, unknown>) => (
                <tr key={String(r.id)} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-xs">
                    {String((r.reference as string) ?? (r.id as string).slice(0, 8))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{String(r.full_name ?? r.name ?? "—")}</div>
                    <div className="text-xs text-muted-foreground">{String(r.email ?? "")}</div>
                    <div className="text-xs text-muted-foreground">{String(r.phone ?? "")}</div>
                  </td>
                  <td className="max-w-md px-3 py-2 text-xs text-muted-foreground">
                    {String(r.message ?? r.city ?? r.subject ?? "").slice(0, 200)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(String(r.created_at)).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={String(r.status ?? "new")}
                      onChange={(e) =>
                        updateMut.mutate({ id: String(r.id), status: e.target.value as (typeof STATUSES)[number] })
                      }
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                      disabled={updateMut.isPending}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
