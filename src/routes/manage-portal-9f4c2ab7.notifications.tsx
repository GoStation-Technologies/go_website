import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Mail, Send, Loader2 } from "lucide-react";

import {
  adminNotificationSettingsList,
  adminNotificationSettingsSave,
  adminNotificationTestSend,
  NOTIFY_CATEGORIES,
} from "@/lib/notifications.functions";
import { inputCls } from "@/components/admin/form-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/notifications")({
  component: NotificationsSettingsPage,
});

type Row = {
  category: string;
  is_enabled: boolean;
  recipients: string[];
  cc_recipients: string[];
  from_name: string;
  from_email: string | null;
  reply_to: string | null;
  subject_prefix: string | null;
};

const blank = (category: string): Row => ({
  category,
  is_enabled: true,
  recipients: [],
  cc_recipients: [],
  from_name: "GoStation",
  from_email: "",
  reply_to: "",
  subject_prefix: "",
});

function NotificationsSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "notification-settings"],
    queryFn: () => adminNotificationSettingsList(),
  });

  const [draft, setDraft] = useState<Record<string, Row>>({});

  useEffect(() => {
    if (!data) return;
    const next: Record<string, Row> = {};
    for (const c of NOTIFY_CATEGORIES) next[c] = blank(c);
    for (const r of data.rows as unknown as Row[]) {
      next[r.category] = {
        ...blank(r.category),
        ...r,
        recipients: r.recipients ?? [],
        cc_recipients: r.cc_recipients ?? [],
        from_email: r.from_email ?? "",
        reply_to: r.reply_to ?? "",
        subject_prefix: r.subject_prefix ?? "",
      };
    }
    setDraft(next);
  }, [data]);

  const save = useMutation({
    mutationFn: (row: Row) =>
      adminNotificationSettingsSave({
        data: {
          category: row.category as (typeof NOTIFY_CATEGORIES)[number],
          is_enabled: row.is_enabled,
          recipients: row.recipients,
          cc_recipients: row.cc_recipients,
          from_name: row.from_name,
          from_email: row.from_email ?? "",
          reply_to: row.reply_to ?? "",
          subject_prefix: row.subject_prefix ?? "",
        },
      }),
    onSuccess: () => {
      toast.success(t("admin.notifications.saved"));
      qc.invalidateQueries({ queryKey: ["admin", "notification-settings"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const testSend = useMutation({
    mutationFn: (category: string) =>
      adminNotificationTestSend({ data: { category: category as (typeof NOTIFY_CATEGORIES)[number] } }),
    onSuccess: (res) => {
      if ((res as { sent: boolean }).sent) toast.success(t("admin.notifications.testSent"));
      else toast.error(t("admin.notifications.testFailed", { reason: (res as { reason: string }).reason }));
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = (category: string, patch: Partial<Row>) =>
    setDraft((d) => ({ ...d, [category]: { ...d[category], ...patch } }));

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">…</div>;
  if (isError)
    return <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t("admin.notifications.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.notifications.subtitle")}</p>
      </div>

      <div className="grid gap-6">
        {NOTIFY_CATEGORIES.map((c) => {
          const row = draft[c] ?? blank(c);
          return (
            <div key={c} className="admin-card p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-semibold">{t(`admin.notifications.cats.${c}`)}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.recipients.length
                        ? row.recipients.join(", ")
                        : t("admin.notifications.noRecipients")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {t("admin.notifications.enabled")}
                  </Label>
                  <Switch
                    checked={row.is_enabled}
                    onCheckedChange={(v) => update(c, { is_enabled: v })}
                  />
                </div>
              </div>

              <FormGrid>
                <Field label={t("admin.notifications.recipients")} lang="en" hint={t("admin.notifications.listHint")}>
                  <Input
                    className={inputCls}
                    value={row.recipients.join(", ")}
                    onChange={(e) =>
                      update(c, { recipients: splitEmails(e.target.value) })
                    }
                    placeholder="ops@gostation.sa, bd@gostation.sa"
                  />
                </Field>
                <Field label={t("admin.notifications.cc")} lang="en" hint={t("admin.notifications.listHint")}>
                  <Input
                    className={inputCls}
                    value={row.cc_recipients.join(", ")}
                    onChange={(e) => update(c, { cc_recipients: splitEmails(e.target.value) })}
                    placeholder="manager@gostation.sa"
                  />
                </Field>
                <Field label={t("admin.notifications.fromName")} lang="en">
                  <Input
                    className={inputCls}
                    value={row.from_name}
                    onChange={(e) => update(c, { from_name: e.target.value })}
                  />
                </Field>
                <Field label={t("admin.notifications.fromEmail")} lang="en" hint={t("admin.notifications.fromHint")}>
                  <Input
                    className={inputCls}
                    value={row.from_email ?? ""}
                    onChange={(e) => update(c, { from_email: e.target.value })}
                    placeholder="notify@gostation.sa"
                  />
                </Field>
                <Field label={t("admin.notifications.replyTo")} lang="en">
                  <Input
                    className={inputCls}
                    value={row.reply_to ?? ""}
                    onChange={(e) => update(c, { reply_to: e.target.value })}
                    placeholder="franchise@gostation.sa"
                  />
                </Field>
                <Field label={t("admin.notifications.subjectPrefix")} lang="en">
                  <Input
                    className={inputCls}
                    value={row.subject_prefix ?? ""}
                    onChange={(e) => update(c, { subject_prefix: e.target.value })}
                    placeholder="[Franchise]"
                  />
                </Field>
              </FormGrid>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
                <Button
                  onClick={() => save.mutate(row)}
                  disabled={save.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {save.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                  {t("admin.notifications.save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testSend.mutate(c)}
                  disabled={testSend.isPending}
                >
                  <Send className="me-2 h-4 w-4" />
                  {t("admin.notifications.test")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function splitEmails(v: string): string[] {
  return v
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
