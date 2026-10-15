// Public (non-secret) backend address + publishable key for server code.
// Self-hosted servers often only define the VITE_* names, so fall back to
// those at runtime, then to the values baked in at build time.
export function publicSupabaseEnv(): { url: string; key: string } {
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
    "";
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ||
    "";
  return { url, key };
}
