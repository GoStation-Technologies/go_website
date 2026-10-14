import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { adminDeleteLeader, adminListLeaders, adminUpsertLeader } from "@/lib/cms.functions";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormGrid, FormRow, inputCls } from "@/components/admin/form-kit";
import { getContentLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/leaders")({
  head: () => ({ meta: [{ title: "Senior Management — GoStation Admin" }] }),
  component: LeadersAdmin,
});

type Leader = {
  id?: string;
  name_en: string;
  name_ar: string;
  title_en: string;
  title_ar: string;
  bio_en: string | null;
  bio_ar: string | null;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const blank = (order: number): Leader => ({
  name_en: "",
  name_ar: "",
  title_en: "",
  title_ar: "",
  bio_en: "",
  bio_ar: "",
  photo_url: "",
  sort_order: order,
  is_active: true,
});

function LeadersAdmin() {
  const { i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Leader>>({});
  const [newRow, setNewRow] = useState<Leader | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leaders"],
    queryFn: () => adminListLeaders(),
  });
  const rows = (data?.rows ?? []) as (Leader & { id: string })[];

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "leaders"] });
    void qc.invalidateQueries({ queryKey: ["cms"] });
  };

  const save = useMutation({
    mutationFn: (l: Leader) =>
      adminUpsertLeader({
        data: {
          ...(l.id ? { id: l.id } : {}),
          name_en: l.name_en,
          name_ar: l.name_ar,
          title_en: l.title_en,
          title_ar: l.title_ar,
          bio_en: l.bio_en || null,
          bio_ar: l.bio_ar || null,
          photo_url: l.photo_url || null,
          sort_order: l.sort_order ?? 0,
          is_active: l.is_active,
        },
      }),
    onSuccess: (_r, l) => {
      toast.success(ar ? "تم الحفظ" : "Saved");
      if (!l.id) setNewRow(null);
      else
        setDrafts((d) => {
          const { [l.id as string]: _drop, ...rest } = d;
          return rest;
        });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteLeader({ data: { id } }),
    onSuccess: () => {
      toast.success(ar ? "تم الحذف" : "Deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "الإدارة العليا" : "Senior Management"}</h1>
          <p className="text-sm text-muted-foreground">
            {ar
              ? "الأسماء والمناصب والصور التي تظهر في صفحة عن الشركة. من يحمل منصب «رئيس مجلس الإدارة» يظهر في البطاقة الرئيسية."
              : "Names, positions and photos shown on the About page. The person titled “Chairman” appears in the featured card."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNewRow(blank(rows.length + 1))}>
          <Plus className="me-1.5 h-4 w-4" />
          {ar ? "إضافة عضو" : "Add member"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : null}

      {newRow ? (
        <LeaderCard
          ar={ar}
          leader={newRow}
          onChange={(p) => setNewRow({ ...newRow, ...p })}
          onSave={() => save.mutate(newRow)}
          saving={save.isPending}
        />
      ) : null}

      {rows.map((r) => {
        const v = drafts[r.id] ?? r;
        return (
          <LeaderCard
            key={r.id}
            ar={ar}
            leader={v}
            onChange={(p) => setDrafts((d) => ({ ...d, [r.id]: { ...v, ...p } }))}
            onSave={() => save.mutate(v)}
            onDelete={() => {
              if (confirm(ar ? "حذف هذا العضو؟" : "Delete this member?")) remove.mutate(r.id);
            }}
            saving={save.isPending && save.variables?.id === r.id}
          />
        );
      })}
    </div>
  );
}

function LeaderCard({
  ar,
  leader,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  ar: boolean;
  leader: Leader;
  onChange: (p: Partial<Leader>) => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const valid = leader.name_en && leader.name_ar && leader.title_en && leader.title_ar;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          {(ar ? leader.name_ar : leader.name_en) || (ar ? "عضو جديد" : "New member")}
        </CardTitle>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {ar ? "ظاهر في الموقع" : "Visible on site"}
            <Switch checked={leader.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
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
          <Field label="Name (English)" lang="en">
            <Input className={inputCls} value={leader.name_en} onChange={(e) => onChange({ name_en: e.target.value })} />
          </Field>
          <Field label="الاسم (العربية)" lang="ar">
            <Input className={inputCls} value={leader.name_ar} onChange={(e) => onChange({ name_ar: e.target.value })} />
          </Field>
          <Field label="Position (English)" lang="en">
            <Input className={inputCls} value={leader.title_en} onChange={(e) => onChange({ title_en: e.target.value })} />
          </Field>
          <Field label="المنصب (العربية)" lang="ar">
            <Input className={inputCls} value={leader.title_ar} onChange={(e) => onChange({ title_ar: e.target.value })} />
          </Field>
          <Field label="Bio (English)" lang="en">
            <Textarea className={inputCls} rows={4} value={leader.bio_en ?? ""} onChange={(e) => onChange({ bio_en: e.target.value })} />
          </Field>
          <Field label="نبذة (العربية)" lang="ar">
            <Textarea className={inputCls} rows={4} value={leader.bio_ar ?? ""} onChange={(e) => onChange({ bio_ar: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={ar ? "الصورة" : "Photo"} lang="en">
              <MediaUpload value={leader.photo_url} folder="leaders" onChange={(url) => onChange({ photo_url: url })} />
            </Field>
          </div>
          <Field label={ar ? "الترتيب" : "Display order"} lang="en">
            <Input
              className={inputCls}
              type="number"
              value={leader.sort_order}
              onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
            />
          </Field>
          <FormRow>
            <Button size="sm" disabled={saving || !valid} onClick={onSave}>
              {saving ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
              {ar ? "حفظ" : "Save"}
            </Button>
          </FormRow>
        </FormGrid>
      </CardContent>
    </Card>
  );
}
