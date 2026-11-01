import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminListSettings, adminSaveSetting } from "@/lib/cms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, inputCls } from "@/components/admin/form-kit";

export function ContactEmailEditor() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const qc = useQueryClient();
  const [draft, setDraft] = useState<string | undefined>();
  const settings = useQuery({
    queryKey: ["admin", "site_settings"],
    queryFn: () => adminListSettings(),
  });
  const contact = settings.data?.rows.find((row) => row.key === "contact")?.value;
  const values = contact && typeof contact === "object" && !Array.isArray(contact)
    ? contact as Record<string, unknown>
    : {};
  const email = draft ?? (typeof values.email === "string" ? values.email : "");
  const save = useMutation({
    mutationFn: () => adminSaveSetting({ data: { key: "contact", value: { ...values, email: email.trim() } } }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "site_settings"] }),
        qc.invalidateQueries({ queryKey: ["cms", "site_settings"] }),
      ]);
      setDraft(undefined);
      toast.success(t("admin.common.saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{ar ? "البريد الإلكتروني للتواصل" : "Contact email"}</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
          <Field label={ar ? "البريد الإلكتروني" : "Email"} lang="en">
            <Input aria-label={ar ? "البريد الإلكتروني" : "Email"} type="email" dir="ltr" className={inputCls} value={email} onChange={(event) => setDraft(event.target.value)} disabled={settings.isLoading || settings.isError || save.isPending} />
          </Field>
          {settings.isError && <p role="alert" className="text-sm text-destructive">{settings.error.message}</p>}
          <Button type="submit" size="sm" disabled={settings.isLoading || settings.isError || save.isPending}>
            {save.isPending && <Loader2 className="me-1.5 h-4 w-4 animate-spin" />}
            {t("admin.common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}