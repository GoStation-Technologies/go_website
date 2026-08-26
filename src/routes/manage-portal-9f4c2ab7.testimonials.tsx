import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  adminDeleteTestimonial,
  adminListTestimonials,
  adminUpsertTestimonial,
} from "@/lib/cms.functions";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormGrid, FormRow, inputCls } from "@/components/admin/form-kit";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/testimonials")({
  component: TestimonialsPage,
});

type Row = {
  id?: string;
  author_en: string;
  author_ar: string;
  role_en: string | null;
  role_ar: string | null;
  quote_en: string;
  quote_ar: string;
  avatar_url: string | null;
  rating: number;
  sort_order: number;
  is_active: boolean;
};

const empty: Row = {
  author_en: "",
  author_ar: "",
  role_en: "",
  role_ar: "",
  quote_en: "",
  quote_ar: "",
  avatar_url: "",
  rating: 5,
  sort_order: 0,
  is_active: true,
};

function TestimonialsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Row>>({});
  const [newRow, setNewRow] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: () => adminListTestimonials(),
  });
  const rows = (data?.rows ?? []) as Row[];

  const save = useMutation({
    mutationFn: (r: Row) =>
      adminUpsertTestimonial({
        data: {
          ...(r.id ? { id: r.id } : {}),
          author_en: r.author_en,
          author_ar: r.author_ar,
          role_en: r.role_en ?? null,
          role_ar: r.role_ar ?? null,
          quote_en: r.quote_en,
          quote_ar: r.quote_ar,
          avatar_url: r.avatar_url ?? null,
          rating: r.rating,
          sort_order: r.sort_order,
          is_active: r.is_active,
        },
      }),
    onSuccess: () => {
      toast.success(t("admin.common.saved"));
      setNewRow(null);
      setDrafts({});
      void qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      void qc.invalidateQueries({ queryKey: ["cms", "testimonials"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteTestimonial({ data: { id } }),
    onSuccess: () => {
      toast.success(t("admin.common.deleted"));
      void qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      void qc.invalidateQueries({ queryKey: ["cms", "testimonials"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {t("admin.nav.testimonials", { defaultValue: "Customer reviews" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.cms.testimonialsSub", {
              defaultValue: "Add, edit, reorder or hide the reviews shown on the website.",
            })}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNewRow({ ...empty })}>
          <Plus className="me-1.5 h-4 w-4" />
          {t("admin.common.new", { defaultValue: "New" })}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("admin.common.loading")}
        </div>
      ) : null}

      {newRow ? (
        <ReviewCard
          row={newRow}
          onChange={(p) => setNewRow({ ...newRow, ...p })}
          onSave={() => save.mutate(newRow)}
          saving={save.isPending}
        />
      ) : null}

      {rows.map((r) => {
        const row = drafts[r.id!] ?? r;
        return (
          <ReviewCard
            key={r.id}
            row={row}
            onChange={(p) => setDrafts((d) => ({ ...d, [r.id!]: { ...row, ...p } }))}
            onSave={() => save.mutate(row)}
            onDelete={() => remove.mutate(r.id!)}
            saving={save.isPending}
          />
        );
      })}
    </div>
  );
}

function ReviewCard({
  row,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  row: Row;
  onChange: (p: Partial<Row>) => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          {row.author_en || row.author_ar || t("admin.common.new", { defaultValue: "New" })}
        </CardTitle>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t("admin.cms.visible", { defaultValue: "Visible" })}
            <Switch checked={row.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
          </label>
          {onDelete ? (
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <FormGrid>
          <Field label="Author (EN)" lang="en">
            <Input className={inputCls} value={row.author_en} onChange={(e) => onChange({ author_en: e.target.value })} />
          </Field>
          <Field label="الاسم (AR)" lang="ar">
            <Input className={inputCls} value={row.author_ar} onChange={(e) => onChange({ author_ar: e.target.value })} />
          </Field>
          <Field label="Role (EN)" lang="en">
            <Input className={inputCls} value={row.role_en ?? ""} onChange={(e) => onChange({ role_en: e.target.value })} />
          </Field>
          <Field label="الصفة (AR)" lang="ar">
            <Input className={inputCls} value={row.role_ar ?? ""} onChange={(e) => onChange({ role_ar: e.target.value })} />
          </Field>
          <Field label="Quote (EN)" lang="en">
            <Textarea className={inputCls} rows={4} value={row.quote_en} onChange={(e) => onChange({ quote_en: e.target.value })} />
          </Field>
          <Field label="الاقتباس (AR)" lang="ar">
            <Textarea className={inputCls} rows={4} value={row.quote_ar} onChange={(e) => onChange({ quote_ar: e.target.value })} />
          </Field>
          <Field label={t("admin.cms.sortOrder", { defaultValue: "Order" })} lang="en">
            <Input
              className={inputCls}
              type="number"
              value={row.sort_order}
              onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <Field label="Rating (1–5)" lang="en">
            <Input
              className={inputCls}
              type="number"
              min={1}
              max={5}
              value={row.rating}
              onChange={(e) => onChange({ rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("admin.cms.media", { defaultValue: "Image / file" })} lang="en">
              <MediaUpload value={row.avatar_url} onChange={(url) => onChange({ avatar_url: url })} folder="testimonials" />
            </Field>
          </div>
          <FormRow>
            <Button
              size="sm"
              disabled={saving || !row.author_en || !row.author_ar || !row.quote_en || !row.quote_ar}
              onClick={onSave}
            >
              {saving ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
              {t("admin.common.save")}
            </Button>
          </FormRow>
        </FormGrid>
      </CardContent>
    </Card>
  );
}
