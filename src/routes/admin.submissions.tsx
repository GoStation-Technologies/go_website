import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import {
  adminBulkUpdateSubmissions,
  adminListStaff,
  adminListSubmissions,
  adminUpdateStatus,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Kind = "franchise" | "acquisitions" | "contact";
const TABS: { key: Kind; label: string }[] = [
  { key: "franchise", label: "Franchise" },
  { key: "acquisitions", label: "Acquisitions" },
  { key: "contact", label: "Contact" },
];
const STATUSES = ["new", "reviewing", "approved", "closed"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_DOT: Record<Status, string> = {
  new: "bg-blue-500",
  reviewing: "bg-amber-500",
  approved: "bg-emerald-500",
  closed: "bg-slate-400",
};
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
    mutationFn: (args: { id: string; status: Status }) =>
      adminUpdateStatus({ data: { kind, ...args } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "submissions", kind] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Selection: keyed by row id, cleared whenever the underlying list changes.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const rowIds = useMemo(() => rows.map((r: Record<string, unknown>) => String(r.id)), [rows]);
  useEffect(() => {
    // Prune selections that no longer exist in the current page.
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (rowIds.includes(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [rowIds]);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rowIds));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Staff list is only fetched when the user opens the assign menu.
  const [staffOpen, setStaffOpen] = useState(false);
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => adminListStaff(),
    enabled: staffOpen,
    staleTime: 5 * 60_000,
  });

  const bulkMut = useMutation({
    mutationFn: (patch: { status?: Status; assigned_to?: string | null }) =>
      adminBulkUpdateSubmissions({
        data: { kind, ids: Array.from(selected), patch },
      }),
    onSuccess: (res, patch) => {
      const label = patch.status
        ? `marked ${patch.status}`
        : patch.assigned_to === null
          ? "unassigned"
          : "reassigned";
      toast.success(
        `${res.updated} submission${res.updated === 1 ? "" : "s"} ${label}`,
      );
      setSelected(new Set());
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["admin", "submissions", kind] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e: Error) => toast.error(e.message || "Bulk update failed"),
  });

  // Pending bulk action awaiting confirmation. Null = no dialog open.
  type PendingAction =
    | { kind: "status"; status: Status }
    | { kind: "assign"; userId: string; name: string }
    | { kind: "unassign" };
  const [confirm, setConfirm] = useState<PendingAction | null>(null);
  const confirmCopy = (() => {
    if (!confirm) return null;
    const n = selected.size;
    const plural = n === 1 ? "" : "s";
    if (confirm.kind === "status") {
      const verb =
        confirm.status === "approved"
          ? "Approve"
          : confirm.status === "closed"
            ? "Close"
            : confirm.status === "reviewing"
              ? "Move to reviewing"
              : "Reopen";
      return {
        title: `${verb} ${n} submission${plural}?`,
        desc: `Sets status to "${confirm.status}" on every selected row. This can't be undone in bulk.`,
        cta: verb,
        destructive: confirm.status === "closed",
      };
    }
    if (confirm.kind === "assign") {
      return {
        title: `Assign ${n} submission${plural} to ${confirm.name}?`,
        desc: `Any existing assignee on the selected rows will be replaced.`,
        cta: "Assign",
        destructive: false,
      };
    }
    return {
      title: `Unassign ${n} submission${plural}?`,
      desc: `The current assignee on every selected row will be cleared.`,
      cta: "Unassign",
      destructive: true,
    };
  })();
  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "status") bulkMut.mutate({ status: confirm.status });
    else if (confirm.kind === "assign") bulkMut.mutate({ assigned_to: confirm.userId });
    else bulkMut.mutate({ assigned_to: null });
  };





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


      <div className="flex flex-wrap items-end justify-between gap-3 border-b">
        <div className="flex gap-1">
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
        {selected.size > 0 && (
          <div className="mb-1 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs">
            <span className="font-medium">{selected.size} selected</span>
            <span className="text-muted-foreground">·</span>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMut.isPending}
              onClick={() => setConfirm({ kind: "status", status: "approved" })}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMut.isPending}
              onClick={() => setConfirm({ kind: "status", status: "closed" })}
            >
              Close
            </Button>
            <DropdownMenu open={staffOpen} onOpenChange={setStaffOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={bulkMut.isPending}>
                  Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto">
                <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {staffLoading && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</div>
                )}
                {!staffLoading && (staffData?.staff ?? []).length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No staff found</div>
                )}
                {(staffData?.staff ?? []).map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onSelect={() => setConfirm({ kind: "assign", userId: s.id, name: s.name })}
                  >
                    <div className="flex flex-col">
                      <span>{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">{s.roles.join(", ")}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => bulkMut.mutate({ assigned_to: null })}>
                  <span className="text-muted-foreground">Unassign</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              disabled={bulkMut.isPending}
            >
              Clear
            </Button>
          </div>
        )}
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
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-input"
                  />
                </th>
                <th className="px-3 py-2 text-start">Ref / ID</th>
                <th className="px-3 py-2 text-start">Contact</th>
                <th className="px-3 py-2 text-start">Details</th>
                <th className="px-3 py-2 text-start">Received</th>
                <th className="px-3 py-2 text-start">Assignee</th>
                <th className="px-3 py-2 text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: Record<string, unknown>) => {
                const id = String(r.id);
                const st = (String(r.status ?? "new") as Status);
                const assignedId = r.assigned_to ? String(r.assigned_to) : null;
                const assignedName =
                  assignedId && (staffData?.staff ?? []).find((s) => s.id === assignedId)?.name;
                const isChecked = selected.has(id);
                return (
                  <tr
                    key={id}
                    className={`border-t align-top ${isChecked ? "bg-muted/40" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${id}`}
                        checked={isChecked}
                        onChange={() => toggleOne(id)}
                        className="h-4 w-4 rounded border-input"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {String((r.reference as string) ?? id.slice(0, 8))}
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
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {assignedName ?? (assignedId ? assignedId.slice(0, 8) : "—")}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          aria-label={`status ${st}`}
                          className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[st] ?? "bg-slate-400"}`}
                        />
                        <select
                          value={st}
                          onChange={(e) =>
                            updateMut.mutate({ id, status: e.target.value as Status })
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
                );
              })}
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
