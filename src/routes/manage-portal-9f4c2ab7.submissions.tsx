import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import {
  adminBulkRestoreSubmissions,
  adminBulkUpdateSubmissions,
  adminListStaff,
  adminListSubmissions,
  adminUpdateStatus,
} from "@/lib/admin.functions";
import { undoStore } from "@/lib/undo-store";
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
import { useTranslation } from "react-i18next";
import { fmtDateTime } from "@/lib/format";

type Kind = "franchise" | "acquisitions" | "contact";
const TAB_KEYS: Kind[] = ["franchise", "acquisitions", "contact"];
const STATUSES = ["new", "reviewing", "approved", "closed"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_DOT: Record<Status, string> = {
  new: "bg-blue-500",
  reviewing: "bg-amber-500",
  approved: "bg-emerald-500",
  closed: "bg-slate-400",
};
const SORTS = [{ v: "newest" }, { v: "oldest" }, { v: "relevance" }] as const;
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

export const Route = createFileRoute("/manage-portal-9f4c2ab7/submissions")({
  validateSearch: zodValidator(searchSchema),
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { t } = useTranslation();
  const { kind, status, days, page, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/manage-portal-9f4c2ab7/submissions" });
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
      toast.success(t("admin.subs.updated"));
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
        ? t("admin.subs.bulk.marked", { status: t(`admin.subs.statuses.${patch.status}`) })
        : patch.assigned_to === null
          ? t("admin.subs.bulk.unassigned")
          : t("admin.subs.bulk.reassigned");
      const kindAtCall = kind; // capture in case the user switches tabs
      const before = res.before ?? [];
      const message = t("admin.subs.bulk.done", { n: res.updated, label });
      if (before.length > 0) {
        // Push into the persistent undo store; the global UndoToastHost owns
        // rendering, countdown and the Undo action so it survives tab
        // switches, route changes, and full page reloads within the window.
        const UNDO_MS = 30_000;
        undoStore.push({
          id: `undo-submissions-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          message,
          createdAt: Date.now(),
          expiresAt: Date.now() + UNDO_MS,
          payload: {
            kind: "submissions",
            submissionKind: kindAtCall,
            rows: before.map((r) => ({
              id: r.id,
              status: r.status,
              assigned_to: r.assigned_to,
            })),
          },
        });
      } else {
        toast.success(message);
      }
      setSelected(new Set());
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["admin", "submissions", kind] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e: Error) => toast.error(e.message || t("admin.subs.bulkFailed")),
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
    if (confirm.kind === "status") {
      const verb =
        confirm.status === "approved"
          ? t("admin.subs.confirm.approve")
          : confirm.status === "closed"
            ? t("admin.subs.confirm.closeCta")
            : confirm.status === "reviewing"
              ? t("admin.subs.confirm.reviewing")
              : t("admin.subs.confirm.reopen");
      return {
        title: t("admin.subs.confirm.statusTitle", { verb, n }),
        desc: t("admin.subs.confirm.statusDesc", { status: t(`admin.subs.statuses.${confirm.status}`) }),
        cta: verb,
        destructive: confirm.status === "closed",
      };
    }
    if (confirm.kind === "assign") {
      return {
        title: t("admin.subs.confirm.assignTitle", { n, name: confirm.name }),
        desc: t("admin.subs.confirm.assignDesc"),
        cta: t("admin.subs.assign"),
        destructive: false,
      };
    }
    return {
      title: t("admin.subs.confirm.unassignTitle", { n }),
      desc: t("admin.subs.confirm.unassignDesc"),
      cta: t("admin.subs.unassign"),
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.subs.title")}</h1>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label={t("admin.subs.timeRange")}
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
              {t("admin.subs.all")}
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
            aria-label={t("admin.common.status")}
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
              {t("admin.subs.all")}
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
                  {t(`admin.subs.statuses.${s}`)}
                </button>
              );
            })}
          </div>
          <div
            role="tablist"
            aria-label={t("admin.subs.sort")}
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
                  {t(`admin.subs.sorts.${s.v}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      <div className="flex flex-wrap items-end justify-between gap-3 border-b">
        <div className="flex gap-1">
          {TAB_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
                kind === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`admin.subs.tabs.${k}`)}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="mb-1 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs">
            <span className="font-medium">{t("admin.subs.selected", { n: selected.size })}</span>
            <span className="text-muted-foreground">·</span>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMut.isPending}
              onClick={() => setConfirm({ kind: "status", status: "approved" })}
            >
              {t("admin.subs.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkMut.isPending}
              onClick={() => setConfirm({ kind: "status", status: "closed" })}
            >
              {t("admin.subs.close")}
            </Button>
            <DropdownMenu open={staffOpen} onOpenChange={setStaffOpen}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={bulkMut.isPending}>
                  {t("admin.subs.assign")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto">
                <DropdownMenuLabel>{t("admin.subs.assignTo")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {staffLoading && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("admin.common.loading")}</div>
                )}
                {!staffLoading && (staffData?.staff ?? []).length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">{t("admin.subs.noStaff")}</div>
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
                <DropdownMenuItem onSelect={() => setConfirm({ kind: "unassign" })}>
                  <span className="text-muted-foreground">{t("admin.subs.unassign")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              disabled={bulkMut.isPending}
            >
              {t("admin.subs.clear")}
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        {isFetching && !rows.length ? (
          <p className="p-6 text-sm text-muted-foreground">{t("admin.common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{t("admin.subs.empty")}</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={t("admin.subs.selectAll")}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-input"
                  />
                </th>
                <th className="px-3 py-2 text-start">{t("admin.subs.cols.ref")}</th>
                <th className="px-3 py-2 text-start">{t("admin.subs.cols.contact")}</th>
                <th className="px-3 py-2 text-start">{t("admin.subs.cols.details")}</th>
                <th className="px-3 py-2 text-start">{t("admin.subs.cols.received")}</th>
                <th className="px-3 py-2 text-start">{t("admin.subs.cols.assignee")}</th>
                <th className="px-3 py-2 text-start">{t("admin.common.status")}</th>
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
                      {fmtDateTime(String(r.created_at))}
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
                            <option key={s} value={s}>{t(`admin.subs.statuses.${s}`)}</option>
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
          {total === 0 ? t("admin.subs.results", { count: 0 }) : t("admin.subs.showing", { from: rangeStart, to: rangeEnd, total })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage(page - 1)}
          >
            {t("admin.subs.previous")}
          </Button>
          <span className="tabular-nums">
            {t("admin.subs.pageOf", { page, count: pageCount })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount || isFetching}
            onClick={() => setPage(page + 1)}
          >
            {t("admin.subs.next")}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !bulkMut.isPending) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkMut.isPending}>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                runConfirm();
              }}
              className={
                confirmCopy?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {bulkMut.isPending ? t("admin.subs.applying") : confirmCopy?.cta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

