-- Job applicants upload CVs anonymously; staff read them when signed in.
CREATE POLICY "cvs public upload"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'cvs');

CREATE POLICY "cvs staff read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cvs');