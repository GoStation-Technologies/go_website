ALTER TABLE public.franchise_applications ALTER COLUMN national_id SET DEFAULT '';
COMMENT ON COLUMN public.franchise_applications.national_id IS 'DEPRECATED: no longer collected by the public franchise form';

CREATE OR REPLACE FUNCTION public.submit_franchise_application(payload jsonb)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE ref text;
BEGIN
  IF length(trim(coalesce(payload->>'full_name',''))) = 0
     OR length(trim(coalesce(payload->>'email',''))) = 0
     OR length(trim(coalesce(payload->>'phone',''))) = 0
     OR length(trim(coalesce(payload->>'city',''))) = 0 THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;
  INSERT INTO public.franchise_applications (
    full_name, national_id, phone, email, city,
    proposed_city, proposed_district, land_area_sqm, ownership_status,
    investment_capital_sar, notes, status
  ) VALUES (
    left(trim(payload->>'full_name'), 200), '',
    left(trim(payload->>'phone'), 50),
    left(trim(payload->>'email'), 255),
    left(trim(payload->>'city'), 120),
    left(nullif(trim(coalesce(payload->>'proposed_city','')), ''), 120),
    left(nullif(trim(coalesce(payload->>'proposed_district','')), ''), 120),
    CASE WHEN trim(coalesce(payload->>'land_area_sqm','')) ~ '^[0-9]+(\.[0-9]+)?$' THEN trim(payload->>'land_area_sqm')::numeric END,
    left(nullif(trim(coalesce(payload->>'ownership_status','')), ''), 60),
    CASE WHEN trim(coalesce(payload->>'investment_capital_sar','')) ~ '^[0-9]+(\.[0-9]+)?$' THEN trim(payload->>'investment_capital_sar')::numeric END,
    left(nullif(trim(coalesce(payload->>'notes','')), ''), 4000),
    'new'
  ) RETURNING reference INTO ref;
  RETURN ref;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_ir_inquiry(payload jsonb)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE ref text;
BEGIN
  IF length(trim(coalesce(payload->>'full_name',''))) = 0
     OR length(trim(coalesce(payload->>'email',''))) = 0
     OR length(trim(coalesce(payload->>'message',''))) = 0 THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;
  INSERT INTO public.ir_inquiries (full_name, email, phone, organization, inquiry_type, message, status)
  VALUES (
    left(trim(payload->>'full_name'), 200),
    left(trim(payload->>'email'), 255),
    left(nullif(trim(coalesce(payload->>'phone','')), ''), 50),
    left(nullif(trim(coalesce(payload->>'organization','')), ''), 200),
    left(coalesce(nullif(trim(coalesce(payload->>'inquiry_type','')), ''), 'general'), 40),
    left(trim(payload->>'message'), 4000),
    'new'
  ) RETURNING reference INTO ref;
  RETURN ref;
END;
$function$;

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
    left(nullif(trim(coalesce(payload->>'linkedin_url','')), ''), 500),
    left(nullif(trim(coalesce(payload->>'cover_letter','')), ''), 5000),
    left(nullif(trim(coalesce(payload->>'cv_path','')), ''), 300),
    'new'
  ) RETURNING reference INTO ref;
  RETURN ref;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.submit_contact_message(jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_acquisition_request(jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_franchise_application(jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_ir_inquiry(jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_job_application(jsonb) TO anon, authenticated, service_role;