// Small server-side helper for writing admin audit-log rows.
// Callers pass their `requireSupabaseAuth` context so writes go through RLS
// (staff-only, self-authored). Failures are swallowed and logged: the audit
// log MUST never break the underlying admin action.
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "bulk_update"
  | "bulk_restore"
  | "update_status"
  | "upsert"
  | "delete"
  | "export_start";

export type AuditEntity =
  | "franchise_applications"
  | "acquisition_requests"
  | "contact_messages"
  | "stations"
  | "news_articles"
  | "job_openings"
  | "chatbot_messages"
  | "abuse_events";

export interface AuditEntry {
  action: AuditAction;
  entity: AuditEntity;
  entity_ids?: string[] | null;
  diff?: unknown;
  meta?: unknown;
}

export async function writeAudit(
  supabase: SupabaseClient,
  actor: { id: string; email?: string | null },
  entry: AuditEntry,
): Promise<void> {
  try {
    // Cast to any because the generated Database type is only regenerated
    // after the migration lands + types are refreshed.
    await (supabase.from("admin_audit_log") as any).insert({
      actor_id: actor.id,
      actor_email: actor.email ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_ids: entry.entity_ids ?? null,
      diff: entry.diff ?? null,
      meta: entry.meta ?? null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[audit] failed to record entry", err);
  }
}
