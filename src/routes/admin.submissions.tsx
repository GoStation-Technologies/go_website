import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
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
const SORTS = [
  { v: "newest", label: "Newest" },
  { v: "oldest", label: "Oldest" },
  { v: "relevance", label: "Relevance" },
] as const;
type Sort = (typeof SORTS)[number]["v"];

const searchSchema = z.object({
  kind: fallback(z.enum(["franchise", "acquisitions", "contact"]), "franchise").default("franchise"),
  status: fallback(z.string(), "").default(""),
  days: z.number().int().min(1).max(365).optional(),
  page: fallback(z.number().int().min(1), 1).default(1),
  sort: fallback(z.enum(["newest", "oldest", "relevance"]), "newest").default("newest"),
});

const PAGE_SIZE = 25;

const DAY_RANGES = [
  { v: 7, label: "7d" },
  { v: 14, label: "14d" },
  { v: 30, label: "30d" },
  { v: 90, label: "90d" },
] as const;

export const Route = createFileRoute("/admin/submissions")({
  validateSearch: zodValidator(searchSchema),
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { kind, status, days, page, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/submissions" });
  // Any filter/sort change resets page to 1 to avoid landing past the last page.
  const setKind = (k: Kind) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, kind: k, page: 1 }) });
  const setStatus = (s: string) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, status: s, page: 1 }) });
  const setDays = (d: number | undefined) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, days: d, page: 1 }) });
  const setSort = (s: Sort) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, sort: s, page: 1 }) });
  const setPage = (p: number) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, page: p }) });
  const qc = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["admin", "submissions", kind, status, days ?? "all", page, sort],
    queryFn: () =>
      adminListSubmissions({
        data: { kind, status: status || undefined, days, limit: PAGE_SIZE, page, sort },
      }),
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
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Submissions</h1>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Time range"
            className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs"
          >
            <button
              role="tab"
              aria-selected={!days}
              onClick={() => setDays(undefined)}
              className={`rounded px-2 py-1 font-medium transition ${
                !days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {DAY_RANGES.map((r) => (
              <button
                key={r.v}
                role="tab"
                aria-selected={days === r.v}
                onClick={() => setDays(r.v)}
                className={`rounded px-2 py-1 font-medium transition ${
                  days === r.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div
            role="tablist"
            aria-label="Status"
            className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs"
          >
            <button
              role="tab"
              aria-selected={!status}
              onClick={() => setStatus("")}
              className={`rounded px-2 py-1 font-medium capitalize transition ${
                !status ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {STATUSES.map((s) => {
              const active = status === s;
              const dot =
                s === "new" ? "bg-blue-500" : s === "reviewing" ? "bg-amber-500" : "bg-emerald-500";
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(s)}
                  className={`inline-flex items-center gap-1.5 rounded px-2 py-1 font-medium capitalize transition ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
                  {s}
                </button>
              );
            })}
          </div>
          <div
            role="tablist"
            aria-label="Sort"
            className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs"
          >
            {SORTS.map((s) => {
              const active = sort === s.v;
              return (
                <button
                  key={s.v}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSort(s.v)}
                  className={`rounded px-2 py-1 font-medium transition ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
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
                    <div className="flex items-center gap-2">
                      <span
                        aria-label={`status ${String(r.status ?? "new")}`}
                        className={`inline-block h-2 w-2 rounded-full ${
                          String(r.status ?? "new") === "new"
                            ? "bg-blue-500"
                            : String(r.status) === "reviewing"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          {total === 0 ? "0 results" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount || isFetching}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
