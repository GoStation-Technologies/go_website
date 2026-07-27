-- Careers pipeline: richer application stages + automatic status history

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS rating smallint;

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_status_check
  CHECK (status IN ('new','screening','interview','offer','hired','rejected'));

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_rating_check;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_rating_check
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

CREATE OR REPLACE FUNCTION public.tg_log_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_status_history (entity_type, entity_id, old_status, new_status, changed_by)
    VALUES ('job_application', NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_applications_status_history ON public.job_applications;
CREATE TRIGGER job_applications_status_history
AFTER UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.tg_log_application_status();

REVOKE EXECUTE ON FUNCTION public.tg_log_application_status() FROM anon, authenticated;
