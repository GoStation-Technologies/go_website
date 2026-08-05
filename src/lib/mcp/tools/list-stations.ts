import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated } from "../supabase";

export default defineTool({
  name: "list_stations",
  title: "List stations",
  description: "List GoStation fuel stations, optionally filtered by city or name.",
  inputSchema: {
    query: z.string().optional().describe("Free text matched against station and city names."),
    limit: z.number().int().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("stations")
      .select("id,name_en,name_ar,city_en,city_ar,district_en,is_24h,fuel_types,services,is_active,lat,lng")
      .order("city_en", { ascending: true })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (query?.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(
        `name_en.ilike.${term},name_ar.ilike.${term},city_en.ilike.${term},city_ar.ilike.${term}`,
      );
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { stations: data ?? [] },
    };
  },
});
