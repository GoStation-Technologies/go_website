import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeAudit } from "./audit";

export const APPLICATION_STAGES = [
  "new",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;
export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

import { ApplyInput } from "./job-application";
export { ApplyInput };

/** Public job application submission; the CV is already in private storage. */
export const submitJobApplication = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ApplyInput.parse(raw))
  .handler(async ({ data }) => {
    const { getServerSupabase } = await import("./supabase-server.server");
    const { client } = await getServerSupabase();
    if (!client) throw new Error("submission_unavailable");
    if (data.cv_path && !data.cv_path.startsWith(`${data.job_id}/`)) throw new Error("invalid_cv");
    const cvPath = data.cv_path;

    const { data: reference, error } = await (client.rpc as any)("submit_job_application", {
      payload: {
        job_id: data.job_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        linkedin_url: data.linkedin_url,
        cover_letter: data.cover_letter,
        cv_path: cvPath ?? "",
      },
    });
    if (error) {
      console.error("[careers] application insert failed", error);
      throw new Error(String(error.message).includes("invalid_job") ? "invalid_job" : "submission_failed");
    }
    const row = { reference: reference as string };

    try {
      const { notifySubmission } = await import("./notify.server");
      await notifySubmission({
        category: "careers",
        title: "New job application",
        reference: row.reference,
        fields: {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          linkedin_url: data.linkedin_url,
          cv_attached: cvPath ? "yes" : "no",
        },
      });
    } catch (e) {
      console.warn("[careers] notification skipped", e);
    }

    return { reference: row.reference as string };
  });

// ─── Admin: applications pipeline ───────────────────────────────────────

const ListInput = z.object({
  status: z.enum(APPLICATION_STAGES).optional(),
  jobId: z.string().uuid().optional(),
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type ApplicationRow = {
  id: string;
  reference: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string;
  linkedin_url: string | null;
  cover_letter: string | null;
  cv_path: string | null;
  rating: number | null;
  status: ApplicationStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job_title_en: string | null;
  job_title_ar: string | null;
};

export const adminListApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ListInput.parse(raw))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = (context.supabase.from("job_applications") as any)
      .select("*, job_openings(title_en,title_ar)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.status) q = q.eq("status", data.status);
    if (data.jobId) q = q.eq("job_id", data.jobId);
    if (data.q) q = q.or(`full_name.ilike.%${data.q}%,email.ilike.%${data.q}%,reference.ilike.%${data.q}%`);

    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);

    const mapped = ((rows ?? []) as any[]).map((r) => ({
      ...r,
      job_title_en: r.job_openings?.title_en ?? null,
      job_title_ar: r.job_openings?.title_ar ?? null,
    })) as ApplicationRow[];

    const total = count ?? 0;
    return {
      rows: mapped,
      total,
      page: data.page,
      pageSize: data.pageSize,
      pageCount: Math.max(1, Math.ceil(total / data.pageSize)),
    };
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(APPLICATION_STAGES).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const adminUpdateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UpdateInput.parse(raw))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.rating !== undefined) patch.rating = data.rating;
    if (data.notes !== undefined) patch.notes = data.notes || null;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await (context.supabase.from("job_applications") as any)
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await writeAudit(
      context.supabase as any,
      { id: context.userId, email: (context.claims as { email?: string } | undefined)?.email ?? null },
      {
        action: "update_status",
        entity: "job_applications" as any,
        entity_ids: [data.id],
        diff: patch as any,
      },
    );
    return { ok: true };
  });

/** Short-lived signed download link for a candidate CV (staff only). */
export const adminApplicationCvUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    // RLS on job_applications decides whether the caller may see this row.
    const { data: row, error } = await (context.supabase.from("job_applications") as any)
      .select("cv_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.cv_path) return { url: null as string | null };

    // Signed URL via the staff member's own session (the "cvs staff read"
    // storage policy allows authenticated reads); no service-role key needed.
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("cvs")
      .createSignedUrl(row.cv_path, 300);
    if (sErr) throw new Error(sErr.message);
    return { url: signed?.signedUrl ?? null };
  });

/** Stage-change timeline for one application. */
export const adminApplicationHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await (context.supabase.from("application_status_history") as any)
      .select("id, old_status, new_status, created_at")
      .eq("entity_type", "job_application")
      .eq("entity_id", data.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as Array<{ id: string; old_status: string | null; new_status: string; created_at: string }> };
  });
