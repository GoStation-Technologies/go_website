-- Append-only audit trail of admin actions (who did what, when, to which rows).
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_ids uuid[],
  diff jsonb,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_entity_action_idx ON public.admin_audit_log (entity, action, created_at DESC);
CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log (actor_id, created_at DESC);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Staff (any admin role) may read the full log.
CREATE POLICY "Staff can read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Staff may write ONLY rows attributed to themselves (append-only).
-- No UPDATE / DELETE policies → the log is immutable for authenticated users.
CREATE POLICY "Staff can append self-authored audit rows"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.is_staff(auth.uid())
  );