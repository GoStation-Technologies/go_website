CREATE OR REPLACE FUNCTION public.submit_job_application(payload jsonb)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE ref text; jid uuid;
BEGIN
  BEGIN jid := (payload->>'job_id')::uuid; EXCEPTION WHEN others THEN RAISE EXCEPTION 'invalid_job'; END;
  IF NOT EXISTS (SELECT 1 FROM public.job_openings WHERE id = jid AND is_active) THEN
    RAISE EXCEPTION 'invalid_job';
  END IF;
  IF length(trim(coalesce(payload->>'full_name',''))) = 0
     OR length(trim(coalesce(payload->>'email',''))) = 0
     OR length(trim(coalesce(payload->>'phone',''))) = 0 THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;
  INSERT INTO public.job_applications (job_id, full_name, email, phone, linkedin_url, cover_letter, cv_path, status)
  VALUES (
    jid,
    left(trim(payload->>'full_name'), 200),
    left(trim(payload->>'email'), 255),
    left(trim(payload->>'phone'), 50),
    left(nullif(trim(coalesce(payload->>'linkedin_url','')), ''), 2048),
    left(nullif(trim(coalesce(payload->>'cover_letter','')), ''), 10000),
    left(nullif(trim(coalesce(payload->>'cv_path','')), ''), 300),
    'new'
  ) RETURNING reference INTO ref;
  RETURN ref;
END;
$function$;

DROP POLICY IF EXISTS "cvs public upload" ON storage.objects;
CREATE POLICY "cvs public upload" ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'cvs' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|doc|docx)$');

CREATE POLICY "Leasing documents public upload" ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'leasing-documents' AND name ~ '^requests/[0-9a-f-]{36}\.(pdf|png|jpg)$');