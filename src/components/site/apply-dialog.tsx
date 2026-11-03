import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitJobApplication } from "@/lib/careers.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
import { ApplyInput } from "@/lib/job-application";
import { CV_EXTENSIONS, MAX_CV_BYTES, fieldErrors, fileExtension, formMessage, serverErrorKey } from "@/lib/form-validation";
import { uploadPublicFile } from "@/lib/public-upload";
import { FieldError, invalidProps } from "@/components/site/field-error";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function ApplyDialog({
  jobId,
  jobTitle,
  size = "sm",
  className,
  label,
}: {
  jobId: string;
  jobTitle: string;
  size?: "sm" | "lg" | "default";
  className?: string;
  label?: string;
}) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const lang = i18n.resolvedLanguage ?? i18n.language;

  const checkFile = (file: File | null) => {
    if (!file || file.size === 0) return undefined;
    if (!(CV_EXTENSIONS as readonly string[]).includes(fileExtension(file.name))) return "cvType";
    if (file.size > MAX_CV_BYTES) return "cvTooLarge";
    return undefined;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("cv") as File | null;
    const payload = {
      job_id: jobId,
      full_name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      linkedin_url: String(fd.get("linkedin") ?? ""),
      cover_letter: String(fd.get("cover") ?? ""),
      cv_path: null as string | null,
    };
    const parsed = ApplyInput.safeParse(payload);
    const next = parsed.success ? {} : fieldErrors(parsed.error);
    const fileError = checkFile(file);
    if (fileError) next.cv = fileError;
    setErrors(next);
    if (Object.keys(next).length) return toast.error(formMessage(lang, "fixFields"));
    setBusy(true);
    try {
      if (file && file.size > 0) {
        payload.cv_path = await uploadPublicFile("cvs", `${jobId}/${crypto.randomUUID()}.${fileExtension(file.name)}`, file);
      }
      const res = await submitJobApplication({ data: payload });
      form.reset();
      setRef(res.reference);
      toast.success(t("common.thanks"));
    } catch (error) {
      console.error("[careers] submission failed", error);
      const key = serverErrorKey(error);
      if (key === "uploadFailed") setErrors({ cv: key });
      toast.error(formMessage(lang, key));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={size}
          className={`bg-accent text-accent-foreground hover:bg-accent/90 ${className ?? ""}`}
        >
          {label ?? t("careers.apply")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{jobTitle}</DialogTitle>
        </DialogHeader>
        {ref ? (
          <div className="p-2 text-center">
            <p className="text-sm">{t("common.thanks")}</p>
            <p className="mt-1 text-sm">
              {t("common.referenceSaved")} <span className="font-mono">{ref}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("careers.hrNote")}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t("careers.formIntro")}</p>
            <F label={t("careers.position")}>
              <Input
                name="position"
                value={jobTitle}
                readOnly
                aria-readonly="true"
                className="bg-muted/60 font-medium text-foreground"
              />
            </F>
            <F label={t("common.fullName")}>
              <Input id="apply-name" name="name" required maxLength={200} {...invalidProps("apply-name", errors.full_name)} /><FieldError id="apply-name" code={errors.full_name} />
            </F>
            <F label={t("common.email")}>
              <Input id="apply-email" type="email" name="email" required maxLength={255} {...invalidProps("apply-email", errors.email)} /><FieldError id="apply-email" code={errors.email} />
            </F>
            <F label={t("common.phone")}>
              <Input id="apply-phone" name="phone" type="tel" inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" required {...invalidProps("apply-phone", errors.phone)} /><FieldError id="apply-phone" code={errors.phone} />
            </F>
            <F label="LinkedIn URL">
              <Input id="apply-linkedin" name="linkedin" type="text" inputMode="url" dir="ltr" placeholder="https://www.linkedin.com/in/…" maxLength={2048} {...invalidProps("apply-linkedin", errors.linkedin_url)} /><FieldError id="apply-linkedin" code={errors.linkedin_url} />
            </F>
            <F label={t("careers.cv")}>
              <div className="flex items-center gap-2 rounded-md border border-dashed p-2">
                <UploadCloud className="h-4 w-4 text-muted-foreground" />
                <Input id="apply-cv" type="file" name="cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="border-0 p-0 shadow-none" aria-invalid={errors.cv ? true : undefined} aria-describedby={errors.cv ? "apply-cv-error" : undefined} onChange={(e) => setErrors((prev) => ({ ...prev, cv: checkFile(e.currentTarget.files?.[0] ?? null) ?? "" }))} />
              </div>
              <FieldError id="apply-cv" code={errors.cv || undefined} />
            </F>
            <F label={t("careers.coverLetter")}>
              <Textarea id="apply-cover" rows={4} name="cover" maxLength={10000} {...invalidProps("apply-cover", errors.cover_letter)} /><FieldError id="apply-cover" code={errors.cover_letter} />
            </F>
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {busy ? t("common.submitting") : t("common.submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
