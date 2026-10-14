import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";

import { adminListSettings, adminSaveSetting } from "@/lib/cms.functions";
import { readAboutStory, SETTING_KEY, type AboutStory, type Bi } from "@/lib/about-story";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/about-story")({
  head: () => ({ meta: [{ title: "Growth journey & roadmap — GoStation Admin" }] }),
  component: AboutStoryAdmin,
});

const emptyBi = (): Bi => ({ ar: "", en: "" });

function BiField({ label, value, onChange, multiline }: { label: string; value: Bi; onChange: (v: Bi) => void; multiline?: boolean }) {
  const C = multiline ? Textarea : Input;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-medium">{label} (عربي)</span>
        <C dir="rtl" value={value.ar} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange({ ...value, ar: e.target.value })} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="font-medium">{label} (English)</span>
        <C dir="ltr" value={value.en} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange({ ...value, en: e.target.value })} />
      </label>
    </div>
  );
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

function ItemActions({ i, n, onMove, onDelete }: { i: number; n: number; onMove: (d: number) => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" disabled={i === n - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
      <Button type="button" size="icon" variant="ghost" onClick={onDelete} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}

function AboutStoryAdmin() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "site_settings"], queryFn: () => adminListSettings() });
  const [draft, setDraft] = useState<AboutStory | null>(null);

  useEffect(() => {
    if (q.data && !draft) {
      const row = q.data.rows.find((r) => r.key === SETTING_KEY);
      setDraft(readAboutStory(row?.value));
    }
  }, [q.data, draft]);

  const save = useMutation({
    mutationFn: (v: AboutStory) => adminSaveSetting({ data: { key: SETTING_KEY, value: v as unknown as Record<string, unknown> } }),
    onSuccess: () => {
      toast.success("تم الحفظ — Saved");
      void qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
      void qc.invalidateQueries({ queryKey: ["cms", "site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!draft) return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const j = draft.journey;
  const r = draft.roadmap;
  const setJ = (p: Partial<AboutStory["journey"]>) => setDraft({ ...draft, journey: { ...j, ...p } });
  const setR = (p: Partial<AboutStory["roadmap"]>) => setDraft({ ...draft, roadmap: { ...r, ...p } });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مسيرة النمو والخطة المستقبلية</h1>
          <p className="text-sm text-muted-foreground">Growth journey & future roadmap — About page, "Our story" tab.</p>
        </div>
        <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          حفظ / Save
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>مسيرة النمو — Growth journey</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <BiField label="العنوان الصغير" value={j.eyebrow} onChange={(v) => setJ({ eyebrow: v })} />
          <BiField label="العنوان" value={j.title} onChange={(v) => setJ({ title: v })} />
          <BiField label="المقدمة" value={j.lead} onChange={(v) => setJ({ lead: v })} multiline />
          <p className="text-xs text-muted-foreground">يمكن كتابة {"{{stations}}"} و {"{{regions}}"} لعرض الأعداد الحية.</p>
          {j.items.map((m, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <Input className="w-32" placeholder="2024" value={m.year} onChange={(e) => setJ({ items: j.items.map((x, k) => (k === i ? { ...x, year: e.target.value } : x)) })} />
                <ItemActions i={i} n={j.items.length} onMove={(d) => setJ({ items: move(j.items, i, d) })} onDelete={() => setJ({ items: j.items.filter((_, k) => k !== i) })} />
              </div>
              <BiField label="عنوان المرحلة" value={m.title} onChange={(v) => setJ({ items: j.items.map((x, k) => (k === i ? { ...x, title: v } : x)) })} />
              <BiField label="الوصف" value={m.body} onChange={(v) => setJ({ items: j.items.map((x, k) => (k === i ? { ...x, body: v } : x)) })} multiline />
              <MediaUpload value={m.image} onChange={(url: string) => setJ({ items: j.items.map((x, k) => (k === i ? { ...x, image: url ?? "" } : x)) })} />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setJ({ items: [...j.items, { year: "", title: emptyBi(), body: emptyBi(), image: "" }] })}>
            <Plus className="me-2 h-4 w-4" /> إضافة مرحلة
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>الخطة المستقبلية — Future roadmap</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <BiField label="العنوان الصغير" value={r.eyebrow} onChange={(v) => setR({ eyebrow: v })} />
          <BiField label="العنوان" value={r.title} onChange={(v) => setR({ title: v })} />
          <BiField label="المقدمة" value={r.lead} onChange={(v) => setR({ lead: v })} multiline />
          {r.items.map((p, i) => (
            <div key={i} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <Input className="w-40" placeholder="2026-2027" value={p.range} onChange={(e) => setR({ items: r.items.map((x, k) => (k === i ? { ...x, range: e.target.value } : x)) })} />
                <ItemActions i={i} n={r.items.length} onMove={(d) => setR({ items: move(r.items, i, d) })} onDelete={() => setR({ items: r.items.filter((_, k) => k !== i) })} />
              </div>
              <BiField label="عنوان المرحلة" value={p.title} onChange={(v) => setR({ items: r.items.map((x, k) => (k === i ? { ...x, title: v } : x)) })} />
              <BiField label="الوصف" value={p.body} onChange={(v) => setR({ items: r.items.map((x, k) => (k === i ? { ...x, body: v } : x)) })} multiline />
              <BiField label="النقاط (نقطة في كل سطر)" value={p.points} onChange={(v) => setR({ items: r.items.map((x, k) => (k === i ? { ...x, points: v } : x)) })} multiline />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setR({ items: [...r.items, { range: "", title: emptyBi(), body: emptyBi(), points: emptyBi() }] })}>
            <Plus className="me-2 h-4 w-4" /> إضافة مرحلة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
