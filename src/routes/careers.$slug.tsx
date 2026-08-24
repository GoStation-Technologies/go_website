import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getContentLanguage } from "@/lib/i18n";
import { SiteLayout } from "@/components/site/site-layout";
import { ApplyDialog } from "@/components/site/apply-dialog";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  ExternalLink,
  ListChecks,
  MapPin,
  ClipboardList,
} from "lucide-react";
import stationCanopy from "@/assets/station-canopy.jpg.asset.json";

export const Route = createFileRoute("/careers/$slug")({
  component: JobDetailPage,
  head: ({ params }) =>
    pageHead({
      path: `/careers/${params.slug}`,
      title: "Job details — Careers at GoStation",
      description:
        "Full role description, responsibilities, requirements and application deadline for this GoStation opening.",
    }),
});

function useDateFmt() {
  const { i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const fmt = new Intl.DateTimeFormat(lng === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (v?: string | null) => (v ? fmt.format(new Date(v)) : null);
}

function Bullets({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length <= 1) return <p className="leading-relaxed text-muted-foreground">{text}</p>;
  return (
    <ul className="grid gap-2">
      {lines.map((l, i) => (
        <li key={i} className="flex items-start gap-2 text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span className="leading-relaxed">{l}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-primary">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        {title}
      </h2>
      <Bullets text={body} />
    </section>
  );
}

function JobDetailPage() {
  const { slug } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lng = getContentLanguage(i18n.resolvedLanguage ?? i18n.language);
  const fmtDate = useDateFmt();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", slug],
    queryFn: async () => {
      const { data } = await supabase.from("job_openings").select("*").eq("slug", slug).maybeSingle();
      return data ?? null;
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-24">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      </SiteLayout>
    );
  }

  if (!job) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-extrabold text-primary">{t("careers.detail.notFound")}</h1>
          <Link to="/careers" className="mt-6 inline-block">
            <Button variant="outline">{t("careers.detail.back")}</Button>
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const closed = job.closing_date ? String(job.closing_date) < today : false;
  const title = (lng === "ar" ? job.title_ar : job.title_en) || job.title_en;
  const department = (lng === "ar" ? job.department_ar : job.department_en) || job.department;
  const city = (lng === "ar" ? job.city_ar : job.city_en) || job.city;
  const description = (lng === "ar" ? job.description_ar : job.description_en) || "";
  const responsibilities = (lng === "ar" ? job.responsibilities_ar : job.responsibilities_en) || "";
  const requirements = (lng === "ar" ? job.requirements_ar : job.requirements_en) || "";
  const applyUrl = job.apply_url;

  const ApplyButton = applyUrl ? (
    <a href={applyUrl} target="_blank" rel="noopener noreferrer">
      <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
        {t("careers.detail.applyExternal")}
        <ExternalLink className="ms-2 h-4 w-4" />
      </Button>
    </a>
  ) : (
    <ApplyDialog jobId={job.id} jobTitle={title} size="lg" label={t("careers.apply")} />
  );

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden bg-primary py-14 text-primary-foreground">
        <img
          src={stationCanopy.url}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.14]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/90 to-primary" />
        <div className="relative mx-auto max-w-5xl px-4">
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("careers.detail.back")}
          </Link>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <Chip icon={<Building2 className="h-4 w-4" />}>{department}</Chip>
            <Chip icon={<MapPin className="h-4 w-4" />}>{city}</Chip>
            <Chip icon={<Briefcase className="h-4 w-4" />}>
              {t(`admin.careers.types.${job.employment_type}`, { defaultValue: job.employment_type })}
            </Chip>
            <Chip icon={<CalendarClock className="h-4 w-4" />}>
              {t("careers.cols.deadline")}:{" "}
              {job.closing_date ? fmtDate(job.closing_date) : t("careers.openUntilFurther")}
            </Chip>
          </div>
          <div className="mt-8">
            {closed ? (
              <span className="inline-flex rounded-lg border border-primary-foreground/25 px-4 py-2 text-sm">
                {t("careers.closed")}
              </span>
            ) : (
              ApplyButton
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12">
        {description && (
          <Section icon={<ClipboardList className="h-4 w-4" />} title={t("careers.detail.overview")} body={description} />
        )}
        {responsibilities && (
          <Section
            icon={<ListChecks className="h-4 w-4" />}
            title={t("careers.detail.responsibilities")}
            body={responsibilities}
          />
        )}
        {requirements && (
          <Section icon={<ListChecks className="h-4 w-4" />} title={t("careers.detail.requirements")} body={requirements} />
        )}

        <div className="rounded-2xl border bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("careers.cols.deadline")}:{" "}
            <span className="font-semibold text-foreground">
              {job.closing_date ? fmtDate(job.closing_date) : t("careers.openUntilFurther")}
            </span>
          </p>
          <div className="mt-4 flex justify-center">{closed ? null : ApplyButton}</div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 backdrop-blur">
      {icon}
      {children}
    </span>
  );
}
