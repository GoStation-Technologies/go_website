import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Search, Star, Loader2 } from "lucide-react";

import {
  adminListApplications,
  adminUpdateApplication,
  adminApplicationCvUrl,
  APPLICATION_STAGES,
  type ApplicationStage,
} from "@/lib/careers.functions";
import { inputCls } from "@/components/admin/form-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/applications")({
  component: ApplicationsPage,
});

const STAGE_TONE: Record<ApplicationStage, string> = {
  new: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  screening: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  interview: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  offer: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  hired: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-destructive/15 text-destructive",
};

function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const ar = (i18n.resolvedLanguage ?? i18n.language ?? "").startsWith("ar");
  const dir = ar ? "rtl" : "ltr";
  const qc = useQueryClient();

  const [status, setStatus] = useState<"all" | ApplicationStage>("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "applications", status, search, page],
    queryFn: () =>
      adminListApplications({
        data: { status: status === "all" ? undefined : status, q: search, page, pageSize: 25 },
      }),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; status?: ApplicationStage; rating?: number | null }) =>
      adminUpdateApplication({ data: vars }),
    onSuccess: () => {
      toast.success(t("admin.applications.updated"));
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openCv = async (id: string) => {
    try {
      const res = await adminApplicationCvUrl({ data: { id } });
      if (!res.url) return toast.error(t("admin.applications.noCv"));
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("admin.applications.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.applications.subtitle")}</p>
      </div>

      <div className="admin-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            className={`${inputCls} ltr:pl-9 rtl:pr-9`}
            value={q}
            placeholder={t("admin.applications.searchPlaceholder")}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setSearch(q.trim());
              }
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v as "all" | ApplicationStage);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.applications.allStages")}</SelectItem>
            {APPLICATION_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`admin.applications.stages.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">…</div>
      ) : isError ? (
        <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>
      ) : (data?.rows.length ?? 0) === 0 ? (
        <div className="admin-card p-8 text-center text-sm text-muted-foreground">
          {t("admin.applications.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {data!.rows.map((r) => (
            <div key={r.id} className="admin-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{r.full_name}</span>
                    <Badge className={`${STAGE_TONE[r.status]} border-0`}>
                      {t(`admin.applications.stages.${r.status}`)}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {r.email} · {r.phone}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(ar ? r.job_title_ar : r.job_title_en) ?? "—"}
                  </div>
                  {r.cover_letter ? (
                    <p className="mt-2 line-clamp-3 max-w-2xl text-sm">{r.cover_letter}</p>
                  ) : null}
                </div>

                <div className="flex flex-col items-stretch gap-2">
                  <Select
                    value={r.status}
                    onValueChange={(v) => update.mutate({ id: r.id, status: v as ApplicationStage })}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`admin.applications.stages.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n}`}
                        onClick={() => update.mutate({ id: r.id, rating: r.rating === n ? null : n })}
                        className="p-0.5 text-muted-foreground transition-colors hover:text-accent"
                      >
                        <Star
                          className={`h-4 w-4 ${(r.rating ?? 0) >= n ? "fill-accent text-accent" : ""}`}
                        />
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!r.cv_path}
                    onClick={() => openCv(r.id)}
                  >
                    {update.isPending ? null : <Download className="me-2 h-4 w-4" />}
                    {t("admin.applications.cv")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {fmtNumber(data.total, i18n.language)}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t("common.prev", "Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next", "Next")}
            </Button>
          </div>
        </div>
      ) : null}

      {update.isPending ? (
        <div className="fixed bottom-4 end-4 flex items-center gap-2 rounded-md bg-card px-3 py-2 text-xs shadow">
          <Loader2 className="h-3 w-3 animate-spin" /> {t("common.submitting")}
        </div>
      ) : null}
    </div>
  );
}
