WITH imgs AS (
  SELECT id, (ARRAY[
    'https://res.cloudinary.com/dca2x8jje/image/upload/v1785923737/X2LyA5D_tgxzxe.jpg',
    'https://res.cloudinary.com/dca2x8jje/image/upload/v1785923736/images_5_cgowl5.jpg',
    'https://res.cloudinary.com/dca2x8jje/image/upload/v1785923736/8Ea8Bka_mwqx5o.jpg'
  ])[(row_number() OVER (ORDER BY published_at DESC) - 1) % 3 + 1] AS url
  FROM public.news_articles
)
UPDATE public.news_articles n
SET cover_url = imgs.url
FROM imgs
WHERE n.id = imgs.id AND (n.cover_url IS NULL OR n.cover_url = '');