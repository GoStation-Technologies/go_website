import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { adminListSections, adminUpsertSection } from "@/lib/cms.functions";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormGrid, FormRow, inputCls } from "@/components/admin/form-kit";
import { getContentLanguage } from "@/lib/i18n";

export type SectionDef = { key: string; en: string; ar: string; media?: boolean };

export type PageDef = {
  slug: string;
  en: string;
  ar: string;
  descEn: string;
  descAr: string;
  sections: SectionDef[];
};

/** Editable sections per public page, in the order they appear on the site. */
export const PAGE_CMS: PageDef[] = [
  {
    slug: "home",
    en: "Homepage",
    ar: "الصفحة الرئيسية",
    descEn: "Hero, services, network, franchise, acquisitions, Go App and reviews headings.",
    descAr: "عناوين البطل والخدمات والشبكة والامتياز والاستحواذ وتطبيق جو والآراء.",
    sections: [
      { key: "hero", en: "Hero", ar: "البانر الرئيسي", media: true },
      { key: "services", en: "Services", ar: "الخدمات" },
      { key: "network", en: "Station network", ar: "شبكة المحطات" },
      { key: "franchise", en: "Franchise banner", ar: "بانر الامتياز", media: true },
      { key: "acquisitions", en: "Acquisitions banner", ar: "بانر الاستحواذ", media: true },
      { key: "go_app", en: "Go App section", ar: "قسم تطبيق جو", media: true },
      { key: "testimonials", en: "Customer reviews", ar: "آراء العملاء" },
      { key: "media", en: "Media highlights", ar: "أبرز الأخبار" },
    ],
  },
  {
    slug: "about",
    en: "About GoStation",
    ar: "عن جو ستيشن",
    descEn: "Company story, vision, mission, values, leadership and awards.",
    descAr: "قصة الشركة والرؤية والرسالة والقيم والقيادة والجوائز.",
    sections: [
      { key: "hero", en: "Hero", ar: "البانر الرئيسي", media: true },
      { key: "story", en: "Our story", ar: "قصتنا", media: true },
      { key: "vision", en: "Vision", ar: "الرؤية" },
      { key: "mission", en: "Mission", ar: "الرسالة" },
      { key: "values", en: "Core values", ar: "القيم الأساسية" },
      { key: "leadership", en: "Leadership", ar: "القيادة" },
      { key: "awards", en: "Accreditations & awards", ar: "الاعتمادات والجوائز" },
    ],
  },
  {
    slug: "franchise",
    en: "Franchise",
    ar: "الامتياز",
    descEn: "Franchise hero, benefits, requirements and application steps.",
    descAr: "بانر الامتياز والمزايا والمتطلبات وخطوات التقديم.",
    sections: [
      { key: "hero", en: "Hero", ar: "البانر الرئيسي", media: true },
      { key: "benefits", en: "Benefits", ar: "المزايا" },
      { key: "requirements", en: "Requirements", ar: "المتطلبات" },
      { key: "steps", en: "Application steps", ar: "خطوات التقديم" },
      { key: "form", en: "Application form intro", ar: "مقدمة نموذج التقديم" },
    ],
  },
  {
    slug: "acquisitions",
    en: "Acquisitions",
    ar: "الاستحواذ",
    descEn: "Acquisition guidelines, criteria and contact callout.",
    descAr: "إرشادات الاستحواذ والمعايير ونداء التواصل.",
    sections: [
      { key: "hero", en: "Hero", ar: "البانر الرئيسي", media: true },
      { key: "criteria", en: "Acquisition criteria", ar: "معايير الاستحواذ" },
      { key: "guidelines", en: "Guidelines", ar: "الإرشادات" },
      { key: "contact_callout", en: "Contact callout", ar: "نداء التواصل" },
    ],
  },
  {
    slug: "investors",
    en: "Investor Relations",
    ar: "علاقات المستثمرين",
    descEn: "Investor highlights, reports intro, announcements and contact.",
    descAr: "أبرز مؤشرات المستثمرين ومقدمة التقارير والإعلانات والتواصل.",
    sections: [
      { key: "hero", en: "Hero", ar: "البانر الرئيسي", media: true },
      { key: "highlights", en: "Highlights", ar: "أبرز المؤشرات" },
      { key: "reports", en: "Financial reports", ar: "التقارير المالية" },
      { key: "announcements", en: "Announcements", ar: "الإعلانات" },
      { key: "contact", en: "Investor contact", ar: "تواصل المستثمرين" },
    ],
  },
];

type Row = {
  id?: string;
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

const blank = (page: string, key: string, order: number): Row => ({
  page_slug: page,
  section_key: key,
  title_en: "",
  title_ar: "",
  subtitle_en: "",
  subtitle_ar: "",
  content_en: "",
  content_ar: "",
  media_url: "",
  sort_order: order,
  is_visible: true,
});

export function PageSectionsEditor({ page }: { page: PageDef }) {
  const { t, i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Row>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "page_sections"],
    queryFn: () => adminListSections(),
  });

  const rows = ((data?.rows ?? []) as Row[]).filter((r) => r.page_slug === page.slug);

  const save = useMutation({
    mutationFn: async (row: Row) => {
      await adminUpsertSection({
        data: {
          ...(row.id ? { id: row.id } : {}),
          page_slug: row.page_slug,
          section_key: row.section_key,
          title_en: row.title_en ?? null,
          title_ar: row.title_ar ?? null,
          subtitle_en: row.subtitle_en ?? null,
          subtitle_ar: row.subtitle_ar ?? null,
          content_en: row.content_en ?? null,
          content_ar: row.content_ar ?? null,
          media_url: row.media_url ?? null,
          sort_order: row.sort_order ?? 0,
          is_visible: row.is_visible,
        },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.common.saved"));
      void qc.invalidateQueries({ queryKey: ["admin", "page_sections"] });
      void qc.invalidateQueries({ queryKey: ["cms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{ar ? page.ar : page.en}</h1>
        <p className="text-sm text-muted-foreground">{ar ? page.descAr : page.descEn}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("admin.common.loading")}
        </div>
      ) : null}

      {page.sections.map((def, i) => {
        const stored = rows.find((r) => r.section_key === def.key);
        const base = stored ?? blank(page.slug, def.key, i + 1);
        const row = drafts[def.key] ?? base;
        const patch = (p: Partial<Row>) =>
          setDrafts((d) => ({ ...d, [def.key]: { ...row, ...p } }));
        const pending = save.isPending && save.variables?.section_key === def.key;

        return (
          <Card key={def.key}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">{ar ? def.ar : def.en}</CardTitle>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                {t("admin.cms.visible")}
                <Switch checked={row.is_visible} onCheckedChange={(v) => patch({ is_visible: v })} />
              </label>
            </CardHeader>
            <CardContent>
              <FormGrid>
                <Field label={t("admin.cms.titleEn")} lang="en">
                  <Input
                    className={inputCls}
                    value={row.title_en ?? ""}
                    onChange={(e) => patch({ title_en: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.cms.titleAr")} lang="ar">
                  <Input
                    className={inputCls}
                    value={row.title_ar ?? ""}
                    onChange={(e) => patch({ title_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.cms.subtitleEn")} lang="en">
                  <Input
                    className={inputCls}
                    value={row.subtitle_en ?? ""}
                    onChange={(e) => patch({ subtitle_en: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.cms.subtitleAr")} lang="ar">
                  <Input
                    className={inputCls}
                    value={row.subtitle_ar ?? ""}
                    onChange={(e) => patch({ subtitle_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.cms.bodyEn")} lang="en">
                  <Textarea
                    className={inputCls}
                    rows={5}
                    value={row.content_en ?? ""}
                    onChange={(e) => patch({ content_en: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.cms.bodyAr")} lang="ar">
                  <Textarea
                    className={inputCls}
                    rows={5}
                    value={row.content_ar ?? ""}
                    onChange={(e) => patch({ content_ar: e.target.value })}
                  />
                </Field>
                {def.media ? (
                  <div className="sm:col-span-2">
                    <Field label={t("admin.cms.media")} lang="en">
                      <MediaUpload value={row.media_url} onChange={(url) => patch({ media_url: url })} />
                    </Field>
                  </div>
                ) : null}
                <FormRow>
                  <Button size="sm" disabled={pending} onClick={() => save.mutate(row)}>
                    {pending ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                    {t("admin.common.save")}
                  </Button>
                </FormRow>
              </FormGrid>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
