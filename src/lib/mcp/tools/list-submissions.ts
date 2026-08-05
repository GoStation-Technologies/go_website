import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated } from "../supabase";

const TABLES = {
  franchise: {
    table: "franchise_applications",
    columns:
      "id,reference,full_name,email,phone,city,proposed_city,investment_capital_sar,status,created_at",
  },
  acquisition: {
    table: "acquisition_requests",
    columns:
      "id,reference,full_name,email,phone,station_name,city,avg_daily_sales_sar,status,created_at",
  },
  contact: {
    table: "contact_messages",
    columns: "id,reference,full_name,email,phone,category,subject,message,status,created_at",
  },
} as const;

export default defineTool({
  name: "list_submissions",
  title: "List submissions",
  description:
    "List franchise applications, acquisition requests, or contact messages. Requires staff access.",
  inputSchema: {
    type: z.enum(["franchise", "acquisition", "contact"]).describe("Which submission inbox to read."),
    status: z.string().optional().describe("Filter by workflow status, e.g. new, reviewing, closed."),
    limit: z.number().int().optional().describe("Max rows to return (default 20, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const cfg = TABLES[type];
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from(cfg.table)
      .select(cfg.columns)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 20, 1), 100));
    if (status?.trim()) q = q.eq("status", status.trim());
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { type, submissions: data ?? [] },
    };
  },
});
