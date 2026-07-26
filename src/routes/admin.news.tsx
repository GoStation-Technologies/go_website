import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminListNews, adminUpsertNews, adminDeleteNews } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useListView, ListToolbar, validateListViewSearch } from "@/components/admin/list-toolbar";

export const Route = createFileRoute("/admin/news")({
  component: NewsPage,
  validateSearch: (s: Record<string, unknown>) => validateListViewSearch(s),
});

type News = {
  id?: string; slug: string; kind: "news" | "event" | "press";
  title_ar: string; title_en: string;
  excerpt_ar?: string | null; excerpt_en?: string | null;
  body_ar?: string | null; body_en?: string | null;
  cover_url?: string | null; is_published: boolean; is_featured: boolean;
  published_at?: string | null;
};

const empty: News = {
  slug: "", kind: "news", title_ar: "", title_en: "",
  excerpt_ar: "", excerpt_en: "", body_ar: "", body_en: "",
  cover_url: "", is_published: false, is_featured: false, published_at: null,
};

function NewsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<News>(empty);

  const { data, isFetching } = useQuery({ queryKey: ["admin", "news"], queryFn: () => adminListNews() });
  const upsert = useMutation({
    mutationFn: (n: News) => adminUpsertNews({ data: n }),
    onSuccess: () => { toast.success(t("admin.common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["admin", "news"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteNews({ data: { id } }),
    onSuccess: () => { toast.success(t("admin.common.deleted")); qc.invalidateQueries({ queryKey: ["admin", "news"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data?.rows ?? []) as News[];
  const view = useListView<News>({
    rows,
    search: (n) => `${n.title_en} ${n.title_ar} ${n.slug} ${n.kind}`,
    sort: {
      newest: () => 0,
      title_en: (a, b) => a.title_en.localeCompare(b.title_en),
      kind: (a, b) => a.kind.localeCompare(b.kind),
      published_first: (a, b) => Number(b.is_published) - Number(a.is_published),
    },
    defaultSort: "newest",
  });
  const edit = (n: News) => { setForm({ ...empty, ...n }); setOpen(true); };
  const create = () => { setForm(empty); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">News & Media</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={create}><Plus className="me-1 h-4 w-4" />{t("admin.news.new")}</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? t("admin.news.editTitle") : t("admin.news.newTitle")}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("admin.common.slug")}><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
              <Field label={t("admin.common.kind")}>
                <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as News["kind"] })} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                  <option value="news">{t("admin.news.kinds.news")}</option><option value="event">{t("admin.news.kinds.event")}</option><option value="press">{t("admin.news.kinds.press")}</option>
                </select>
              </Field>
              <Field label={t("admin.news.f.titleEn")}><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></Field>
              <Field label={t("admin.news.f.titleAr")}><Input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></Field>
              <Field label={t("admin.news.f.excerptEn")}><Textarea rows={2} value={form.excerpt_en ?? ""} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} /></Field>
              <Field label={t("admin.news.f.excerptAr")}><Textarea dir="rtl" rows={2} value={form.excerpt_ar ?? ""} onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })} /></Field>
              <Field label={t("admin.news.f.bodyEn")}><Textarea rows={5} value={form.body_en ?? ""} onChange={(e) => setForm({ ...form, body_en: e.target.value })} /></Field>
              <Field label={t("admin.news.f.bodyAr")}><Textarea dir="rtl" rows={5} value={form.body_ar ?? ""} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} /></Field>
              <Field label={t("admin.news.f.coverUrl")}><Input value={form.cover_url ?? ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></Field>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />{t("admin.common.published")}</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />{t("admin.common.featured")}</label>
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
          { value: "kind", label: t("admin.common.kind") },
          { value: "published_first", label: t("admin.common.publishedFirst") },
        ]}
        pageSize={view.pageSize} onPageSize={view.setPageSize}
        page={view.page} pageCount={view.pageCount} total={view.total} onPage={view.setPage}
        searchPlaceholder={t("admin.news.searchPlaceholder")}
      />

      <div className="overflow-x-auto rounded-lg border bg-background">
        {isFetching && !rows.length ? <p className="p-6 text-sm text-muted-foreground">{t("admin.common.loading")}</p> :
         view.pageRows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{t("admin.news.empty")}</p> : (
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2 text-start">{t("admin.common.title")}</th><th className="px-3 py-2 text-start">{t("admin.common.kind")}</th><th className="px-3 py-2 text-start">{t("admin.common.status")}</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {view.pageRows.map((n) => (
                <tr key={n.id} className="border-t">
                  <td className="px-3 py-2"><div className="font-medium">{n.title_en}</div><div className="text-xs text-muted-foreground" dir="rtl">{n.title_ar}</div><div className="font-mono text-xs text-muted-foreground">{n.slug}</div></td>
                  <td className="px-3 py-2 text-xs">{t(`admin.news.kinds.${n.kind}`)}</td>
                  <td className="px-3 py-2 text-xs">{n.is_published ? t("admin.common.published") : t("admin.common.draft")}{n.is_featured ? ` · ${t("admin.common.featured")}` : ""}</td>
                  <td className="px-3 py-2 text-end">
                    <Button size="sm" variant="ghost" onClick={() => edit(n)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("admin.news.confirmDelete")) && n.id) del.mutate(n.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
