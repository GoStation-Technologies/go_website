import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LogInput = z.object({ reportId: z.string().uuid() });

/**
 * Records a report download. Validates server-side that the report exists and
 * is published before writing, so download analytics cannot be forged with
 * arbitrary report ids.
 */
export const logReportDownload = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => LogInput.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: report } = await supabaseAdmin
      .from("financial_reports")
      .select("id")
      .eq("id", data.reportId)
      .eq("is_published", true)
      .maybeSingle();

    if (!report) return { logged: false as const };

    await supabaseAdmin.from("report_downloads").insert({ report_id: report.id });
    return { logged: true as const };
  });
