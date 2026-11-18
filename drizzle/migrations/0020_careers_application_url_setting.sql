DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT TO anon, authenticated
USING (key = ANY (ARRAY['announcement_bar','contact','footer','go_app','social_links','google_reviews','about_story','careers']));
CREATE POLICY "site_settings hr manage careers" ON public.site_settings FOR ALL TO authenticated
USING (key = 'careers' AND private.has_role(auth.uid(), 'hr'::app_role))
WITH CHECK (key = 'careers' AND private.has_role(auth.uid(), 'hr'::app_role));