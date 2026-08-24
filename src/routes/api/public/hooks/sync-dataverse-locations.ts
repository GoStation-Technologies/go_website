import { createFileRoute } from "@tanstack/react-router";

/**
 * Public (apikey-protected) hook that syncs GoStation locations from Dataverse
 * into `regions` + `stations`. Triggered nightly by pg_cron at 00:00 KSA
 * (21:00 UTC) and can be poked manually.
 */
async function handle(request: Request) {
  const apikey = request.headers.get("apikey");
  const anon = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!apikey || !anon || apikey !== anon) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { syncDataverseLocations } = await import("@/lib/dataverse-sync.server");
    const result = await syncDataverseLocations();
    return Response.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    console.error("[sync-dataverse-locations]", err);
    return Response.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/sync-dataverse-locations")({
  server: {
    handlers: {
      POST: ({ request }) => handle(request),
      GET: ({ request }) => handle(request),
    },
  },
});
