import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated } from "../supabase";

export default defineTool({
  name: "list_job_openings",
  title: "List job openings",
  description: "List GoStation career openings, optionally filtered by department or city.",
  inputSchema: {
    department: z.string().optional().describe("Department filter (partial match)."),
    city: z.string().optional().describe("City filter (partial match)."),
    active_only: z.boolean().optional().describe("Only active postings (default true)."),
    limit: z.number().int().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ department, city, active_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("job_openings")
      .select("id,slug,title_en,title_ar,department,city,employment_type,is_active,posted_at")
      .order("posted_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (department?.trim()) q = q.ilike("department", `%${department.trim()}%`);
    if (city?.trim()) q = q.ilike("city", `%${city.trim()}%`);
    if (active_only !== false) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { jobs: data ?? [] },
    };
  },
});
