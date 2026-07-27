import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Briefcase, MapPin } from "lucide-react";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
  head: () =>
    pageHead({
      path: "/careers",
      title: "Careers at GoStation — Jobs Across Saudi Arabia",
      description:
        "Build your career with GoStation. Browse open roles in operations, retail, engineering and corporate functions across Saudi Arabia and apply online.",
    }),
});

function CareersPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data } = await supabase.from("job_openings").select("*").eq("is_active", true).order("posted_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <SiteLayout>
      <section className="bg-brand-radial py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">{t("careers.title")}</h1>
          <p className="mt-3 max-w-2xl text-white/80">{t("careers.intro")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-6 text-2xl font-bold">{t("careers.openings")}</h2>
        {jobs.length === 0 ? (
          <p className="text-muted-foreground">{t("careers.noOpenings")}</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <Card key={j.id}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{lng === "ar" ? j.title_ar : j.title_en}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{(lng === "ar" ? j.department_ar : j.department_en) || j.department}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{(lng === "ar" ? j.city_ar : j.city_en) || j.city}</span>

                      <Badge variant="outline">{j.employment_type}</Badge>
                    </div>
                  </div>
                  <ApplyDialog jobId={j.id} jobTitle={lng === "ar" ? j.title_ar : j.title_en} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

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

function ApplyDialog({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
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
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">{t("careers.apply")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{jobTitle}</DialogTitle></DialogHeader>
        {ref ? (
          <div className="p-2 text-center">
            <p className="text-sm">{t("common.thanks")}</p>
            <p className="mt-1 text-sm">{t("common.referenceSaved")} <span className="font-mono">{ref}</span></p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-3">
            <F label={t("common.fullName")}><Input name="name" required /></F>
            <F label={t("common.email")}><Input type="email" name="email" required /></F>
            <F label={t("common.phone")}><Input name="phone" required /></F>
            <F label="LinkedIn URL"><Input name="linkedin" /></F>
            <F label={t("careers.cv")}>
              <Input type="file" name="cv" accept=".pdf,.doc,.docx" />
            </F>
            <F label={t("careers.coverLetter")}><Textarea rows={4} name="cover" /></F>
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {busy ? t("common.submitting") : t("common.submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
