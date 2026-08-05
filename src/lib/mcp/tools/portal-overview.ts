import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, notAuthenticated } from "../supabase";

const SOURCES = [
  { key: "stations", table: "stations" },
  { key: "news_articles", table: "news_articles" },
  { key: "job_openings", table: "job_openings" },
  { key: "job_applications", table: "job_applications" },
  { key: "franchise_applications", table: "franchise_applications" },
  { key: "acquisition_requests", table: "acquisition_requests" },
  { key: "contact_messages", table: "contact_messages" },
] as const;

export default defineTool({
  name: "portal_overview",
  title: "Portal overview",
  description:
    "Row counts across stations, news, careers, and submission inboxes, scoped to what the caller may read.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const counts: Record<string, number | null> = {};
    for (const source of SOURCES) {
      const { count, error } = await supabase
        .from(source.table)
        .select("id", { count: "exact", head: true });
      counts[source.key] = error ? null : (count ?? 0);
    }
    return {
      content: [{ type: "text", text: JSON.stringify(counts) }],
      structuredContent: { counts },
    };
  },
});
