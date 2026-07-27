GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_applications TO authenticated;
GRANT ALL ON public.franchise_applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acquisition_requests TO authenticated;
GRANT ALL ON public.acquisition_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

CREATE OR REPLACE FUNCTION public.submit_franchise_application(payload jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE ref text;
BEGIN
  IF length(trim(coalesce(payload->>'full_name',''))) = 0
     OR length(trim(coalesce(payload->>'email',''))) = 0
     OR length(trim(coalesce(payload->>'phone',''))) = 0
     OR length(trim(coalesce(payload->>'national_id',''))) = 0
     OR length(trim(coalesce(payload->>'city',''))) = 0 THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;

  INSERT INTO public.franchise_applications (
    full_name, national_id, phone, email, city, cr_number,
    proposed_city, proposed_district, land_area_sqm, ownership_status,
    investment_capital_sar, notes, status
  ) VALUES (
    left(trim(payload->>'full_name'), 200),
    left(trim(payload->>'national_id'), 50),
    left(trim(payload->>'phone'), 50),
    left(trim(payload->>'email'), 255),
    left(trim(payload->>'city'), 120),
    left(nullif(trim(coalesce(payload->>'cr_number','')), ''), 60),
    left(nullif(trim(coalesce(payload->>'proposed_city','')), ''), 120),
    left(nullif(trim(coalesce(payload->>'proposed_district','')), ''), 120),
    nullif(payload->>'land_area_sqm','')::numeric,
    left(nullif(trim(coalesce(payload->>'ownership_status','')), ''), 60),
    nullif(payload->>'investment_capital_sar','')::numeric,
    left(nullif(trim(coalesce(payload->>'notes','')), ''), 4000),
    'new'
  ) RETURNING reference INTO ref;

  RETURN ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_acquisition_request(payload jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE ref text;
BEGIN
  IF length(trim(coalesce(payload->>'full_name',''))) = 0
     OR length(trim(coalesce(payload->>'email',''))) = 0
     OR length(trim(coalesce(payload->>'phone',''))) = 0 THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;

  INSERT INTO public.acquisition_requests (
    full_name, phone, email, station_name, city, district,
    land_area_sqm, fuel_pumps_count, avg_daily_sales_sar, notes, status
  ) VALUES (
    left(trim(payload->>'full_name'), 200),
    left(trim(payload->>'phone'), 50),
    left(trim(payload->>'email'), 255),
    left(nullif(trim(coalesce(payload->>'station_name','')), ''), 200),
    left(nullif(trim(coalesce(payload->>'city','')), ''), 120),
    left(nullif(trim(coalesce(payload->>'district','')), ''), 120),
    nullif(payload->>'land_area_sqm','')::numeric,
    nullif(payload->>'fuel_pumps_count','')::int,
    nullif(payload->>'avg_daily_sales_sar','')::numeric,
    left(nullif(trim(coalesce(payload->>'notes','')), ''), 4000),
    'new'
  ) RETURNING reference INTO ref;

  RETURN ref;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_contact_message(payload jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE ref text;
BEGIN
  IF length(trim(coalesce(payload->>'full_name',''))) = 0
     OR length(trim(coalesce(payload->>'email',''))) = 0
     OR length(trim(coalesce(payload->>'subject',''))) = 0
     OR length(trim(coalesce(payload->>'message',''))) = 0
     OR length(trim(coalesce(payload->>'category',''))) = 0 THEN
    RAISE EXCEPTION 'missing_required_fields';
  END IF;

  INSERT INTO public.contact_messages (
    full_name, email, phone, category, subject, message, status
  ) VALUES (
    left(trim(payload->>'full_name'), 200),
    left(trim(payload->>'email'), 255),
    left(nullif(trim(coalesce(payload->>'phone','')), ''), 50),
    left(trim(payload->>'category'), 40),
    left(trim(payload->>'subject'), 200),
    left(trim(payload->>'message'), 4000),
    'new'
  ) RETURNING reference INTO ref;

  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_franchise_application(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_acquisition_request(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_contact_message(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_franchise_application(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_acquisition_request(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(jsonb) TO anon, authenticated;