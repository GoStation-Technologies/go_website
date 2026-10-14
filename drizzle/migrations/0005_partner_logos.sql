ALTER TABLE public.partner_offers ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.partner_offers ADD COLUMN IF NOT EXISTS website_url text;
GRANT SELECT ON public.partner_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_offers TO authenticated;
GRANT ALL ON public.partner_offers TO service_role;