DROP POLICY IF EXISTS "cms read" ON storage.objects;
CREATE POLICY "cms read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'cms' AND (storage.foldername(name))[1] IN ('cms','awards','partners','leaders','news','reports','media','pages','testimonials','stations','settings','videos'));