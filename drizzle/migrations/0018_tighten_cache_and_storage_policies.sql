DROP POLICY IF EXISTS "cache public read" ON public.system_cache;
CREATE POLICY "cache public read" ON public.system_cache FOR SELECT TO anon, authenticated USING (key = 'aramco_fuel_prices');

DROP POLICY IF EXISTS "cms read" ON storage.objects;
CREATE POLICY "cms read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'cms' AND (storage.foldername(name))[1] IN ('cms','awards','partners','leaders','news','reports','media','pages','testimonials','stations'));

DROP POLICY IF EXISTS "cvs staff read" ON storage.objects;
CREATE POLICY "cvs staff read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cvs' AND (private.has_role(auth.uid(), 'hr'::app_role) OR private.has_role(auth.uid(), 'super_admin'::app_role)));

DROP POLICY IF EXISTS "cvs public upload" ON storage.objects;
CREATE POLICY "cvs public upload" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'cvs' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|doc|docx)$' AND (owner_id IS NULL OR owner_id = (select auth.uid()::text)));

DROP POLICY IF EXISTS "Leasing documents public upload" ON storage.objects;
CREATE POLICY "Leasing documents public upload" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'leasing-documents' AND name ~ '^requests/[0-9a-f-]{36}\.(pdf|png|jpg)$' AND (owner_id IS NULL OR owner_id = (select auth.uid()::text)));