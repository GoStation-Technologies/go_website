ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS leasing_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
GRANT SELECT, INSERT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
CREATE OR REPLACE FUNCTION public.submit_contact_message(payload jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE ref text;
BEGIN
 IF length(trim(coalesce(payload->>'full_name',''))) = 0 OR length(trim(coalesce(payload->>'email',''))) = 0 OR length(trim(coalesce(payload->>'subject',''))) = 0 OR length(trim(coalesce(payload->>'message',''))) = 0 OR length(trim(coalesce(payload->>'category',''))) = 0 THEN RAISE EXCEPTION 'missing_required_fields'; END IF;
 INSERT INTO public.contact_messages (full_name,email,phone,category,subject,message,status,leasing_metadata) VALUES (left(trim(payload->>'full_name'),200),left(trim(payload->>'email'),255),left(nullif(trim(coalesce(payload->>'phone','')),''),50),left(trim(payload->>'category'),40),left(trim(payload->>'subject'),200),left(trim(payload->>'message'),4000),'new',CASE WHEN payload->>'category'='leasing' THEN coalesce(payload->'leasing_metadata','{}'::jsonb) ELSE '{}'::jsonb END) RETURNING reference INTO ref;
 RETURN ref;
END;
$function$;
CREATE POLICY "Leasing documents staff read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='leasing-documents' AND EXISTS (SELECT 1 FROM public.contact_messages c WHERE c.category='leasing' AND EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(c.leasing_metadata->'documents','[]'::jsonb)) d WHERE d->>'path'=storage.objects.name)));