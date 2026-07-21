import type { SupabaseClient } from "@supabase/supabase-js";

export type GroundingLang = "en" | "ar";

export type GroundingContext = {
  stations: Array<{ name: string; city: string; district?: string | null; is_24h: boolean; services: string[] }>;
  news: Array<{ title: string; slug: string; excerpt?: string | null; kind: string; published_at?: string | null }>;
  jobs: Array<{ title: string; slug: string; department?: string | null; city?: string | null; employment_type?: string | null }>;
};

// Very light stop-word list — keep short & focused; retrieval is ilike-based.
const STOP = new Set([
  "the","a","an","and","or","of","in","on","at","to","for","is","are","be","with","by","from","how","what","where","when","why","who","which","do","does","did","can","i","me","my","we","you","your","this","that",
  "في","من","إلى","على","عن","و","أو","هل","ما","ماذا","أين","متى","كيف","لماذا","الذي","التي","انا","أنا","نحن","انت","أنت","هذا","هذه","لدي",
]);

export function extractTerms(message: string): string[] {
  const cleaned = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  // Dedupe, cap length
  return Array.from(new Set(cleaned)).slice(0, 6);
}

function buildOr(fields: string[], terms: string[]): string | null {
  if (!terms.length) return null;
  const parts: string[] = [];
  for (const f of fields) {
    for (const t of terms) {
      // escape commas/parens in terms to be safe
      const safe = t.replace(/[,()]/g, " ");
      parts.push(`${f}.ilike.%${safe}%`);
    }
  }
  return parts.join(",");
}

export async function retrieveGrounding(
  supabase: SupabaseClient,
  message: string,
  lang: GroundingLang,
): Promise<GroundingContext> {
  const terms = extractTerms(message);
  const ctx: GroundingContext = { stations: [], news: [], jobs: [] };

  // Stations
  {
    const q = supabase
      .from("stations")
      .select("name_en,name_ar,city_en,city_ar,district_en,district_ar,is_24h,services")
      .eq("is_active", true)
      .limit(3);
    const or = buildOr(
      lang === "ar"
        ? ["name_ar", "city_ar", "district_ar"]
        : ["name_en", "city_en", "district_en"],
      terms,
    );
    const { data } = or ? await q.or(or) : await q.limit(3);
    for (const s of data ?? []) {
      ctx.stations.push({
        name: (lang === "ar" ? s.name_ar : s.name_en) ?? s.name_en,
        city: (lang === "ar" ? s.city_ar : s.city_en) ?? s.city_en,
        district: lang === "ar" ? s.district_ar : s.district_en,
        is_24h: !!s.is_24h,
        services: Array.isArray(s.services) ? s.services : [],
      });
    }
  }

  // News (published only)
  {
    const q = supabase
      .from("news_articles")
      .select("slug,kind,title_en,title_ar,excerpt_en,excerpt_ar,published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3);
    const or = buildOr(
      lang === "ar"
        ? ["title_ar", "excerpt_ar"]
        : ["title_en", "excerpt_en"],
      terms,
    );
    const { data } = or ? await q.or(or) : await q;
    for (const n of data ?? []) {
      ctx.news.push({
        title: (lang === "ar" ? n.title_ar : n.title_en) ?? n.title_en,
        slug: n.slug,
        excerpt: lang === "ar" ? n.excerpt_ar : n.excerpt_en,
        kind: n.kind,
        published_at: n.published_at,
      });
    }
  }

  // Jobs (active only)
  {
    const q = supabase
      .from("job_openings")
      .select("slug,title_en,title_ar,department,city,employment_type")
      .eq("is_active", true)
      .order("posted_at", { ascending: false })
      .limit(3);
    const or = buildOr(
      lang === "ar"
        ? ["title_ar", "department", "city"]
        : ["title_en", "department", "city"],
      terms,
    );
    const { data } = or ? await q.or(or) : await q;
    for (const j of data ?? []) {
      ctx.jobs.push({
        title: (lang === "ar" ? j.title_ar : j.title_en) ?? j.title_en,
        slug: j.slug,
        department: j.department,
        city: j.city,
        employment_type: j.employment_type,
      });
    }
  }

  return ctx;
}

export function formatGrounding(ctx: GroundingContext, lang: GroundingLang): string {
  const empty = ctx.stations.length + ctx.news.length + ctx.jobs.length === 0;
  if (empty) return "";

  const L = lang === "ar"
    ? { header: "معلومات من قاعدة بيانات قوستيشن (استخدمها فقط، لا تخترع غيرها):", stations: "المحطات", news: "الأخبار/الفعاليات", jobs: "الوظائف المتاحة", h24: "٢٤ ساعة", none: "لا يوجد" }
    : { header: "GoStation database context (use only this data — do not invent):", stations: "Stations", news: "News/Events", jobs: "Open jobs", h24: "24h", none: "none" };

  const lines: string[] = [L.header];

  if (ctx.stations.length) {
    lines.push(`\n${L.stations}:`);
    for (const s of ctx.stations) {
      const bits = [s.name, s.city, s.district].filter(Boolean).join(" — ");
      const svc = s.services.length ? ` [${s.services.join(", ")}]` : "";
      lines.push(`- ${bits}${s.is_24h ? ` (${L.h24})` : ""}${svc}`);
    }
  }
  if (ctx.news.length) {
    lines.push(`\n${L.news}:`);
    for (const n of ctx.news) {
      const ex = n.excerpt ? ` — ${n.excerpt.slice(0, 140)}` : "";
      lines.push(`- ${n.title} (/media/${n.slug})${ex}`);
    }
  }
  if (ctx.jobs.length) {
    lines.push(`\n${L.jobs}:`);
    for (const j of ctx.jobs) {
      const meta = [j.department, j.city, j.employment_type].filter(Boolean).join(", ");
      lines.push(`- ${j.title} (/careers/${j.slug})${meta ? ` — ${meta}` : ""}`);
    }
  }

  return lines.join("\n");
}
