import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

import {
  adminDeletePartner,
  adminListPartners,
  adminReorderPartners,
  adminUpsertPartner,
} from "@/lib/cms.functions";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormGrid, FormRow, inputCls } from "@/components/admin/form-kit";
import { getContentLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/partners")({
  head: () => ({ meta: [{ title: "Partner logos — GoStation Admin" }] }),
  component: PartnersAdmin,
});

type Partner = {
  id?: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
};

function PartnersAdmin() {
  const { i18n } = useTranslation();
  const ar = getContentLanguage(i18n.resolvedLanguage ?? i18n.language) === "ar";
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Partner>>({});
  const [newRow, setNewRow] = useState<Partner | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "partners"], queryFn: () => adminListPartners() });
  const rows = (data?.rows ?? []) as (Partner & { id: string })[];

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "partners"] });
    void qc.invalidateQueries({ queryKey: ["cms"] });
  };
  const onErr = (e: Error) => toast.error(e.message);

  const save = useMutation({
    mutationFn: (p: Partner) =>
      adminUpsertPartner({
        data: {
          ...(p.id ? { id: p.id } : {}),
          name_en: p.name_en,
          name_ar: p.name_ar,
          logo_url: p.logo_url || null,
          website_url: p.website_url || null,
          sort_order: p.sort_order ?? 0,
          is_active: p.is_active,
        },
      }),
    onSuccess: (_r, p) => {
      toast.success(ar ? "تم الحفظ" : "Saved");
      if (!p.id) setNewRow(null);
      else setDrafts((d) => { const { [p.id as string]: _x, ...rest } = d; return rest; });
      refresh();
    },
    onError: onErr,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeletePartner({ data: { id } }),
    onSuccess: () => { toast.success(ar ? "تم الحذف" : "Deleted"); refresh(); },
    onError: onErr,
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminReorderPartners({ data: { ids } }),
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
          <h1 className="text-2xl font-bold">{ar ? "شعارات الشركاء" : "Partner logos"}</h1>
          <p className="text-sm text-muted-foreground">
            {ar ? "تظهر في شريط الشركاء بالصفحة الرئيسية بنفس الترتيب." : "Shown in the homepage partners strip in this order."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNewRow({ name_en: "", name_ar: "", logo_url: "", website_url: "", sort_order: rows.length + 1, is_active: true })}>
          <Plus className="me-1.5 h-4 w-4" />
          {ar ? "إضافة شريك" : "Add partner"}
        </Button>
      </div>

      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}

      {newRow ? (
        <PartnerCard ar={ar} p={newRow} onChange={(x) => setNewRow({ ...newRow, ...x })} onSave={() => save.mutate(newRow)} saving={save.isPending} />
      ) : null}

      {rows.map((r, i) => {
        const v = drafts[r.id] ?? r;
        return (
          <PartnerCard
            key={r.id}
            ar={ar}
            p={v}
            onChange={(x) => setDrafts((d) => ({ ...d, [r.id]: { ...v, ...x } }))}
            onSave={() => save.mutate(v)}
            onDelete={() => { if (confirm(ar ? "حذف هذا الشريك؟" : "Delete this partner?")) remove.mutate(r.id); }}
            onUp={i > 0 ? () => move(i, -1) : undefined}
            onDown={i < rows.length - 1 ? () => move(i, 1) : undefined}
            saving={save.isPending && save.variables?.id === r.id}
          />
        );
      })}
    </div>
  );
}

function PartnerCard({
  ar, p, onChange, onSave, onDelete, onUp, onDown, saving,
}: {
  ar: boolean;
  p: Partner;
  onChange: (x: Partial<Partner>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{(ar ? p.name_ar : p.name_en) || (ar ? "شريك جديد" : "New partner")}</CardTitle>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {ar ? "ظاهر" : "Visible"}
            <Switch checked={p.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
          </label>
          {onDelete ? (
            <>
              <Button size="icon" variant="ghost" disabled={!onUp} onClick={onUp} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" disabled={!onDown} onClick={onDown} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <FormGrid>
          <Field label="Partner name (English)" lang="en">
            <Input className={inputCls} value={p.name_en} onChange={(e) => onChange({ name_en: e.target.value })} />
          </Field>
          <Field label="اسم الشريك (العربية)" lang="ar">
            <Input className={inputCls} value={p.name_ar} onChange={(e) => onChange({ name_ar: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={ar ? "الشعار" : "Logo"} lang="en">
              <MediaUpload folder="partners" value={p.logo_url} onChange={(url) => onChange({ logo_url: url })} />
            </Field>
          </div>
          <Field label={ar ? "رابط الموقع (اختياري)" : "Website (optional)"} lang="en">
            <Input dir="ltr" className={inputCls} value={p.website_url ?? ""} onChange={(e) => onChange({ website_url: e.target.value })} placeholder="https://" />
          </Field>
          <FormRow>
            <Button size="sm" disabled={saving || !p.name_en || !p.name_ar} onClick={onSave}>
              {saving ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
              {ar ? "حفظ" : "Save"}
            </Button>
          </FormRow>
        </FormGrid>
      </CardContent>
    </Card>
  );
}
