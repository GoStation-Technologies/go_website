DROP POLICY IF EXISTS "Leasing documents public upload" ON storage.objects;
DROP POLICY IF EXISTS "cvs public upload" ON storage.objects;
DROP POLICY IF EXISTS "application documents visitor upload" ON storage.objects;

CREATE POLICY "Leasing documents anon upload" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'leasing-documents' AND name ~ '^requests/[0-9a-f-]{36}\.(pdf|png|jpg)$' AND owner_id IS NULL AND (SELECT auth.uid()) IS NULL);
CREATE POLICY "Leasing documents user upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'leasing-documents' AND name ~ '^requests/[0-9a-f-]{36}\.(pdf|png|jpg)$' AND owner_id = (SELECT auth.uid()::text));

CREATE POLICY "cvs anon upload" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'cvs' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|doc|docx)$' AND owner_id IS NULL AND (SELECT auth.uid()) IS NULL);
CREATE POLICY "cvs user upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cvs' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|doc|docx)$' AND owner_id = (SELECT auth.uid()::text));

CREATE POLICY "application documents anon upload" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'application-documents' AND name ~ '^(franchise|acquisition)/[0-9a-f-]{36}\.(pdf|docx|jpg|png)$' AND owner_id IS NULL AND (SELECT auth.uid()) IS NULL);
CREATE POLICY "application documents user upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'application-documents' AND name ~ '^(franchise|acquisition)/[0-9a-f-]{36}\.(pdf|docx|jpg|png)$' AND owner_id = (SELECT auth.uid()::text));