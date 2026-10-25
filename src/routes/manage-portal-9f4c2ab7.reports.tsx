import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Save, Eye } from "lucide-react";
import { adminListReports, adminSaveReport } from "@/lib/reports.functions";
import { ReportInput, reportMediaPath } from "@/lib/investor-content";
import { ReportUpload } from "@/components/admin/report-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FormGrid } from "@/components/admin/form-kit";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/reports")({
  component: ReportsPage,
  head: () => pageHead({ path: "/manage-portal-9f4c2ab7/reports", title: "Annual Reports — GoStation Admin", description: "Manage annual financial PDFs, report years and publication for GoStation investors." }),
});
type Draft = z.infer<typeof ReportInput>;
function ReportsPage() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const qc = useQueryClient();
  const list = useServerFn(adminListReports);
  const saveFn = useServerFn(adminSaveReport);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "reports"], queryFn: () => list() });
  const [draft, setDraft] = useState<Draft | null>(null);
  const save = useMutation({
    mutationFn: (row: Draft) => saveFn({ data: row }),
    onSuccess: () => { toast.success(t("admin.common.saved")); setDraft(null); void qc.invalidateQueries({ queryKey: ["admin", "reports"] }); void qc.invalidateQueries({ queryKey: ["cms"] }); },
    onError: () => toast.error(ar ? "تعذر حفظ التقرير. تحقق من الحقول والصلاحيات." : "Could not save. Check the fields and your permissions."),
  });
  function add() {
    const today = new Date().toISOString().slice(0, 10);
    setDraft({ title_ar: "", title_en: "", report_type: "annual", report_year: new Date().getFullYear(), published_at: today, file_url: "", is_published: false });
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{ar ? "إدارة التقارير السنوية" : "Annual reports management"}</h1><Button onClick={add}><Plus className="me-2 h-4 w-4" />{ar ? "إضافة تقرير" : "Add report"}</Button></div>
    {draft && <form className="space-y-4 border-y border-border py-6" onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }}>
      <FormGrid>
        <Field label={ar ? "عنوان التقرير بالعربية" : "Arabic report title"} lang="ar"><Input required maxLength={300} value={draft.title_ar} onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })} /></Field>
        <Field label={ar ? "عنوان التقرير بالإنجليزية" : "English report title"} lang="en"><Input required maxLength={300} value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} /></Field>
        <Field label={ar ? "السنة" : "Year"}><Input type="number" required min={1900} max={9999} value={draft.report_year} onChange={(e) => setDraft({ ...draft, report_year: Number(e.target.value) })} /></Field>
        <Field label={ar ? "تاريخ النشر" : "Publication date"}><Input type="date" required value={draft.published_at} onChange={(e) => setDraft({ ...draft, published_at: e.target.value })} /></Field>
        <Field label={ar ? "نوع التقرير" : "Report type"}><Select value={draft.report_type} onValueChange={(value: Draft["report_type"]) => setDraft({ ...draft, report_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["annual", "quarterly", "esg"] as const).map((type) => <SelectItem key={type} value={type}>{t(`investors.reportTypes.${type}`)}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="PDF"><div className="flex flex-wrap items-center gap-3"><ReportUpload onChange={(file_url) => setDraft({ ...draft, file_url })} />{reportMediaPath(draft.file_url) && <a href={draft.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary"><Eye className="h-4 w-4" />{ar ? "عرض الملف" : "View PDF"}</a>}</div></Field>
      </FormGrid>
      <label className="flex items-center gap-2"><Switch checked={draft.is_published} onCheckedChange={(is_published) => setDraft({ ...draft, is_published })} />{ar ? "منشور" : "Published"}</label>
      <div className="flex gap-3"><Button type="submit" disabled={save.isPending || !reportMediaPath(draft.file_url)}><Save className="me-2 h-4 w-4" />{t("admin.common.save")}</Button><Button type="button" variant="ghost" onClick={() => setDraft(null)}>{ar ? "إلغاء" : "Cancel"}</Button></div>
    </form>}
    {isLoading && <p>{t("admin.common.loading")}</p>}
    {error && <p role="alert" className="text-destructive">{ar ? "تعذر تحميل التقارير" : "Could not load reports"}</p>}
    <div className="divide-y divide-border">{data?.rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><bdi className="me-3 font-semibold">{row.report_year}</bdi><span>{ar ? row.title_ar : row.title_en}</span><p className="mt-1 text-sm text-muted-foreground">{row.is_published ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</p></div><Button variant="outline" onClick={() => { const path = reportMediaPath(row.file_url); setDraft({ id: row.id, title_ar: row.title_ar, title_en: row.title_en, report_type: row.report_type === "quarterly" || row.report_type === "esg" ? row.report_type : "annual", report_year: row.report_year, published_at: row.published_at, file_url: path ? `/api/public/media/${path}` : "", is_published: row.is_published }); }}>{ar ? "تعديل" : "Edit"}</Button></div>)}</div>
    {data?.rows.length === 0 && <p className="text-muted-foreground">{ar ? "لا توجد تقارير حتى الآن" : "No reports yet"}</p>}
  </div>;
}