INSERT INTO public.site_settings (key, value)
VALUES (
  'social_links',
  jsonb_build_object(
    'x', 'https://x.com/GoStationSA',
    'instagram', 'https://www.instagram.com/gostationsa',
    'linkedin', 'https://www.linkedin.com/company/gostationsa',
    'youtube', 'https://www.youtube.com/@gostationsa',
    'tiktok', 'https://www.tiktok.com/@gotationsa',
    'facebook', 'https://www.facebook.com/gotationsa'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();
