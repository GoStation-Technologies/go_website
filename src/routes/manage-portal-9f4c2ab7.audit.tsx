import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { adminListAuditLog, adminExportAuditLog } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useTranslation } from "react-i18next";


const ENTITIES = [
  "franchise_applications",
  "acquisition_requests",
  "contact_messages",
  "stations",
  "news_articles",
  "job_openings",
  "chatbot_messages",
  "abuse_events",
] as const;

const ACTIONS = ["bulk_update", "bulk_restore", "update_status", "upsert", "delete", "export_start"] as const;

const WINDOWS = [
  { v: 24, k: "h24" },
  { v: 24 * 7, k: "d7" },
  { v: 24 * 30, k: "d30" },
  { v: 24 * 90, k: "d90" },
  { v: 24 * 365, k: "y1" },
];

const searchSchema = z.object({
  entity: z.enum(ENTITIES).optional(),
  action: z.enum(ACTIONS).optional(),
  sinceHours: z.coerce.number().int().min(1).max(24 * 365).catch(24 * 30).default(24 * 30),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export const Route = createFileRoute("/manage-portal-9f4c2ab7/audit")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Audit log · GoStation Admin" },
      { name: "description", content: "Chronological record of staff actions on submissions, chats, stations, news, and careers." },
    ],
  }),
  component: AuditPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive" role="alert">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

const ENTITY_LABEL: Record<string, string> = {
  franchise_applications: "Franchise",
  acquisition_requests: "Acquisitions",
  contact_messages: "Contact",
  stations: "Stations",
  news_articles: "News",
  job_openings: "Careers",
  chatbot_messages: "Chats",
  abuse_events: "Abuse",
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  delete: "destructive",
  bulk_update: "default",
  update_status: "default",
  bulk_restore: "secondary",
  upsert: "outline",
  export_start: "secondary",
};

function AuditPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const pageSize = 50;

  const q = useQuery({
    queryKey: ["admin", "audit", search],
    queryFn: () =>
      adminListAuditLog({
        data: {
          entity: search.entity,
          action: search.action,
          sinceHours: search.sinceHours,
          page: search.page,
          pageSize,
        },
      }),
  });

  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { csv, count } = await adminExportAuditLog({
        data: {
          entity: search.entity,
          action: search.action,
          sinceHours: search.sinceHours,
        },
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const parts = [`audit-log`, `${search.sinceHours}h`];
      if (search.entity) parts.push(search.entity);
      if (search.action) parts.push(search.action);
      a.href = url;
      a.download = `${parts.join("_")}_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count.toLocaleString()} row${count === 1 ? "" : "s"}${count >= 10000 ? " (capped at 10,000)" : ""}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.audit.exportFailed"));
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("admin.audit.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.audit.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <label className="text-xs text-muted-foreground">{t("admin.audit.timeRange")}</label>
          <Select
            value={String(search.sinceHours)}
            onValueChange={(v) => navigate({ search: (p: typeof search) => ({ ...p, sinceHours: Number(v), page: 1 }) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => <SelectItem key={w.v} value={String(w.v)}>{t(`admin.audit.ranges.${w.k}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-56">
          <label className="text-xs text-muted-foreground">{t("admin.audit.entity")}</label>
          <Select
            value={search.entity ?? "all"}
            onValueChange={(v) => navigate({ search: (p: typeof search) => ({ ...p, entity: v === "all" ? undefined : (v as (typeof ENTITIES)[number]), page: 1 }) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.audit.allEntities")}</SelectItem>
              {ENTITIES.map((e) => <SelectItem key={e} value={e}>{t(`admin.audit.entities.${e}`, { defaultValue: ENTITY_LABEL[e] ?? e })}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <label className="text-xs text-muted-foreground">{t("admin.audit.action")}</label>
          <Select
            value={search.action ?? "all"}
            onValueChange={(v) => navigate({ search: (p: typeof search) => ({ ...p, action: v === "all" ? undefined : (v as (typeof ACTIONS)[number]), page: 1 }) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.audit.allActions")}</SelectItem>
              {ACTIONS.map((a) => <SelectItem key={a} value={a}>{t(`admin.audit.actions.${a}`, { defaultValue: a })}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ms-auto flex items-center gap-3 self-center">
          <span className="text-sm text-muted-foreground">
            {q.isFetching ? t("admin.common.loading") : t("admin.audit.events", { count: total })}
          </span>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting || total === 0}>
            <Download className="h-4 w-4 mr-1" /> {exporting ? t("admin.audit.exporting") : t("admin.audit.exportCsv")}
          </Button>
        </div>
      </div>


      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-start px-3 py-2">{t("admin.audit.cols.when")}</th>
              <th className="text-start px-3 py-2">{t("admin.audit.cols.actor")}</th>
              <th className="text-start px-3 py-2">{t("admin.audit.cols.action")}</th>
              <th className="text-start px-3 py-2">{t("admin.audit.cols.entity")}</th>
              <th className="text-start px-3 py-2">{t("admin.audit.ids")}</th>
              <th className="text-start px-3 py-2">{t("admin.audit.cols.details")}</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.rows ?? []).map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{r.actor_email ?? r.actor_id ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant={ACTION_VARIANT[r.action] ?? "outline"}>{t(`admin.audit.actions.${r.action}`, { defaultValue: r.action })}</Badge>
                </td>
                <td className="px-3 py-2">{t(`admin.audit.entities.${r.entity}`, { defaultValue: ENTITY_LABEL[r.entity] ?? r.entity })}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground max-w-[16rem] truncate">
                  {(r.entity_ids ?? []).slice(0, 3).join(", ")}
                  {(r.entity_ids?.length ?? 0) > 3 ? ` +${(r.entity_ids?.length ?? 0) - 3}` : ""}
                </td>
                <td className="px-3 py-2">
                  <details>
                    <summary className="cursor-pointer text-xs text-primary">{t("admin.audit.view")}</summary>
                    <pre className="mt-2 max-w-[32rem] overflow-auto rounded bg-muted p-2 text-[11px]">
{JSON.stringify({ diff: r.diff, meta: r.meta }, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {!q.isLoading && (q.data?.rows ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">{t("admin.audit.empty")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">{t("admin.subs.pageOf", { page: search.page, count: pages })}</div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={search.page <= 1}>
            <Link to="/manage-portal-9f4c2ab7/audit" search={(p: Record<string, unknown>) => ({ ...p, page: Math.max(1, search.page - 1) })}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t("admin.common.prev")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={search.page >= pages}>
            <Link to="/manage-portal-9f4c2ab7/audit" search={(p: Record<string, unknown>) => ({ ...p, page: Math.min(pages, search.page + 1) })}>
              {t("admin.common.next")} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
