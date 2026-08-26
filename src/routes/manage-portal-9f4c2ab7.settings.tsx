import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListSettings, adminSaveSetting } from "@/lib/cms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inputCls } from "@/components/admin/form-kit";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/settings")({
  component: SettingsPage,
});

type Row = { key: string; value: Record<string, unknown> };

function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: () => adminListSettings(),
  });
  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (!data) return;
    const next: Record<string, Record<string, string>> = {};
    for (const row of data.rows as Row[]) {
      next[row.key] = Object.fromEntries(
        Object.entries(row.value ?? {}).map(([k, v]) => [
          k,
          typeof v === "string" ? v : JSON.stringify(v),
        ]),
      );
    }
    setDraft(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async (key: string) => {
      const value: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(draft[key] ?? {})) {
        const trimmed = v.trim();
        value[k] =
          trimmed.startsWith("{") || trimmed.startsWith("[")
            ? (JSON.parse(trimmed) as unknown)
            : v;
      }
      await adminSaveSetting({ data: { key, value } });
    },
    onSuccess: () => {
      toast.success(t("admin.common.saved"));
      void qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.nav.settings", { defaultValue: "Site settings" })}</h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.cms.settingsSub", {
            defaultValue: "Contact details, social links, footer copy and announcement banners.",
          })}
        </p>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">{t("admin.common.loading")}</div> : null}

      {Object.entries(draft).map(([key, fields]) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{key.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(fields).map(([field, val]) => (
              <div key={field} className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center">
                <label className="text-sm font-medium">{field}</label>
                <Input
                  className={inputCls}
                  value={val}
                  dir="auto"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [key]: { ...d[key], [field]: e.target.value } }))
                  }
                />
              </div>
            ))}
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate(key)}>
              {t("admin.common.save")}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
