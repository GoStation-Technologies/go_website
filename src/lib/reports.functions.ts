import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ReportInput } from "@/lib/investor-content";

const LogInput = z.object({ reportId: z.string().uuid() });

export const getInvestorContent = createServerFn({ method: "GET" }).handler(async () => {
  const { investorPublicClient } = await import("@/lib/investor-public.server");
  const client = investorPublicClient();
  const [sections, reports] = await Promise.all([
    client.from("page_sections").select("*").eq("page_slug", "investors").eq("is_visible", true).order("sort_order"),
    client.from("financial_reports").select("id,title_ar,title_en,report_type,report_year,published_at,file_url").eq("is_published", true).order("report_year", { ascending: false }).order("published_at", { ascending: false }),
  ]);
  if (sections.error || reports.error) throw new Error("Investor content unavailable");
  return { sections: sections.data ?? [], reports: reports.data ?? [] };
});

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("financial_reports").select("*").order("report_year", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

export const adminSaveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("financial_reports").upsert(data).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

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
