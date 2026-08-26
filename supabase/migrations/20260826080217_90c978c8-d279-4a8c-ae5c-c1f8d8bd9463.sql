
CREATE POLICY "cms read" ON storage.objects FOR SELECT USING (bucket_id = 'cms');
CREATE POLICY "cms insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cms' AND (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role)));
CREATE POLICY "cms update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cms' AND (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role)))
  WITH CHECK (bucket_id = 'cms' AND (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role)));
CREATE POLICY "cms delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cms' AND (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role)));
