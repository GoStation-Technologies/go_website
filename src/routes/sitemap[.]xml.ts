import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://org-story-weaver.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/stations", changefreq: "weekly", priority: "0.9" },
  { path: "/franchise", changefreq: "monthly", priority: "0.8" },
  { path: "/acquisitions", changefreq: "monthly", priority: "0.8" },
  { path: "/careers", changefreq: "daily", priority: "0.8" },
  { path: "/investors", changefreq: "weekly", priority: "0.7" },
  { path: "/media", changefreq: "daily", priority: "0.7" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await (supabaseAdmin.from("news_articles") as any)
            .select("slug,updated_at")
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(2000);
          for (const row of (data ?? []) as { slug: string; updated_at: string | null }[]) {
            entries.push({
              path: `/media/${row.slug}`,
              lastmod: row.updated_at ? new Date(row.updated_at).toISOString().slice(0, 10) : undefined,
              changefreq: "monthly",
              priority: "0.6",
            });
          }
        } catch (err) {
          console.error("[sitemap] failed to load news articles", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
