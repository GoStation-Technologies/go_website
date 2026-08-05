import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated } from "../supabase";

export default defineTool({
  name: "list_news",
  title: "List news and events",
  description: "List GoStation news articles and events (bilingual titles and excerpts).",
  inputSchema: {
    kind: z.enum(["news", "event"]).optional().describe("Filter by content kind."),
    published_only: z.boolean().optional().describe("Only published items (default true)."),
    limit: z.number().int().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, published_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("news_articles")
      .select("id,slug,kind,title_en,title_ar,excerpt_en,excerpt_ar,is_published,published_at,event_date")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (kind) q = q.eq("kind", kind);
    if (published_only !== false) q = q.eq("is_published", true);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
