ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS session_id uuid;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS transcript jsonb NOT NULL DEFAULT '[]'::jsonb;
GRANT SELECT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
CREATE INDEX IF NOT EXISTS support_tickets_session_idx ON public.support_tickets(session_id);
COMMENT ON COLUMN public.support_tickets.transcript IS 'Visitor-supplied full conversation attached at customer-service handover; untrusted text, staff-only read.';