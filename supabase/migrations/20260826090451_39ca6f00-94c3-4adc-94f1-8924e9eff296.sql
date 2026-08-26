CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_en text NOT NULL,
  author_ar text NOT NULL,
  role_en text,
  role_ar text,
  quote_en text NOT NULL,
  quote_ar text NOT NULL,
  avatar_url text,
  rating smallint NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials public read" ON public.testimonials
  FOR SELECT USING (is_active = true);

CREATE POLICY "testimonials media manage" ON public.testimonials
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'media'::app_role) OR private.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'media'::app_role) OR private.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.testimonials (author_en, author_ar, role_en, role_ar, quote_en, quote_ar, rating, sort_order)
VALUES
  ('Faisal Al-Otaibi','فيصل العتيبي','Fleet manager','مدير أسطول','Refuelling our fleet at GoStation cut our downtime dramatically — clean sites, fast pumps, reliable staff.','تزويد أسطولنا بالوقود في جو ستيشن قلّل توقفنا بشكل كبير — مواقع نظيفة ومضخات سريعة وفريق موثوق.',5,1),
  ('Nouf Al-Harbi','نوف الحربي','Daily commuter','مستخدمة يومية','The Go App points add up fast and the stations are always well lit and safe at night.','نقاط تطبيق جو تتراكم بسرعة والمحطات مضاءة وآمنة دائماً في الليل.',5,2),
  ('Sultan Al-Qahtani','سلطان القحطاني','Franchise partner','شريك امتياز','Partnering with GoStation was straightforward: clear standards, real support, and steady footfall.','الشراكة مع جو ستيشن كانت واضحة: معايير محددة ودعم حقيقي وإقبال مستمر.',5,3);

INSERT INTO public.page_sections (page_slug, section_key, title_en, title_ar, subtitle_en, subtitle_ar, sort_order, is_visible)
VALUES
  ('home','hero',NULL,NULL,NULL,NULL,1,true),
  ('home','services',NULL,NULL,NULL,NULL,2,true),
  ('home','network',NULL,NULL,NULL,NULL,3,true),
  ('home','franchise',NULL,NULL,NULL,NULL,4,true),
  ('home','acquisitions',NULL,NULL,NULL,NULL,5,true),
  ('home','go_app',NULL,NULL,NULL,NULL,6,true),
  ('home','testimonials','What our customers say','ماذا يقول عملاؤنا',NULL,NULL,7,true),
  ('home','media',NULL,NULL,NULL,NULL,8,true),
  ('about','hero',NULL,NULL,NULL,NULL,1,true),
  ('about','story',NULL,NULL,NULL,NULL,2,true),
  ('about','vision',NULL,NULL,NULL,NULL,3,true),
  ('about','mission',NULL,NULL,NULL,NULL,4,true),
  ('about','values',NULL,NULL,NULL,NULL,5,true),
  ('about','leadership',NULL,NULL,NULL,NULL,6,true),
  ('about','awards',NULL,NULL,NULL,NULL,7,true),
  ('franchise','hero',NULL,NULL,NULL,NULL,1,true),
  ('franchise','benefits',NULL,NULL,NULL,NULL,2,true),
  ('franchise','requirements',NULL,NULL,NULL,NULL,3,true),
  ('franchise','steps',NULL,NULL,NULL,NULL,4,true),
  ('franchise','form',NULL,NULL,NULL,NULL,5,true),
  ('acquisitions','hero',NULL,NULL,NULL,NULL,1,true),
  ('acquisitions','criteria',NULL,NULL,NULL,NULL,2,true),
  ('acquisitions','guidelines',NULL,NULL,NULL,NULL,3,true),
  ('acquisitions','contact_callout',NULL,NULL,NULL,NULL,4,true),
  ('investors','hero',NULL,NULL,NULL,NULL,1,true),
  ('investors','highlights',NULL,NULL,NULL,NULL,2,true),
  ('investors','reports',NULL,NULL,NULL,NULL,3,true),
  ('investors','announcements',NULL,NULL,NULL,NULL,4,true),
  ('investors','contact',NULL,NULL,NULL,NULL,5,true)
ON CONFLICT (page_slug, section_key) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES
  ('contact', jsonb_build_object(
     'email','info@gostation.net',
     'phone','920002168',
     'whatsapp','',
     'address_en','Riyadh, Kingdom of Saudi Arabia',
     'address_ar','الرياض، المملكة العربية السعودية',
     'hours_en','Sunday – Thursday, 8:00 – 17:00',
     'hours_ar','الأحد – الخميس، 8:00 – 17:00',
     'map_lat','24.7136',
     'map_lng','46.6753')),
  ('social_links', jsonb_build_object('x','','linkedin','','instagram','','facebook','','youtube','','tiktok','')),
  ('go_app', jsonb_build_object(
     'headline_en','','headline_ar','',
     'description_en','','description_ar','',
     'image_url','','ios_url','','android_url',''))
ON CONFLICT (key) DO NOTHING;