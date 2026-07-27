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
  const { t, i18n } = useTranslation();
  const dir = i18n.language?.startsWith("ar") ? "rtl" : "ltr";
  const align = dir === "rtl" ? ("text-right" as const) : ("text-left" as const);
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
    <div className="space-y-6" dir={dir}>
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
            <div key={c} dir={dir} className="admin-card overflow-hidden p-6">
              <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {t(`admin.notifications.cats.${c}`)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground" dir="ltr">
                      {row.recipients.length
                        ? row.recipients.join(", ")
                        : t("admin.notifications.noRecipients")}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Label className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
                    {t("admin.notifications.enabled")}
                  </Label>
                  <Switch
                    checked={row.is_enabled}
                    onCheckedChange={(v) => update(c, { is_enabled: v })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <EmailField
                  align={align}
                  label={t("admin.notifications.recipients")}
                  hint={t("admin.notifications.listHint")}
                  value={row.recipients.join(", ")}
                  onChange={(v) => update(c, { recipients: splitEmails(v) })}
                  placeholder="ops@gostation.sa, bd@gostation.sa"
                />
                <EmailField
                  align={align}
                  label={t("admin.notifications.cc")}
                  hint={t("admin.notifications.listHint")}
                  value={row.cc_recipients.join(", ")}
                  onChange={(v) => update(c, { cc_recipients: splitEmails(v) })}
                  placeholder="manager@gostation.sa"
                />
                <EmailField
                  align={align}
                  label={t("admin.notifications.fromName")}
                  value={row.from_name}
                  onChange={(v) => update(c, { from_name: v })}
                />
                <EmailField
                  align={align}
                  label={t("admin.notifications.fromEmail")}
                  hint={t("admin.notifications.fromHint")}
                  value={row.from_email ?? ""}
                  onChange={(v) => update(c, { from_email: v })}
                  placeholder="notify@gostation.sa"
                />
                <EmailField
                  align={align}
                  label={t("admin.notifications.replyTo")}
                  value={row.reply_to ?? ""}
                  onChange={(v) => update(c, { reply_to: v })}
                  placeholder="franchise@gostation.sa"
                />
                <EmailField
                  align={align}
                  label={t("admin.notifications.subjectPrefix")}
                  value={row.subject_prefix ?? ""}
                  onChange={(v) => update(c, { subject_prefix: v })}
                  placeholder="[Franchise]"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => testSend.mutate(c)}
                  disabled={testSend.isPending}
                >
                  <Send className="me-2 h-4 w-4" />
                  {t("admin.notifications.test")}
                </Button>
                <Button
                  onClick={() => save.mutate(row)}
                  disabled={save.isPending}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {save.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                  {t("admin.notifications.save")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Label follows the UI language; the value is always a technical LTR string. */
function EmailField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  align,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  align: "text-left" | "text-right";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label className={`block text-sm font-semibold leading-tight text-foreground ${align}`}>
        {label}
      </Label>
      <Input
        dir="ltr"
        className={`${inputCls} w-full text-left`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? (
        <p className={`text-[11px] leading-snug text-muted-foreground ${align}`}>{hint}</p>
      ) : null}
    </div>
  );
}

function splitEmails(v: string): string[] {
  return v
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
