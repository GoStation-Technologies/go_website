import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { adminListSettings, adminSaveSetting } from "@/lib/cms.functions";
import { MediaUpload } from "@/components/admin/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormGrid, FormRow, inputCls } from "@/components/admin/form-kit";

export const Route = createFileRoute("/manage-portal-9f4c2ab7/settings")({
  component: SettingsPage,
});

type Row = { key: string; value: Record<string, unknown> };
type FieldDef = { name: string; label: string; kind?: "text" | "textarea" | "media"; dir?: "ltr" | "rtl" };
type GroupDef = { key: string; title: string; hint: string; fields: FieldDef[] };

const GROUPS: GroupDef[] = [
  {
    key: "contact",
    title: "Contact details — بيانات التواصل",
    hint: "Phone numbers, emails, office address, coordinates and working hours used across the site.",
    fields: [
      { name: "email", label: "Email", dir: "ltr" },
      { name: "phone", label: "Phone / call centre", dir: "ltr" },
      { name: "whatsapp", label: "WhatsApp link", dir: "ltr" },
      { name: "address_en", label: "Address (EN)", dir: "ltr" },
      { name: "address_ar", label: "العنوان (AR)", dir: "rtl" },
      { name: "hours_en", label: "Working hours (EN)", dir: "ltr" },
      { name: "hours_ar", label: "ساعات العمل (AR)", dir: "rtl" },
      { name: "map_lat", label: "Map latitude", dir: "ltr" },
      { name: "map_lng", label: "Map longitude", dir: "ltr" },
    ],
  },
  {
    key: "social_links",
    title: "Footer social links — روابط التواصل الاجتماعي",
    hint: "Target URLs for the social icons in the footer. Leave blank to disable an icon.",
    fields: [
      { name: "x", label: "X (Twitter)", dir: "ltr" },
      { name: "linkedin", label: "LinkedIn", dir: "ltr" },
      { name: "instagram", label: "Instagram", dir: "ltr" },
      { name: "facebook", label: "Facebook", dir: "ltr" },
      { name: "youtube", label: "YouTube", dir: "ltr" },
      { name: "tiktok", label: "TikTok", dir: "ltr" },
    ],
  },
  {
    key: "go_app",
    title: "Go App promo — قسم تطبيق جو",
    hint: "Headline, description, promo image and store links for the Go App banner.",
    fields: [
      { name: "headline_en", label: "Headline (EN)", dir: "ltr" },
      { name: "headline_ar", label: "العنوان (AR)", dir: "rtl" },
      { name: "description_en", label: "Description (EN)", kind: "textarea", dir: "ltr" },
      { name: "description_ar", label: "الوصف (AR)", kind: "textarea", dir: "rtl" },
      { name: "ios_url", label: "App Store link", dir: "ltr" },
      { name: "android_url", label: "Google Play link", dir: "ltr" },
      { name: "image_url", label: "Promo image", kind: "media" },
    ],
  },
  {
    key: "footer",
    title: "Footer copy — نص التذييل",
    hint: "Copyright line shown at the bottom of every page.",
    fields: [
      { name: "copyright_en", label: "Copyright (EN)", dir: "ltr" },
      { name: "copyright_ar", label: "حقوق النشر (AR)", dir: "rtl" },
    ],
  },
];

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
      void qc.invalidateQueries({ queryKey: ["cms", "site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (group: string, field: string, val: string) =>
    setDraft((d) => ({ ...d, [group]: { ...(d[group] ?? {}), [field]: val } }));

  const known = new Set(GROUPS.map((g) => g.key));
  const extraKeys = Object.keys(draft).filter((k) => !known.has(k));

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

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("admin.common.loading")}
        </div>
      ) : null}

      {GROUPS.map((group) => {
        const values = draft[group.key] ?? {};
        const pending = save.isPending && save.variables === group.key;
        return (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle className="text-base">{group.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{group.hint}</p>
            </CardHeader>
            <CardContent>
              <FormGrid>
                {group.fields.map((f) => (
                  <Field key={f.name} label={f.label} lang={f.dir === "rtl" ? "ar" : "en"}>
                    {f.kind === "media" ? (
                      <MediaUpload
                        value={values[f.name] ?? ""}
                        onChange={(url) => set(group.key, f.name, url)}
                        folder="settings"
                      />
                    ) : f.kind === "textarea" ? (
                      <Textarea
                        className={inputCls}
                        rows={3}
                        dir={f.dir}
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(group.key, f.name, e.target.value)}
                      />
                    ) : (
                      <Input
                        className={inputCls}
                        dir={f.dir}
                        value={values[f.name] ?? ""}
                        onChange={(e) => set(group.key, f.name, e.target.value)}
                      />
                    )}
                  </Field>
                ))}
                <FormRow>
                  <Button size="sm" disabled={pending} onClick={() => save.mutate(group.key)}>
                    {pending ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : null}
                    {t("admin.common.save")}
                  </Button>
                </FormRow>
              </FormGrid>
            </CardContent>
          </Card>
        );
      })}

      {extraKeys.map((key) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{key.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(draft[key] ?? {}).map(([field, val]) => (
              <div key={field} className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center">
                <label className="text-sm font-medium">{field}</label>
                <Input
                  className={inputCls}
                  value={val}
                  dir="auto"
                  onChange={(e) => set(key, field, e.target.value)}
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
