import { createFileRoute } from "@tanstack/react-router";
import { publicSupabaseEnv } from "@/lib/public-supabase-env";

/**
 * Permanent public address for files uploaded from the dashboard.
 * The storage bucket stays private; this route reads the file with the
 * publishable key (the bucket's read policy allows it) and serves it with
 * long cache headers. Range requests are forwarded so videos can seek.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..") || !/^[\w\-./]+$/.test(path)) {
          return new Response("Not found", { status: 404 });
        }
        const { url: base, key } = publicSupabaseEnv();
        if (!base || !key) return new Response("Storage not configured", { status: 503 });

        const headers: Record<string, string> = { apikey: key };
        if (!key.startsWith("sb_")) headers["Authorization"] = `Bearer ${key}`;
        const range = request.headers.get("range");
        if (range) headers["Range"] = range;

        const upstream = await fetch(`${base}/storage/v1/object/authenticated/cms/${path}`, { headers });
        if (!upstream.ok && upstream.status !== 206) {
          return new Response("Not found", { status: upstream.status === 400 ? 404 : upstream.status });
        }
        const out = new Headers();
        for (const h of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
          const v = upstream.headers.get(h);
          if (v) out.set(h, v);
        }
        out.set("Cache-Control", "public, max-age=31536000, immutable");
        return new Response(upstream.body, { status: upstream.status, headers: out });
      },
    },
  },
});
