import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated } from "../supabase";

const TABLES = {
  franchise: "franchise_applications",
  acquisition: "acquisition_requests",
  contact: "contact_messages",
} as const;

export default defineTool({
  name: "update_submission_status",
  title: "Update submission status",
  description:
    "Change the workflow status of one franchise, acquisition, or contact submission. Requires staff access.",
  inputSchema: {
    type: z.enum(["franchise", "acquisition", "contact"]).describe("Which submission inbox."),
    id: z.string().describe("Submission UUID."),
    status: z.string().describe("New workflow status, e.g. new, reviewing, approved, closed."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ type, id, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from(TABLES[type])
      .update({ status })
      .eq("id", id)
      .select("id,reference,status");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) {
      return {
        content: [{ type: "text", text: "No submission updated — check the id and your access." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data[0]) }],
      structuredContent: { submission: data[0] },
    };
  },
});
