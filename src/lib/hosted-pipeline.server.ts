import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import { publicSupabaseEnv } from "./public-supabase-env";
import { HOSTED_PIPELINE_URL, isHostedRuntime, type PipelineRequest } from "./hosted-pipeline";

/** Only Lovable-hosted execution performs privileged writes and delivery. */
export function shouldForwardPipeline() {
  return !isHostedRuntime(new URL(getRequest().url).hostname) || !process.env["SUPABASE_SERVICE_ROLE_KEY"];
}

export async function forwardPipeline<T>(input: PipelineRequest): Promise<T> {
  const { url, key } = publicSupabaseEnv();
  if (!url || !key) throw new Error("submission_unavailable");
  // A standard publishable client keeps this boundary independent of admin secrets.
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const authorization = getRequest().headers.get("authorization");
  const response = await client.functions.invoke<T>("submissions", {
    body: input,
    headers: { apikey: key, ...(authorization ? { Authorization: authorization } : {}) },
    // The SDK's fetch is redirected to the app's hosted endpoint below.
  });
  if (response.error) throw new Error("hosted_pipeline_failed");
  if (!response.data) throw new Error("hosted_pipeline_empty_response");
  return response.data;
}