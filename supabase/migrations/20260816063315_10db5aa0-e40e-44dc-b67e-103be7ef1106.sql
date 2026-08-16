DROP POLICY IF EXISTS "jobs public read" ON public.job_openings;

CREATE POLICY "jobs anon read active" ON public.job_openings
FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY "jobs auth read" ON public.job_openings
FOR SELECT TO authenticated
USING (is_active = true OR private.has_role(auth.uid(), 'hr'::app_role) OR private.has_role(auth.uid(), 'super_admin'::app_role));

GRANT SELECT ON public.job_openings TO anon;
GRANT SELECT ON public.job_openings TO authenticated;