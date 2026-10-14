import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormGrid, FormRow, inputCls } from "@/components/admin/form-kit";
import { getContentLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/awards")({
  head: () => ({ meta: [{ title: "Accreditations & awards — GoStation Admin" }] }),
  component: AwardsAdmin,
});

type AwardItem = {
  id?: string;
  name_en: string;
  name_ar: string;
  issuer_en: string | null;
  issuer_ar: string | null;
  year: number;
  image_url: string | null;
  sort_order: number;
};

function AwardsAdmin() {
  const { i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, AwardItem>>({});
  const [newRow, setNewRow] = useState<AwardItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "awards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("awards").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = (data ?? []) as (AwardItem & { id: string })[];

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "awards"] });
    void qc.invalidateQueries({ queryKey: ["awards"] });
  };
  const onErr = (e: Error) => toast.error(e.message);

  const save = useMutation({
    mutationFn: async (p: AwardItem) => {
      const payload = {
        name_en: p.name_en.trim(),
        name_ar: p.name_ar.trim(),
        issuer_en: p.issuer_en?.trim() || null,
        issuer_ar: p.issuer_ar?.trim() || null,
        year: Number(p.year) || new Date().getFullYear(),
        image_url: p.image_url || null,
        sort_order: p.sort_order ?? 0,
      };
      const { error } = p.id
        ? await supabase.from("awards").update(payload).eq("id", p.id)
        : await supabase.from("awards").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_r, p) => {
      toast.success(ar ? "تم الحفظ" : "Saved");
      if (!p.id) setNewRow(null);
      else setDrafts((d) => { const { [p.id as string]: _x, ...rest } = d; return rest; });
      refresh();
    },
    onError: onErr,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("awards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(ar ? "تم الحذف" : "Deleted"); refresh(); },
    onError: onErr,
  });
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      for (let i = 0; i < ids.length; i++) {
        const { error } = await supabase.from("awards").update({ sort_order: i + 1 }).eq("id", ids[i]);
        if (error) throw error;
      }
    },
    onSuccess: refresh,
    onError: onErr,
  });
  const move = (i: number, dir: -1 | 1) => {
    const ids = rows.map((r) => r.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "الاعتمادات والجوائز" : "Accreditations & awards"}</h1>
          <p className="text-sm text-muted-foreground">
            {ar ? "تظهر في تبويب «الاعتمادات والجوائز» بصفحة عن الشركة بنفس الترتيب." : "Shown in the About page awards tab in this order."}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setNewRow({ name_en: "", name_ar: "", issuer_en: "", issuer_ar: "", year: new Date().getFullYear(), image_url: "", sort_order: rows.length + 1 })}
        >
          <Plus className="me-1.5 h-4 w-4" />
          {ar ? "إضافة جائزة / شهادة" : "Add award"}
        </Button>
      </div>

      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      {!isLoading && rows.length === 0 && !newRow ? (
        <p className="text-sm text-muted-foreground">{ar ? "لا توجد جوائز بعد." : "No awards yet."}</p>
      ) : null}

      {newRow ? (
        <AwardCard ar={ar} p={newRow} onChange={(x) => setNewRow({ ...newRow, ...x })} onSave={() => save.mutate(newRow)} onCancel={() => setNewRow(null)} saving={save.isPending && !save.variables?.id} />
      ) : null}

      {rows.map((r, i) => {
        const v = drafts[r.id] ?? r;
        return (
          <AwardCard
            key={r.id}
            ar={ar}
            p={v}
            onChange={(x) => setDrafts((d) => ({ ...d, [r.id]: { ...v, ...x } }))}
            onSave={() => save.mutate(v)}
            onDelete={() => { if (confirm(ar ? "حذف هذه الجائزة؟" : "Delete this award?")) remove.mutate(r.id); }}
            onUp={i > 0 ? () => move(i, -1) : undefined}
            onDown={i < rows.length - 1 ? () => move(i, 1) : undefined}
            saving={save.isPending && save.variables?.id === r.id}
          />
        );
      })}
    </div>
  );
}

function AwardCard({
  ar, p, onChange, onSave, onDelete, onCancel, onUp, onDown, saving,
}: {
  ar: boolean;
  p: AwardItem;
  onChange: (x: Partial<AwardItem>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{(ar ? p.name_ar : p.name_en) || (ar ? "جائزة جديدة" : "New award")}</CardTitle>
        {onDelete ? (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" disabled={!onUp} onClick={onUp} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" disabled={!onDown} onClick={onDown} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <FormGrid>
          <Field label="Award title (English)" lang="en">
            <Input className={inputCls} value={p.name_en} onChange={(e) => onChange({ name_en: e.target.value })} />
          </Field>
          <Field label="عنوان الجائزة (العربية)" lang="ar">
            <Input className={inputCls} value={p.name_ar} onChange={(e) => onChange({ name_ar: e.target.value })} />
          </Field>
          <Field label="Issuer (English)" lang="en">
            <Input className={inputCls} value={p.issuer_en ?? ""} onChange={(e) => onChange({ issuer_en: e.target.value })} />
          </Field>
          <Field label="الجهة المانحة (العربية)" lang="ar">
            <Input className={inputCls} value={p.issuer_ar ?? ""} onChange={(e) => onChange({ issuer_ar: e.target.value })} />
          </Field>
          <Field label={ar ? "السنة" : "Year"} lang="en">
            <Input dir="ltr" type="number" min={1990} max={2100} className={inputCls} value={p.year} onChange={(e) => onChange({ year: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={ar ? "الأيقونة أو صورة الشهادة" : "Icon or certificate image"} lang="en">
              <MediaUpload folder="awards" value={p.image_url} onChange={(url) => onChange({ image_url: url })} />
            </Field>
          </div>
          <FormRow>
            <Button size="sm" disabled={saving || !p.name_en || !p.name_ar || !p.year} onClick={onSave}>
              {saving ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
              {ar ? "حفظ" : "Save"}
            </Button>
            {onCancel ? <Button size="sm" variant="ghost" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button> : null}
          </FormRow>
        </FormGrid>
      </CardContent>
    </Card>
  );
}
