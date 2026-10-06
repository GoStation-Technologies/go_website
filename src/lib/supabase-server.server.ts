// Self-hosting friendly Supabase access for server code.
// - Uses the service-role (admin) client when SUPABASE_SERVICE_ROLE_KEY is set.
// - Otherwise logs a warning once and falls back to a public client built from
//   SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY (RLS applies, public reads only).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let warned = false;
let publicClient: SupabaseClient<Database> | null = null;

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createPublicServerClient(): SupabaseClient<Database> | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[supabase] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set — database features disabled.");
    return null;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Admin client if available, else null (with a one-time warning). */
export async function getAdminClientOrNull(): Promise<SupabaseClient<Database> | null> {
  if (!hasServiceRoleKey()) {
    if (!warned) {
      warned = true;
      console.warn(
        "[supabase] SUPABASE_SERVICE_ROLE_KEY not set — admin-only features are disabled; falling back to the public client where possible.",
      );
    }
    return null;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient<Database>;
}

/** Admin client when available, otherwise the public (RLS) client. */
export async function getServerSupabase(): Promise<{
  client: SupabaseClient<Database> | null;
  isAdmin: boolean;
}> {
  const admin = await getAdminClientOrNull();
  if (admin) return { client: admin, isAdmin: true };
  publicClient ??= createPublicServerClient();
  return { client: publicClient, isAdmin: false };
}
