import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/submissions")({
  server: { handlers: {
    POST: async ({ request }) => {
      // Never allow a standalone server to recurse back into the hosted dispatcher.
      if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) return Response.json({ error: "hosted_endpoint_unavailable" }, { status: 503 });
      const { handlePipeline } = await import("@/lib/hosted-pipeline-handler.server");
      return handlePipeline(request);
    },
  } },
});