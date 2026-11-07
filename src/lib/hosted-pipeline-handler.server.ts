import { createClient } from "@supabase/supabase-js";
import { PipelineInput } from "./hosted-pipeline";
import { publicSupabaseEnv } from "./public-supabase-env";

/** Public writes accept only schema-validated forms; tests require verified super-admin identity. */
export async function handlePipeline(request: Request): Promise<Response> {
  const { url, key } = publicSupabaseEnv();
  if (!key || request.headers.get("apikey") !== key) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = PipelineInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 });
  const input = parsed.data;
  try {
    if (input.operation === "test") {
      const authorization = request.headers.get("authorization");
      if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "unauthorized" }, { status: 401 });
      const token = authorization.slice(7);
      const caller = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: authorization } },
      });
      const { data, error } = await caller.auth.getUser(token);
      if (error || !data.user) return Response.json({ error: "unauthorized" }, { status: 401 });
      const role = await caller.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "super_admin").maybeSingle();
      if (role.error || !role.data) return Response.json({ error: "forbidden" }, { status: 403 });
      const { notifySubmission } = await import("./notify.server");
      return Response.json(await notifySubmission({
        category: input.payload.category, title: `Test notification (${input.payload.category})`,
        reference: `TEST-${crypto.randomUUID()}`, fields: { note: "This is a test notification triggered from the admin panel." },
        client: caller, test: true,
      }));
    }
    // Reuse server functions, including the exact same validations and storage-path checks.
    const submissions = await import("./submissions.functions");
    let result: { reference: string };
    switch (input.operation) {
      case "contact": result = await submissions.submitContactMessage({ data: input.payload }); break;
      case "franchise": result = await submissions.submitFranchiseApplication({ data: input.payload }); break;
      case "acquisition": result = await submissions.submitAcquisitionRequest({ data: input.payload }); break;
      case "investor": result = await submissions.submitIrInquiry({ data: input.payload }); break;
      case "leasing": result = await submissions.submitLeasingRequest({ data: input.payload }); break;
      case "careers": {
        const { submitJobApplication } = await import("./careers.functions");
        result = await submitJobApplication({ data: input.payload }); break;
      }
    }
    return Response.json(result);
  } catch (error) {
    // Never return submitted fields or provider diagnostics on a public endpoint.
    const code = error instanceof Error ? error.message : "submission_failed";
    const safe = ["invalid_job", "invalid_cv", "submission_failed", "submission_unavailable"].includes(code) ? code : "submission_failed";
    console.error("[hosted-pipeline] failed", { operation: input.operation, code: safe });
    return Response.json({ error: safe }, { status: 503 });
  }
}