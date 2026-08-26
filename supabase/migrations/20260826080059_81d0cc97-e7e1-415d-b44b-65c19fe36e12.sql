
-- 1. site_settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings media manage" ON public.site_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. page_sections
CREATE TABLE public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  title_ar TEXT, title_en TEXT,
  subtitle_ar TEXT, subtitle_en TEXT,
  content_ar TEXT, content_en TEXT,
  media_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_slug, section_key)
);
GRANT SELECT ON public.page_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_sections TO authenticated;
GRANT ALL ON public.page_sections TO service_role;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "page_sections public read" ON public.page_sections FOR SELECT USING (is_visible = true);
CREATE POLICY "page_sections media manage" ON public.page_sections FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER page_sections_updated BEFORE UPDATE ON public.page_sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX page_sections_page_idx ON public.page_sections (page_slug, sort_order);

-- 3. faqs
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'general',
  question_ar TEXT NOT NULL, question_en TEXT NOT NULL,
  answer_ar TEXT NOT NULL, answer_en TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT USING (status = 'published');
CREATE POLICY "faqs media manage" ON public.faqs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'media'::app_role) OR private.has_role(auth.uid(),'super_admin'::app_role));
CREATE TRIGGER faqs_updated BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. Seed current site values
INSERT INTO public.site_settings (key, value) VALUES
  ('contact', '{"email":"info@gostation.net","phone":"920002168","whatsapp":"","address_en":"Riyadh, Saudi Arabia","address_ar":"الرياض، المملكة العربية السعودية","maps_url":"https://maps.app.goo.gl/vQJKG388rNJCXqaVA"}'::jsonb),
  ('social_links', '{"x":"","instagram":"","linkedin":"","youtube":"","tiktok":"","facebook":""}'::jsonb),
  ('footer', '{"copyright_en":"","copyright_ar":""}'::jsonb),
  ('announcement_bar', '{"enabled":false,"text_en":"","text_ar":"","href":""}'::jsonb),
  ('form_recipients', '{"franchise":[],"acquisitions":[],"careers":[],"contact":[]}'::jsonb);

INSERT INTO public.page_sections (page_slug, section_key, sort_order) VALUES
  ('home','hero',0),
  ('home','services',10),
  ('home','join',20),
  ('about','hero',0),
  ('about','vision_mission',10),
  ('franchise','hero',0),
  ('franchise','why_invest',10),
  ('acquisitions','hero',0),
  ('investors','hero',0),
  ('careers','hero',0),
  ('contact','hero',0),
  ('media','hero',0);
