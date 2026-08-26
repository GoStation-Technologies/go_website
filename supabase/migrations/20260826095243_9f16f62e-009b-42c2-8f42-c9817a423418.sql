DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;

CREATE POLICY "site_settings public read"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key IN ('announcement_bar','contact','footer','go_app','social_links'));