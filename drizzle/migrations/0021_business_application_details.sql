ALTER TABLE public.franchise_applications ADD COLUMN application_details jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.acquisition_requests ADD COLUMN application_details jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE POLICY "application documents visitor upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id='application-documents' AND (owner_id IS NULL OR owner_id=auth.uid()::text) AND name ~ '^(franchise|acquisition)/[0-9a-f-]{36}\.(pdf|docx|jpg|png)$');
CREATE POLICY "application documents staff read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='application-documents' AND (private.has_role(auth.uid(),'bd'::public.app_role) OR private.has_role(auth.uid(),'super_admin'::public.app_role)));
CREATE OR REPLACE FUNCTION public.validate_business_application(payload jsonb, kind text) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
DECLARE k text; doc jsonb; required_keys text[];
BEGIN
IF kind NOT IN ('franchise','acquisition') OR jsonb_typeof(payload)<>'object' THEN RAISE EXCEPTION 'invalid_application'; END IF;
required_keys := CASE WHEN kind='franchise' THEN ARRAY['full_name','country','nationality','phone','company_name','cr_number','city'] ELSE ARRAY['full_name','phone','entity_name','city','acquisition_type'] END;
FOREACH k IN ARRAY required_keys LOOP
IF length(trim(coalesce(payload->>k,'')))=0 THEN RAISE EXCEPTION 'missing_required_fields'; END IF;
END LOOP;
IF coalesce(payload->>'phone','') !~ '^05[0-9]{8}$' THEN RAISE EXCEPTION 'invalid_phone'; END IF;
FOR k IN SELECT jsonb_object_keys(payload) LOOP
IF k<>'documents' AND length(coalesce(payload->>k,'')) > (CASE WHEN k='notes' THEN 4000 WHEN k='address' THEN 500 WHEN k IN ('country','nationality','city') THEN 120 WHEN k='cr_number' THEN 100 ELSE 200 END) THEN RAISE EXCEPTION 'invalid_length'; END IF;
END LOOP;
IF kind='acquisition' AND payload->>'acquisition_type' NOT IN ('fuel_stations','land') THEN RAISE EXCEPTION 'invalid_acquisition_type'; END IF;
IF kind='franchise' THEN
IF coalesce(payload->>'station_count','')<>'' AND payload->>'station_count' !~ '^[0-9]{1,9}$' THEN RAISE EXCEPTION 'invalid_station_count'; END IF;
FOREACH k IN ARRAY ARRAY['annual_income_sar','investment_capital_sar'] LOOP
IF coalesce(payload->>k,'')<>'' AND (length(payload->>k)>30 OR payload->>k !~ '^[0-9]+(\.[0-9]{1,2})?$') THEN RAISE EXCEPTION 'invalid_amount'; END IF;
END LOOP;
END IF;
IF jsonb_typeof(coalesce(payload->'documents','[]'::jsonb))<>'array' THEN RAISE EXCEPTION 'invalid_documents'; END IF;
IF jsonb_array_length(coalesce(payload->'documents','[]'::jsonb))>5 THEN RAISE EXCEPTION 'invalid_documents'; END IF;
FOR doc IN SELECT value FROM jsonb_array_elements(coalesce(payload->'documents','[]'::jsonb)) LOOP
IF coalesce(doc->>'path','') !~ ('^'||kind||'/[0-9a-f-]{36}\.(pdf|docx|jpg|png)$') OR length(trim(coalesce(doc->>'name','')))=0 OR length(doc->>'name')>200 THEN RAISE EXCEPTION 'invalid_documents'; END IF;
IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='application-documents' AND name=doc->>'path') THEN RAISE EXCEPTION 'document_missing'; END IF;
END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.validate_business_application(jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_business_application(jsonb,text) TO service_role;
CREATE OR REPLACE FUNCTION public.submit_franchise_application(payload jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ref text;
BEGIN
PERFORM public.validate_business_application(payload,'franchise');
INSERT INTO public.franchise_applications(full_name,national_id,phone,email,city,cr_number,investment_capital_sar,notes,application_details,status) VALUES(trim(payload->>'full_name'),'',trim(payload->>'phone'),'',trim(payload->>'city'),trim(payload->>'cr_number'),nullif(payload->>'investment_capital_sar','')::numeric,payload->>'notes',payload,'new') RETURNING reference INTO ref;
RETURN ref;
END $$;
CREATE OR REPLACE FUNCTION public.submit_acquisition_request(payload jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ref text;
BEGIN
PERFORM public.validate_business_application(payload,'acquisition');
INSERT INTO public.acquisition_requests(full_name,phone,email,station_name,city,notes,application_details,status) VALUES(trim(payload->>'full_name'),trim(payload->>'phone'),'',trim(payload->>'entity_name'),trim(payload->>'city'),payload->>'notes',payload,'new') RETURNING reference INTO ref;
RETURN ref;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_franchise_application(jsonb) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.submit_acquisition_request(jsonb) TO anon,authenticated,service_role;