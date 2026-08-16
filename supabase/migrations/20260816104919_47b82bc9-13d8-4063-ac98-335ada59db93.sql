ALTER TABLE public.news_articles DROP CONSTRAINT news_articles_kind_check;
ALTER TABLE public.news_articles ADD CONSTRAINT news_articles_kind_check CHECK (kind = ANY (ARRAY['news'::text,'event'::text,'video'::text]));

ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

INSERT INTO public.news_articles (slug, kind, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, video_url, duration_seconds, views_count, is_published, published_at)
VALUES
 ('video-gostation-brand-film','video','قوستيشن — الفيلم التعريفي','GoStation — Brand Film','جولة في محطات قوستيشن وتجربة العملاء في المملكة.','A tour of GoStation sites and the customer experience across the Kingdom.','https://res.cloudinary.com/dca2x8jje/image/upload/v1785923736/8Ea8Bka_mwqx5o.jpg','https://www.youtube.com/watch?v=aqz-KE-bpKQ',132,18450,true,now() - interval '10 days'),
 ('video-ev-charging-network','video','شبكة شحن المركبات الكهربائية','EV Charging Network','كيف نبني شبكة شحن سريعة في محطات قوستيشن.','How we are building a fast-charging network at GoStation sites.','https://res.cloudinary.com/dca2x8jje/image/upload/v1785923737/X2LyA5D_tgxzxe.jpg','https://www.youtube.com/watch?v=aqz-KE-bpKQ',96,9320,true,now() - interval '25 days'),
 ('video-franchise-journey','video','رحلة الامتياز التجاري','The Franchise Journey','خطوات الانضمام إلى شبكة امتياز قوستيشن.','Steps to join the GoStation franchise network.','https://res.cloudinary.com/dca2x8jje/image/upload/v1785923736/images_5_cgowl5.jpg','https://www.youtube.com/watch?v=aqz-KE-bpKQ',148,5410,true,now() - interval '45 days')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.news_articles SET views_count = 3200 + (random()*8000)::int WHERE views_count = 0 AND kind <> 'video';