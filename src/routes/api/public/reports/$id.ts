import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { reportMediaPath } from "@/lib/investor-content";

export const Route = createFileRoute("/api/public/reports/$id")({
  server: { handlers: { GET: async ({ params, request }) => {
    if (!z.string().uuid().safeParse(params.id).success) return new Response("Not found", { status: 404 });
    const { investorPublicClient } = await import("@/lib/investor-public.server");
    const client = investorPublicClient();
    const { data: report } = await client.from("financial_reports").select("file_url,report_year").eq("id", params.id).eq("is_published", true).maybeSingle();
    const path = report ? reportMediaPath(report.file_url) : null;
    if (!report || !path) return new Response("Not found", { status: 404 });
    const { data: file, error } = await client.storage.from("cms").download(path);
    if (error || !file) return new Response("Not found", { status: 404 });
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(file, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="gostation-report-${report.report_year}.pdf"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } } },
});