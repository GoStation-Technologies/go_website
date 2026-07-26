import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminListJobs, adminUpsertJob, adminDeleteJob } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useListView, ListToolbar, validateListViewSearch } from "@/components/admin/list-toolbar";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/careers")({
  component: CareersPage,
  validateSearch: (s: Record<string, unknown>) => validateListViewSearch(s),
});

type Job = {
  id?: string; slug: string; title_ar: string; title_en: string;
  department_en: string; department_ar: string; city_en: string; city_ar: string;
  employment_type: string;
  description_ar?: string | null; description_en?: string | null; is_active: boolean;
};

const empty: Job = {
  slug: "", title_ar: "", title_en: "",
  department_en: "", department_ar: "", city_en: "", city_ar: "",
  employment_type: "full_time",
  description_ar: "", description_en: "", is_active: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}


function CareersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Job>(empty);

  const { data, isFetching } = useQuery({ queryKey: ["admin", "jobs"], queryFn: () => adminListJobs() });
  const upsert = useMutation({
    mutationFn: (j: Job) => adminUpsertJob({ data: j }),
    onSuccess: () => { toast.success(t("admin.common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteJob({ data: { id } }),
    onSuccess: () => { toast.success(t("admin.common.deleted")); qc.invalidateQueries({ queryKey: ["admin", "jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data?.rows ?? []) as Job[];
  const view = useListView<Job>({
    rows,
    search: (j) => `${j.title_en} ${j.title_ar} ${j.slug} ${j.department_en} ${j.department_ar} ${j.city_en} ${j.city_ar} ${j.employment_type}`,
    sort: {
      newest: () => 0,
      title_en: (a, b) => a.title_en.localeCompare(b.title_en),
      department: (a, b) => (a.department_en ?? "").localeCompare(b.department_en ?? ""),
      city: (a, b) => (a.city_en ?? "").localeCompare(b.city_en ?? ""),
      active_first: (a, b) => Number(b.is_active) - Number(a.is_active),
    },
    defaultSort: "newest",
  });
  const edit = (j: Job) => { setForm({ ...empty, ...j }); setSlugTouched(true); setOpen(true); };
  const create = () => { setForm(empty); setSlugTouched(false); setOpen(true); };

  const onTitleEn = (v: string) =>
    setForm((f) => ({ ...f, title_en: v, slug: slugTouched ? f.slug : slugify(v) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.careers.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={create}><Plus className="me-1 h-4 w-4" />{t("admin.careers.new")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? t("admin.careers.editTitle") : t("admin.careers.newTitle")}</DialogTitle></DialogHeader>
            <div dir="ltr" className="grid grid-cols-2 gap-3">
              <Field label={t("admin.common.slug")} hint={t("admin.careers.f.slugHint")}>
                <Input
                  dir="ltr"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
                />
              </Field>
              <Field label={t("admin.careers.f.employmentType")} rtl>
                <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="full_time">{t("admin.careers.types.full_time")}</option><option value="part_time">{t("admin.careers.types.part_time")}</option>
                  <option value="contract">{t("admin.careers.types.contract")}</option><option value="internship">{t("admin.careers.types.internship")}</option>
                </select>
              </Field>
              <Field label={t("admin.careers.f.titleEn")}><Input value={form.title_en} onChange={(e) => onTitleEn(e.target.value)} /></Field>
              <Field label={t("admin.careers.f.titleAr")} rtl><Input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></Field>
              <Field label={t("admin.careers.f.departmentEn")}><Input value={form.department_en} onChange={(e) => setForm({ ...form, department_en: e.target.value })} /></Field>
              <Field label={t("admin.careers.f.departmentAr")} rtl><Input dir="rtl" value={form.department_ar} onChange={(e) => setForm({ ...form, department_ar: e.target.value })} /></Field>
              <Field label={t("admin.careers.f.cityEn")}><Input value={form.city_en} onChange={(e) => setForm({ ...form, city_en: e.target.value })} /></Field>
              <Field label={t("admin.careers.f.cityAr")} rtl><Input dir="rtl" value={form.city_ar} onChange={(e) => setForm({ ...form, city_ar: e.target.value })} /></Field>
              <Field label={t("admin.careers.f.descriptionEn")}><Textarea rows={5} value={form.description_en ?? ""} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></Field>
              <Field label={t("admin.careers.f.descriptionAr")} rtl><Textarea dir="rtl" rows={5} value={form.description_ar ?? ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></Field>
              <div className="col-span-2 pt-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />{t("admin.careers.f.activeHint")}</label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{t("admin.common.cancel")}</Button>
              <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>{t("admin.common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ListToolbar
        q={view.q} onQ={view.setQ}
        sort={view.sort} onSort={view.setSort}
        sortOptions={[
          { value: "newest", label: t("admin.common.newest") },
          { value: "title_en", label: t("admin.common.titleAz") },
          { value: "department", label: t("admin.common.department") },
          { value: "city", label: t("admin.common.city") },
          { value: "active_first", label: t("admin.common.activeFirst") },
        ]}
        pageSize={view.pageSize} onPageSize={view.setPageSize}
        page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage}
        searchPlaceholder={t("admin.careers.searchPlaceholder")}
      />

      <div className="overflow-x-auto rounded-lg border bg-background">
        {isFetching && !rows.length ? <p className="p-6 text-sm text-muted-foreground">{t("admin.common.loading")}</p> :
         view.pageRows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{t("admin.careers.empty")}</p> : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-start">{t("admin.common.title")}</th><th className="px-3 py-2 text-start">{t("admin.common.department")}</th><th className="px-3 py-2 text-start">{t("admin.common.city")}</th><th className="px-3 py-2 text-start">{t("admin.common.type")}</th><th className="px-3 py-2 text-start">{t("admin.common.status")}</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {view.pageRows.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-3 py-2"><div className="font-medium">{j.title_en}</div><div className="text-xs text-muted-foreground" dir="rtl">{j.title_ar}</div></td>
                  <td className="px-3 py-2 text-xs"><div>{j.department_en}</div><div className="text-muted-foreground" dir="rtl">{j.department_ar}</div></td>
                  <td className="px-3 py-2 text-xs"><div>{j.city_en}</div><div className="text-muted-foreground" dir="rtl">{j.city_ar}</div></td>

                  <td className="px-3 py-2 text-xs">{t(`admin.careers.types.${j.employment_type}`, { defaultValue: j.employment_type })}</td>
                  <td className="px-3 py-2 text-xs">{j.is_active ? t("admin.common.active") : t("admin.common.closed")}</td>
                  <td className="px-3 py-2 text-end">
                    <Button size="sm" variant="ghost" onClick={() => edit(j)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("admin.careers.confirmDelete")) && j.id) del.mutate(j.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
