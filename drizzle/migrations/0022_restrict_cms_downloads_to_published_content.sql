CREATE OR REPLACE FUNCTION public.cms_asset_is_published(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $function$
SELECT _name IS NOT NULL AND EXISTS (
  SELECT 1 FROM (
    SELECT image_url AS url FROM public.awards
    UNION ALL SELECT photo_url FROM public.leaders WHERE is_active
    UNION ALL SELECT cover_url FROM public.news_articles WHERE is_published AND (published_at IS NULL OR published_at <= now())
    UNION ALL SELECT video_url FROM public.news_articles WHERE is_published AND (published_at IS NULL OR published_at <= now())
    UNION ALL SELECT logo_url FROM public.partner_offers WHERE is_active
    UNION ALL SELECT photo_url FROM public.stations
    UNION ALL SELECT avatar_url FROM public.testimonials WHERE is_active
    UNION ALL SELECT file_url FROM public.financial_reports WHERE is_published
    UNION ALL SELECT media_url FROM public.page_sections WHERE is_visible
    UNION ALL SELECT content_ar FROM public.page_sections WHERE is_visible
    UNION ALL SELECT content_en FROM public.page_sections WHERE is_visible
    UNION ALL SELECT content_ar FROM public.pages
    UNION ALL SELECT content_en FROM public.pages
    UNION ALL SELECT item #>> '{}' FROM public.site_settings s
      CROSS JOIN LATERAL jsonb_path_query(s.value, '$.** ? (@.type() == "string")') AS item
      WHERE s.key IN ('announcement_bar','contact','footer','go_app','social_links','google_reviews','about_story','careers')
  ) published
  WHERE published.url = '/api/public/media/' || _name
     OR published.url ~ ('^https://[^/]+/api/public/media/' || regexp_replace(_name, '([.\\+*?\[\](){}^$|])', '\\\1', 'g') || '$')
     OR published.url ~ ('^https://[^/]+/storage/v1/object/public/cms/' || regexp_replace(_name, '([.\\+*?\[\](){}^$|])', '\\\1', 'g') || '$')
);
$function$;
REVOKE ALL ON FUNCTION public.cms_asset_is_published(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cms_asset_is_published(text) TO anon, authenticated, service_role;
DROP POLICY IF EXISTS "cms read" ON storage.objects;
CREATE POLICY "cms read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'cms' AND (
  owner_id = (SELECT auth.uid()::text)
  OR public.cms_asset_is_published(name)
  OR (auth.uid() IS NOT NULL AND (private.has_role(auth.uid(), 'media'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role)))
));