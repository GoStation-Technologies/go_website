import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitJobApplication } from "@/lib/careers.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

const MAX_CV_BYTES = 4 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

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
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("cv") as File | null;
    if (file && file.size > MAX_CV_BYTES) return toast.error(t("careers.cvTooLarge"));
    setBusy(true);
    try {
      const cv =
        file && file.size > 0
          ? { name: file.name, type: file.type || "application/pdf", data: await fileToBase64(file) }
          : null;
      const res = await submitJobApplication({
        data: {
          job_id: jobId,
          full_name: String(fd.get("name")),
          email: String(fd.get("email")),
          phone: String(fd.get("phone")),
          linkedin_url: String(fd.get("linkedin") ?? ""),
          cover_letter: String(fd.get("cover") ?? ""),
          cv,
        },
      });
      setRef(res.reference);
      toast.success(t("common.thanks"));
    } catch {
      toast.error(t("common.error"));
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
              <Input name="name" required />
            </F>
            <F label={t("common.email")}>
              <Input type="email" name="email" required />
            </F>
            <F label={t("common.phone")}>
              <Input name="phone" required />
            </F>
            <F label="LinkedIn URL">
              <Input name="linkedin" />
            </F>
            <F label={t("careers.cv")}>
              <div className="flex items-center gap-2 rounded-md border border-dashed p-2">
                <UploadCloud className="h-4 w-4 text-muted-foreground" />
                <Input type="file" name="cv" accept=".pdf,.doc,.docx" className="border-0 p-0 shadow-none" />
              </div>
            </F>
            <F label={t("careers.coverLetter")}>
              <Textarea rows={4} name="cover" />
            </F>
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? t("common.submitting") : t("common.submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
