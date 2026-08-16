import { createFileRoute } from "@tanstack/react-router";
import { submitJobApplication } from "@/lib/careers.functions";
import { pageHead } from "@/lib/seo";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Briefcase, MapPin, CalendarClock, Building2, UploadCloud } from "lucide-react";
import stationCanopy from "@/assets/station-canopy.jpg.asset.json";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
  head: () =>
    pageHead({
      path: "/careers",
      title: "Careers at GoStation — Jobs Across Saudi Arabia",
      description:
        "Browse every open role at GoStation with department, location, posting date and application deadline — and apply online with your CV.",
    }),
});

function useDateFmt() {
  const { i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const fmt = new Intl.DateTimeFormat(lng === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
  return (v?: string | null) => (v ? fmt.format(new Date(v)) : null);
}

function CareersPage() {
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const fmtDate = useDateFmt();
  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_openings")
        .select("*")
        .eq("is_active", true)
        .order("posted_at", { ascending: false });
      return data ?? [];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const cityCount = new Set(jobs.map((j) => j.city)).size;
  const deptCount = new Set(jobs.map((j) => j.department)).size;

  return (
    <SiteLayout>
      {/* Header banner */}
      <section className="relative isolate overflow-hidden bg-primary py-20 text-primary-foreground">
        <img
          src={stationCanopy.url}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_20%_0%,color-mix(in_oklab,var(--color-accent)_35%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/90 to-primary" />

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
            <Briefcase className="h-3.5 w-3.5" />
            {t("careers.eyebrow")}
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            {t("careers.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
            {t("careers.lead")}
          </p>

          <div className="mt-9 grid gap-3 sm:max-w-2xl sm:grid-cols-3">
            <BannerStat icon={<Briefcase className="h-4 w-4" />} value={String(jobs.length)} label={t("careers.openings")} />
            <BannerStat icon={<MapPin className="h-4 w-4" />} value={String(cityCount)} label={t("careers.cols.location")} />
            <BannerStat icon={<Building2 className="h-4 w-4" />} value={String(deptCount)} label={t("careers.cols.department")} />
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-sm text-primary-foreground/75">
            <UploadCloud className="h-4 w-4" />
            {t("careers.hrNote")}
          </p>
        </div>
      </section>

      {/* Listing */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {jobs.length === 0 ? (
          <p className="rounded-xl border bg-card p-10 text-center text-muted-foreground">{t("careers.noOpenings")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/70 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start">{t("careers.cols.posted")}</th>
                  <th className="px-4 py-3 text-start">{t("careers.cols.department")}</th>
                  <th className="px-4 py-3 text-start">{t("careers.cols.title")}</th>
                  <th className="px-4 py-3 text-start">{t("careers.cols.location")}</th>
                  <th className="px-4 py-3 text-start">{t("careers.cols.deadline")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const closed = j.closing_date ? String(j.closing_date) < today : false;
                  return (
                    <tr key={j.id} className="border-t transition-colors hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{fmtDate(j.posted_at)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                            <Building2 className="h-4 w-4" />
                          </span>
                          {(lng === "ar" ? j.department_ar : j.department_en) || j.department}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-primary">{lng === "ar" ? j.title_ar : j.title_en}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {(lng === "ar" ? j.city_ar : j.city_en) || j.city}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {j.closing_date ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                              closed
                                ? "border-muted-foreground/30 text-muted-foreground"
                                : "border-destructive/40 text-destructive"
                            }`}
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            {fmtDate(j.closing_date)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("careers.openUntilFurther")}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-end">
                        {closed ? (
                          <span className="text-xs text-muted-foreground">{t("careers.closed")}</span>
                        ) : (
                          <ApplyDialog jobId={j.id} jobTitle={lng === "ar" ? j.title_ar : j.title_en} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          {t("careers.apply")}
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
            <F label={t("common.fullName")}><Input name="name" required /></F>
            <F label={t("common.email")}><Input type="email" name="email" required /></F>
            <F label={t("common.phone")}><Input name="phone" required /></F>
            <F label="LinkedIn URL"><Input name="linkedin" /></F>
            <F label={t("careers.cv")}>
              <div className="flex items-center gap-2 rounded-md border border-dashed p-2">
                <UploadCloud className="h-4 w-4 text-muted-foreground" />
                <Input type="file" name="cv" accept=".pdf,.doc,.docx" className="border-0 p-0 shadow-none" />
              </div>
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
function BannerStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:bg-primary-foreground/15">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/20 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
        {icon}
      </span>
      <span>
        <span className="block text-xl font-extrabold leading-none">{value}</span>
        <span className="block text-xs text-primary-foreground/70">{label}</span>
      </span>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}
