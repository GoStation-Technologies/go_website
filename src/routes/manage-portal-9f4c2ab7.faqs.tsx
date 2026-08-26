import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { adminDeleteFaq, adminListFaqs, adminUpsertFaq } from "@/lib/cms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputCls } from "@/components/admin/form-kit";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/faqs")({
  component: FaqsPage,
});

type Faq = {
  id: string;
  category: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  status: string;
  sort_order: number;
};

const empty = (): Faq => ({
  id: "",
  category: "general",
  question_en: "",
  question_ar: "",
  answer_en: "",
  answer_ar: "",
  status: "draft",
  sort_order: 0,
});

function FaqsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: () => adminListFaqs(),
  });
  const rows = (data?.rows ?? []) as Faq[];
  const [drafts, setDrafts] = useState<Record<string, Faq>>({});
  const [newRow, setNewRow] = useState<Faq | null>(null);

  const value = (f: Faq) => drafts[f.id] ?? f;
  const patch = (f: Faq, p: Partial<Faq>) =>
    setDrafts((d) => ({ ...d, [f.id]: { ...value(f), ...p } }));

  const save = useMutation({
    mutationFn: async (f: Faq) => {
      await adminUpsertFaq({
        data: {
          ...(f.id ? { id: f.id } : {}),
          category: f.category,
          question_en: f.question_en,
          question_ar: f.question_ar,
          answer_en: f.answer_en,
          answer_ar: f.answer_ar,
          status: f.status === "published" ? "published" : "draft",
          sort_order: f.sort_order ?? 0,
        },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.common.saved"));
      setNewRow(null);
      void qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteFaq({ data: { id } }),
    onSuccess: () => {
      toast.success(t("admin.common.deleted"));
      void qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.nav.faqs", { defaultValue: "FAQs" })}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.cms.faqsSub", { defaultValue: "Bilingual questions shown on the public site." })}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNewRow(empty())}>
          <Plus className="me-1.5 h-4 w-4" />
          {t("admin.cms.newFaq", { defaultValue: "New question" })}
        </Button>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">{t("admin.common.loading")}</div> : null}

      {newRow ? (
        <FaqCard faq={newRow} onChange={(p) => setNewRow({ ...newRow, ...p })} onSave={() => save.mutate(newRow)} saving={save.isPending} />
      ) : null}

      {rows.map((f) => (
        <FaqCard
          key={f.id}
          faq={value(f)}
          onChange={(p) => patch(f, p)}
          onSave={() => save.mutate(value(f))}
          onDelete={() => remove.mutate(f.id)}
          saving={save.isPending}
        />
      ))}
    </div>
  );
}

function FaqCard({
  faq,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  faq: Faq;
  onChange: (p: Partial<Faq>) => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          {faq.question_en || faq.question_ar || t("admin.cms.newFaq", { defaultValue: "New question" })}
        </CardTitle>
        {onDelete ? (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("admin.common.type")}</span>
          <Input className={inputCls} dir="ltr" value={faq.category} onChange={(e) => onChange({ category: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("admin.common.status")}</span>
          <Select value={faq.status} onValueChange={(v) => onChange({ status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">{t("admin.common.draft")}</SelectItem>
              <SelectItem value="published">{t("admin.common.published")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Question (EN)</span>
          <Input className={inputCls} dir="ltr" value={faq.question_en} onChange={(e) => onChange({ question_en: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">السؤال (AR)</span>
          <Input className={inputCls} dir="rtl" value={faq.question_ar} onChange={(e) => onChange({ question_ar: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Answer (EN)</span>
          <Textarea rows={4} dir="ltr" value={faq.answer_en} onChange={(e) => onChange({ answer_en: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">الإجابة (AR)</span>
          <Textarea rows={4} dir="rtl" value={faq.answer_ar} onChange={(e) => onChange({ answer_ar: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Button size="sm" disabled={saving} onClick={onSave}>{t("admin.common.save")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
