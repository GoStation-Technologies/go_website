DROP POLICY IF EXISTS "tickets public submit" ON public.support_tickets;
REVOKE ALL ON public.support_tickets FROM anon;
COMMENT ON TABLE public.support_tickets IS 'Support handovers are submitted by the validated server endpoint; transcripts are read and updated only by support staff or super admins under RLS.';