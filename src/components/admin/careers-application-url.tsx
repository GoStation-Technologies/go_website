import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminSaveSetting } from "@/lib/cms.functions";
import { CAREERS_SETTING_KEY, careersApplicationUrl } from "@/lib/careers-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CareersApplicationUrlSetting() {
  const { i18n } = useTranslation();
  const ar = (i18n.resolvedLanguage ?? i18n.language).startsWith("ar");
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "setting", CAREERS_SETTING_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", CAREERS_SETTING_KEY).maybeSingle();
      if (error) throw error;
      return (data?.value ?? {}) as Record<string, unknown>;
    },
  });
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (data) setUrl(typeof data.application_url === "string" ? data.application_url : "");
  }, [data]);

  const save = useMutation({
    mutationFn: (value: string) =>
      adminSaveSetting({ data: { key: CAREERS_SETTING_KEY, value: { ...(data ?? {}), application_url: value } } }),
    onSuccess: () => {
      toast.success(ar ? "تم حفظ الرابط" : "Link saved");
      qc.invalidateQueries({ queryKey: ["admin", "setting", CAREERS_SETTING_KEY] });
      qc.invalidateQueries({ queryKey: ["cms", "site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed && !careersApplicationUrl(trimmed)) {
      setError(ar ? "يرجى إدخال رابط صحيح يبدأ بـ https://" : "Please enter a valid link starting with https://");
      return;
    }
    setError(null);
    save.mutate(trimmed ? careersApplicationUrl(trimmed)! : "");
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-4 sm:p-5">
      <Label htmlFor="careers-apply-url" className="text-sm font-semibold">
        {ar ? "رابط نموذج طلب التوظيف" : "Job Application Form URL"}
      </Label>
      <p className="mt-1 text-xs text-muted-foreground">
        {ar
          ? "يفتح زر «طلب وظيفة» في صفحة التوظيف هذا الرابط. اتركه فارغاً لتعطيل الزر."
          : "The “Apply for a Job” button on the Careers page opens this link. Leave empty to disable the button."}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          id="careers-apply-url"
          dir="ltr"
          type="url"
          inputMode="url"
          placeholder="https://forms.gle/..."
          value={url}
          maxLength={2000}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (ar ? "جارٍ الحفظ..." : "Saving...") : ar ? "حفظ" : "Save"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </form>
  );
}
