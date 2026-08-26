import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  adminDeleteOtpWhitelist,
  adminListOtpWhitelist,
  adminUpsertOtpWhitelist,
} from "@/lib/otp-whitelist.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inputCls } from "@/components/admin/form-kit";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/otp-whitelist")({
  component: OtpWhitelistPage,
});

type Entry = {
  id: string;
  phone: string;
  label: string | null;
  fixed_code: string | null;
  mode: string;
  is_active: boolean;
  notes: string | null;
};

const empty = (): Entry => ({
  id: "",
  phone: "",
  label: "",
  fixed_code: "",
  mode: "fixed",
  is_active: true,
  notes: "",
});

function OtpWhitelistPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "otp-whitelist"],
    queryFn: () => adminListOtpWhitelist(),
  });
  const rows = (data?.rows ?? []) as Entry[];
  const [drafts, setDrafts] = useState<Record<string, Entry>>({});
  const [newRow, setNewRow] = useState<Entry | null>(null);

  const value = (e: Entry) => drafts[e.id] ?? e;
  const patch = (e: Entry, p: Partial<Entry>) =>
    setDrafts((d) => ({ ...d, [e.id]: { ...value(e), ...p } }));

  const save = useMutation({
    mutationFn: async (e: Entry) => {
      await adminUpsertOtpWhitelist({
        data: {
          ...(e.id ? { id: e.id } : {}),
          phone: e.phone,
          label: e.label || null,
          fixed_code: e.fixed_code ? e.fixed_code : null,
          mode: e.mode === "sms" ? "sms" : "fixed",
          is_active: e.is_active,
          notes: e.notes || null,
        },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.common.saved", { defaultValue: "Saved" }));
      setNewRow(null);
      void qc.invalidateQueries({ queryKey: ["admin", "otp-whitelist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteOtpWhitelist({ data: { id } }),
    onSuccess: () => {
      toast.success(t("admin.common.deleted", { defaultValue: "Deleted" }));
      void qc.invalidateQueries({ queryKey: ["admin", "otp-whitelist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {t("admin.nav.otpWhitelist", { defaultValue: "OTP whitelist" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.otp.sub", {
              defaultValue:
                "Choose per admin phone number whether sign-in uses a fixed code or a real SMS.",
            })}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNewRow(empty())}>
          <Plus className="me-1.5 h-4 w-4" />
          {t("admin.otp.new", { defaultValue: "New entry" })}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          {t("admin.common.loading", { defaultValue: "Loading…" })}
        </div>
      ) : null}

      {newRow ? (
        <EntryCard
          entry={newRow}
          onChange={(p) => setNewRow({ ...newRow, ...p })}
          onSave={() => save.mutate(newRow)}
          saving={save.isPending}
        />
      ) : null}

      {rows.map((e) => (
        <EntryCard
          key={e.id}
          entry={value(e)}
          onChange={(p) => patch(e, p)}
          onSave={() => save.mutate(value(e))}
          onDelete={() => remove.mutate(e.id)}
          saving={save.isPending}
        />
      ))}

      {!isLoading && rows.length === 0 && !newRow ? (
        <p className="text-sm text-muted-foreground">
          {t("admin.otp.emptyState", {
            defaultValue: "No whitelisted numbers. Every admin receives an SMS code.",
          })}
        </p>
      ) : null}
    </div>
  );
}

function EntryCard({
  entry,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  entry: Entry;
  onChange: (p: Partial<Entry>) => void;
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation();
  const fixed = entry.mode !== "sms";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          {entry.label || entry.phone || t("admin.otp.new", { defaultValue: "New entry" })}
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`active-${entry.id || "new"}`}
              checked={entry.is_active}
              onCheckedChange={(v) => onChange({ is_active: v })}
            />
            <Label htmlFor={`active-${entry.id || "new"}`} className="text-xs">
              {t("admin.otp.active", { defaultValue: "Active" })}
            </Label>
          </div>
          {onDelete ? (
            <Button size="icon" variant="ghost" onClick={onDelete} aria-label="delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("admin.otp.phone", { defaultValue: "Phone number" })}</Label>
          <Input
            className={inputCls}
            dir="ltr"
            placeholder="966508527863"
            value={entry.phone}
            onChange={(ev) => onChange({ phone: ev.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("admin.otp.label", { defaultValue: "Label / email" })}</Label>
          <Input
            className={inputCls}
            value={entry.label ?? ""}
            onChange={(ev) => onChange({ label: ev.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("admin.otp.mode", { defaultValue: "Delivery mode" })}</Label>
          <Select value={fixed ? "fixed" : "sms"} onValueChange={(v) => onChange({ mode: v })}>
            <SelectTrigger className={inputCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">
                {t("admin.otp.modeFixed", { defaultValue: "Fixed code (no SMS)" })}
              </SelectItem>
              <SelectItem value="sms">
                {t("admin.otp.modeSms", { defaultValue: "SMS delivery" })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("admin.otp.code", { defaultValue: "Fixed code" })}</Label>
          <Input
            className={inputCls}
            dir="ltr"
            inputMode="numeric"
            maxLength={6}
            disabled={!fixed}
            placeholder="000000"
            value={entry.fixed_code ?? ""}
            onChange={(ev) => onChange({ fixed_code: ev.target.value.replace(/[^\d]/gu, "") })}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label className="text-xs">{t("admin.otp.notes", { defaultValue: "Notes" })}</Label>
          <Input
            className={inputCls}
            value={entry.notes ?? ""}
            onChange={(ev) => onChange({ notes: ev.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Button size="sm" onClick={onSave} disabled={saving}>
            {t("admin.common.save", { defaultValue: "Save" })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
