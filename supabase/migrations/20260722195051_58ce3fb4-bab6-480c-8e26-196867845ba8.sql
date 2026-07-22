
DROP POLICY IF EXISTS "Service role manages abuse_events" ON public.abuse_events;

DROP POLICY IF EXISTS "job apps public submit" ON public.job_applications;
CREATE POLICY "job apps public submit" ON public.job_applications
  FOR INSERT WITH CHECK (
    status = 'new' AND job_id IS NOT NULL
    AND length(trim(full_name)) > 0 AND length(trim(email)) > 0
  );

DROP POLICY IF EXISTS "franchise public submit" ON public.franchise_applications;
CREATE POLICY "franchise public submit" ON public.franchise_applications
  FOR INSERT WITH CHECK (
    status = 'new'
    AND length(trim(full_name)) > 0 AND length(trim(email)) > 0
    AND length(trim(phone)) > 0
  );

DROP POLICY IF EXISTS "acq public submit" ON public.acquisition_requests;
CREATE POLICY "acq public submit" ON public.acquisition_requests
  FOR INSERT WITH CHECK (
    status = 'new'
    AND length(trim(full_name)) > 0 AND length(trim(email)) > 0
    AND length(trim(phone)) > 0
  );

DROP POLICY IF EXISTS "downloads public log" ON public.report_downloads;
CREATE POLICY "downloads public log" ON public.report_downloads
  FOR INSERT WITH CHECK (report_id IS NOT NULL);

DROP POLICY IF EXISTS "ir public submit" ON public.ir_inquiries;
CREATE POLICY "ir public submit" ON public.ir_inquiries
  FOR INSERT WITH CHECK (
    status = 'new'
    AND length(trim(full_name)) > 0 AND length(trim(email)) > 0
    AND length(trim(message)) > 0
  );

DROP POLICY IF EXISTS "contact public submit" ON public.contact_messages;
CREATE POLICY "contact public submit" ON public.contact_messages
  FOR INSERT WITH CHECK (
    status = 'new'
    AND length(trim(full_name)) > 0 AND length(trim(email)) > 0
    AND length(trim(subject)) > 0 AND length(trim(message)) > 0
  );

DROP POLICY IF EXISTS "tickets public submit" ON public.support_tickets;
CREATE POLICY "tickets public submit" ON public.support_tickets
  FOR INSERT WITH CHECK (
    status = 'new' AND length(trim(issue)) > 0
  );

DROP POLICY IF EXISTS "views public write" ON public.page_views;
CREATE POLICY "views public write" ON public.page_views
  FOR INSERT WITH CHECK (path IS NOT NULL AND length(path) > 0);
