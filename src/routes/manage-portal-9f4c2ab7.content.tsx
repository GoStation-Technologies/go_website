import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  adminDeleteSection,
  adminListSections,
  adminUpsertSection,
} from "@/lib/cms.functions";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inputCls } from "@/components/admin/form-kit";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/content")({
  component: ContentPage,
});

type Section = {
  id: string;
  page_slug: string;
  section_key: string;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  media_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

const emptySection = (page: string): Section => ({
  id: "",
  page_slug: page,
  section_key: "",
  title_en: "",
  title_ar: "",
  subtitle_en: "",
  subtitle_ar: "",
  content_en: "",
  content_ar: "",
  media_url: "",
  sort_order: 0,
  is_visible: true,
});

function ContentPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "page_sections"],
    queryFn: () => adminListSections(),
  });
  const rows = (data?.rows ?? []) as Section[];

  const pages = useMemo(
    () => Array.from(new Set(rows.map((r) => r.page_slug))).sort(),
    [rows],
  );
  const [page, setPage] = useState<string>("");
  const activePage = page || pages[0] || "home";
  const [drafts, setDrafts] = useState<Record<string, Section>>({});

  const list = rows.filter((r) => r.page_slug === activePage);

  const value = (s: Section) => drafts[s.id] ?? s;
  const patch = (s: Section, p: Partial<Section>) =>
    setDrafts((d) => ({ ...d, [s.id]: { ...value(s), ...p } }));

  const save = useMutation({
    mutationFn: async (s: Section) => {
      const payload = {
        ...(s.id ? { id: s.id } : {}),
        page_slug: s.page_slug,
        section_key: s.section_key,
        title_en: s.title_en ?? null,
        title_ar: s.title_ar ?? null,
        subtitle_en: s.subtitle_en ?? null,
        subtitle_ar: s.subtitle_ar ?? null,
        content_en: s.content_en ?? null,
        content_ar: s.content_ar ?? null,
        media_url: s.media_url ?? null,
        sort_order: s.sort_order ?? 0,
        is_visible: s.is_visible,
      };
      await adminUpsertSection({ data: payload });
    },
    onSuccess: () => {
      toast.success(t("admin.common.saved"));
      setNewRow(null);
      void qc.invalidateQueries({ queryKey: ["admin", "page_sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteSection({ data: { id } }),
    onSuccess: () => {
      toast.success(t("admin.common.deleted"));
      void qc.invalidateQueries({ queryKey: ["admin", "page_sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [newRow, setNewRow] = useState<Section | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {t("admin.nav.content", { defaultValue: "Page content" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.cms.contentSub", {
              defaultValue: "Edit headings, body copy and images for each public page.",
            })}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNewRow(emptySection(activePage))}>
          <Plus className="me-1.5 h-4 w-4" />
          {t("admin.cms.newSection")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {pages.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === activePage ? "default" : "outline"}
            onClick={() => setPage(p)}
          >
            {t(`admin.cms.pages.${p}`, { defaultValue: p })}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{t("admin.common.loading")}</div>
      ) : null}

      {newRow ? (
        <SectionCard
          section={newRow}
          onChange={(p) => setNewRow({ ...newRow, ...p })}
          onSave={() => save.mutate(newRow)}
          saving={save.isPending}
        />
      ) : null}

      {list.map((s) => (
        <SectionCard
          key={s.id}
          section={value(s)}
          onChange={(p) => patch(s, p)}
          onSave={() => save.mutate(value(s))}
          onDelete={() => remove.mutate(s.id)}
          saving={save.isPending}
        />
      ))}
    </div>
  );
}

function SectionCard({
  section,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  section: Section;
  onChange: (p: Partial<Section>) => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          {section.section_key || t("admin.cms.newSection")}
        </CardTitle>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t("admin.cms.visible")}
            <Switch
              checked={section.is_visible}
              onCheckedChange={(v) => onChange({ is_visible: v })}
            />
          </label>
          {onDelete ? (
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Labeled label={t("admin.common.slug")}>
          <Input
            className={inputCls}
            dir="ltr"
            value={section.section_key}
            onChange={(e) => onChange({ section_key: e.target.value })}
          />
        </Labeled>
        <Labeled label={t("admin.cms.sortOrder")}>
          <Input
            className={inputCls}
            type="number"
            value={section.sort_order}
            onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
          />
        </Labeled>
        <Labeled label={t("admin.cms.titleEn")}>
          <Input className={inputCls} dir="ltr" value={section.title_en ?? ""} onChange={(e) => onChange({ title_en: e.target.value })} />
        </Labeled>
        <Labeled label={t("admin.cms.titleAr")}>
          <Input className={inputCls} dir="rtl" value={section.title_ar ?? ""} onChange={(e) => onChange({ title_ar: e.target.value })} />
        </Labeled>
        <Labeled label={t("admin.cms.subtitleEn")}>
          <Input className={inputCls} dir="ltr" value={section.subtitle_en ?? ""} onChange={(e) => onChange({ subtitle_en: e.target.value })} />
        </Labeled>
        <Labeled label={t("admin.cms.subtitleAr")}>
          <Input className={inputCls} dir="rtl" value={section.subtitle_ar ?? ""} onChange={(e) => onChange({ subtitle_ar: e.target.value })} />
        </Labeled>
        <Labeled label={t("admin.cms.bodyEn")}>
          <Textarea rows={5} dir="ltr" value={section.content_en ?? ""} onChange={(e) => onChange({ content_en: e.target.value })} />
        </Labeled>
        <Labeled label={t("admin.cms.bodyAr")}>
          <Textarea rows={5} dir="rtl" value={section.content_ar ?? ""} onChange={(e) => onChange({ content_ar: e.target.value })} />
        </Labeled>
        <div className="md:col-span-2">
          <Labeled label={t("admin.cms.media")}>
            <MediaUpload value={section.media_url} onChange={(url) => onChange({ media_url: url })} />
          </Labeled>
        </div>
        <div className="md:col-span-2">
          <Button size="sm" disabled={saving || !section.section_key} onClick={onSave}>
            {t("admin.common.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
