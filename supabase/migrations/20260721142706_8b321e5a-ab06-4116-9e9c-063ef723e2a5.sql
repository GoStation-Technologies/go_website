
-- ============================================================
-- ROLES & PROFILES
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('super_admin','bd','hr','media','ir','ops','support');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read"  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles admin read" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "user_roles admin write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Reference-number generator
CREATE SEQUENCE IF NOT EXISTS public.reference_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_reference(prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE n BIGINT;
BEGIN
  n := nextval('public.reference_seq');
  RETURN 'GS-' || prefix || '-' || to_char(now(),'YYYY') || '-' || lpad(n::text,5,'0');
END; $$;

-- ============================================================
-- STATIONS
-- ============================================================
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  city_ar TEXT NOT NULL,
  city_en TEXT NOT NULL,
  district_ar TEXT,
  district_en TEXT,
  address_ar TEXT,
  address_en TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  hours_open TIME,
  hours_close TIME,
  is_24h BOOLEAN NOT NULL DEFAULT false,
  fuel_types TEXT[] NOT NULL DEFAULT '{}',
  services TEXT[] NOT NULL DEFAULT '{}',
  photo_url TEXT,
  google_rating NUMERIC(2,1),
  google_place_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stations public read" ON public.stations FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(),'ops') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "stations ops write" ON public.stations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'ops') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'ops') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER stations_updated BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- NEWS & EVENTS
-- ============================================================
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'news' CHECK (kind IN ('news','event')),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_ar TEXT,
  excerpt_en TEXT,
  body_ar TEXT,
  body_en TEXT,
  cover_url TEXT,
  event_date TIMESTAMPTZ,
  event_location_ar TEXT,
  event_location_en TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news public read" ON public.news_articles FOR SELECT TO anon, authenticated USING (is_published = true AND (published_at IS NULL OR published_at <= now()));
CREATE POLICY "news media manage" ON public.news_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER news_updated BEFORE UPDATE ON public.news_articles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- CAREERS
-- ============================================================
CREATE TABLE public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  department TEXT NOT NULL,
  city TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.job_openings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_openings TO authenticated;
GRANT ALL ON public.job_openings TO service_role;
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs public read"  ON public.job_openings FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "jobs hr manage"    ON public.job_openings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER jobs_updated BEFORE UPDATE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_reference('JOB'),
  job_id UUID NOT NULL REFERENCES public.job_openings ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  linkedin_url TEXT,
  cover_letter TEXT,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.job_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job apps public submit" ON public.job_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "job apps hr manage"     ON public.job_applications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'hr') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER job_apps_updated BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- FRANCHISE APPLICATIONS
-- ============================================================
CREATE TABLE public.franchise_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_reference('FR'),
  -- personal
  full_name TEXT NOT NULL,
  national_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  cr_number TEXT,
  -- location
  proposed_city TEXT,
  proposed_district TEXT,
  location_map_url TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  land_area_sqm NUMERIC,
  ownership_status TEXT,
  ownership_doc_url TEXT,
  site_photo_urls TEXT[] DEFAULT '{}',
  -- financial
  investment_capital_sar NUMERIC,
  financial_proof_url TEXT,
  tier TEXT,
  notes TEXT,
  -- pipeline
  status TEXT NOT NULL DEFAULT 'new',
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.franchise_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.franchise_applications TO authenticated;
GRANT ALL ON public.franchise_applications TO service_role;
ALTER TABLE public.franchise_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "franchise public submit" ON public.franchise_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "franchise bd manage"     ON public.franchise_applications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'bd') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'bd') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER franchise_updated BEFORE UPDATE ON public.franchise_applications FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- ACQUISITION REQUESTS
-- ============================================================
CREATE TABLE public.acquisition_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_reference('ACQ'),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  station_name TEXT,
  city TEXT,
  district TEXT,
  location_map_url TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  land_area_sqm NUMERIC,
  fuel_pumps_count INT,
  current_services TEXT[] DEFAULT '{}',
  avg_daily_sales_sar NUMERIC,
  station_photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.acquisition_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.acquisition_requests TO authenticated;
GRANT ALL ON public.acquisition_requests TO service_role;
ALTER TABLE public.acquisition_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acq public submit" ON public.acquisition_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "acq bd manage"     ON public.acquisition_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'bd') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'bd') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER acq_updated BEFORE UPDATE ON public.acquisition_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_status_history TO authenticated;
GRANT ALL ON public.application_status_history TO service_role;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history staff read" ON public.application_status_history FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "history staff insert" ON public.application_status_history FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- ============================================================
-- INVESTOR RELATIONS
-- ============================================================
CREATE TABLE public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_year INT NOT NULL,
  published_at DATE NOT NULL,
  file_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.financial_reports TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.financial_reports TO authenticated;
GRANT ALL ON public.financial_reports TO service_role;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports public read" ON public.financial_reports FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "reports ir manage"   ON public.financial_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(),'ir') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'ir') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER reports_updated BEFORE UPDATE ON public.financial_reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.report_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.financial_reports ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.report_downloads TO anon, authenticated;
GRANT SELECT ON public.report_downloads TO authenticated;
GRANT ALL ON public.report_downloads TO service_role;
ALTER TABLE public.report_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "downloads public log" ON public.report_downloads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "downloads ir read"    ON public.report_downloads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'ir') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.ir_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_reference('IR'),
  full_name TEXT NOT NULL,
  organization TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.ir_inquiries TO anon, authenticated;
GRANT SELECT, UPDATE ON public.ir_inquiries TO authenticated;
GRANT ALL ON public.ir_inquiries TO service_role;
ALTER TABLE public.ir_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ir public submit" ON public.ir_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "ir manage"        ON public.ir_inquiries FOR ALL TO authenticated USING (public.has_role(auth.uid(),'ir') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'ir') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER ir_updated BEFORE UPDATE ON public.ir_inquiries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- CONTACT / SUPPORT / CHAT
-- ============================================================
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_reference('MSG'),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact public submit" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact staff read"    ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact staff update"  ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT public.generate_reference('TKT'),
  full_name TEXT,
  contact TEXT,
  station_ref TEXT,
  issue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  handoff_requested BOOLEAN NOT NULL DEFAULT false,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.support_tickets TO anon, authenticated;
GRANT SELECT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets public submit" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tickets support manage" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  ticket_id UUID REFERENCES public.support_tickets ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.chatbot_messages TO anon, authenticated;
GRANT SELECT ON public.chatbot_messages TO authenticated;
GRANT ALL ON public.chatbot_messages TO service_role;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat public write" ON public.chatbot_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "chat support read" ON public.chatbot_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'support') OR public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- ABOUT / CMS / MISC
-- ============================================================
CREATE TABLE public.leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  bio_ar TEXT,
  bio_en TEXT,
  photo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leaders TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.leaders TO authenticated;
GRANT ALL ON public.leaders TO service_role;
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaders public read" ON public.leaders FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "leaders media manage" ON public.leaders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER leaders_updated BEFORE UPDATE ON public.leaders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  issuer_ar TEXT,
  issuer_en TEXT,
  year INT NOT NULL,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.awards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.awards TO authenticated;
GRANT ALL ON public.awards TO service_role;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "awards public read" ON public.awards FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "awards media manage" ON public.awards FOR ALL TO authenticated USING (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  block_key TEXT NOT NULL,
  content_ar TEXT,
  content_en TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_key, block_key)
);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages public read" ON public.pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pages media manage" ON public.pages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER pages_updated BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.partner_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partner_offers TO authenticated;
GRANT ALL ON public.partner_offers TO service_role;
ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers public read" ON public.partner_offers FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "offers media manage" ON public.partner_offers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'media') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.system_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_cache TO anon, authenticated;
GRANT INSERT, UPDATE ON public.system_cache TO authenticated;
GRANT ALL ON public.system_cache TO service_role;
ALTER TABLE public.system_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cache public read" ON public.system_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cache admin write" ON public.system_cache FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'ops')) WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'ops'));

CREATE TABLE public.page_views (
  id BIGSERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views public write" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "views staff read"   ON public.page_views FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO public.system_cache (key, value) VALUES
  ('aramco_fuel_prices', '{"prices":{"91":2.33,"95":2.66,"98":3.05,"diesel":1.15},"currency":"SAR","updated_at":"2026-01-01T00:00:00Z"}'::jsonb),
  ('google_reviews', '{"reviews":[
     {"author":"Ahmed Al-Salem","rating":5,"text":"Fast service and clean facilities.","date":"2025-11-12","lang":"en"},
     {"author":"سارة القحطاني","rating":5,"text":"محطة ممتازة وخدمة سريعة، أنصح بها.","date":"2025-11-08","lang":"ar"},
     {"author":"Mohammed A.","rating":4,"text":"Great location, friendly staff.","date":"2025-10-30","lang":"en"},
     {"author":"فهد العتيبي","rating":5,"text":"أسعار مناسبة ومحطة نظيفة.","date":"2025-10-25","lang":"ar"},
     {"author":"Layla Hassan","rating":5,"text":"My go-to station in Riyadh.","date":"2025-10-19","lang":"en"}
   ]}'::jsonb);

INSERT INTO public.stations (name_ar, name_en, city_ar, city_en, district_ar, district_en, address_ar, address_en, lat, lng, is_24h, fuel_types, services, google_rating) VALUES
  ('محطة قوستيشن الملز','GoStation Al Malaz','الرياض','Riyadh','الملز','Al Malaz','طريق الأمير عبدالله','Prince Abdullah Rd', 24.6892, 46.7345, true, ARRAY['91','95','98','diesel'], ARRAY['car_wash','grocery','cafe','atm'], 4.7),
  ('محطة قوستيشن العليا','GoStation Al Olaya','الرياض','Riyadh','العليا','Al Olaya','طريق الملك فهد','King Fahd Rd', 24.6949, 46.6857, true, ARRAY['91','95','98','diesel'], ARRAY['car_wash','cafe','tire_service'], 4.6),
  ('محطة قوستيشن الكورنيش','GoStation Corniche','جدة','Jeddah','الكورنيش','Corniche','طريق الأمير محمد بن عبدالعزيز','Prince Mohammed Rd', 21.5433, 39.1728, true, ARRAY['91','95','diesel'], ARRAY['grocery','cafe','atm'], 4.8),
  ('محطة قوستيشن الظهران','GoStation Dhahran','الظهران','Dhahran','الدواسر','Al Dawaser','طريق الملك فهد','King Fahd Rd', 26.2361, 50.0393, true, ARRAY['91','95','98','diesel'], ARRAY['car_wash','tire_service'], 4.5),
  ('محطة قوستيشن المدينة','GoStation Madinah','المدينة المنورة','Madinah','قباء','Quba','طريق قباء','Quba Rd', 24.4539, 39.6197, false, ARRAY['91','95','diesel'], ARRAY['grocery','cafe'], 4.6);

INSERT INTO public.news_articles (slug, kind, title_ar, title_en, excerpt_ar, excerpt_en, body_ar, body_en, is_published, is_featured, published_at) VALUES
  ('gostation-wins-ifa-2025','news','قوستيشن تفوز بجائزة IFA للتمويل الدولي 2025','GoStation Wins International Finance Awards 2025',
   'حصلت قوستيشن على جائزة أسرع الشركات نمواً في المملكة العربية السعودية.','GoStation named the fastest-growing energy company in Saudi Arabia.',
   'حصلت شركة قوستيشن على جائزة IFA لعام 2025 كأسرع الشركات نمواً في قطاع الطاقة بالمملكة، تقديراً لتوسعها السريع وشبكتها المتنامية.','GoStation was honored at the 13th Annual International Finance Awards 2025 as the fastest-growing energy company in the Kingdom of Saudi Arabia, recognizing its rapid expansion and growing network.',
   true, true, now() - interval '3 days'),
  ('new-branch-riyadh','news','افتتاح فرع جديد في شمال الرياض','New branch opens in North Riyadh',
   'افتتحت قوستيشن محطتها رقم 180 في شمال العاصمة.','GoStation opens its 180th station in northern Riyadh.',
   'واصلت قوستيشن توسعها بافتتاح محطة جديدة في شمال الرياض تضم جميع أنواع الوقود ومجموعة من خدمات السائق.','GoStation continues its expansion with a new station in northern Riyadh, offering all fuel types and a full suite of driver services.',
   true, false, now() - interval '10 days'),
  ('sustainability-report-2025','news','إطلاق تقرير الاستدامة السنوي 2025','2025 Sustainability Report Released',
   'يوثق التقرير أثر قوستيشن البيئي والاجتماعي.','A summary of GoStation''s environmental and social impact.',
   'يستعرض التقرير جهود الشركة في تقليل الانبعاثات، ودعم المجتمع، والمساهمة في تحقيق أهداف رؤية 2030.','The report highlights the company''s efforts in reducing emissions, community support, and contribution to Vision 2030 goals.',
   true, false, now() - interval '20 days'),
  ('community-day-jeddah','event','يوم قوستيشن المجتمعي — جدة','GoStation Community Day — Jeddah',
   'فعالية مفتوحة للعائلات على كورنيش جدة.','A family-friendly community event at Jeddah Corniche.',
   'انضموا إلينا في يوم مليء بالأنشطة والألعاب والعروض الترفيهية.','Join us for a day of activities, games, and entertainment for the whole family.',
   true, false, now() - interval '5 days');
UPDATE public.news_articles SET event_date = now() + interval '30 days', event_location_ar='كورنيش جدة', event_location_en='Jeddah Corniche' WHERE slug='community-day-jeddah';

INSERT INTO public.leaders (name_ar, name_en, title_ar, title_en, bio_ar, bio_en, sort_order) VALUES
  ('فيصل الشمري','Faisal Al-Shamri','الرئيس التنفيذي','Chief Executive Officer','يقود قوستيشن منذ التأسيس ويشرف على استراتيجية التوسع.','Leads GoStation since inception and oversees expansion strategy.',1),
  ('نورة العنزي','Noura Al-Enazi','المدير المالي','Chief Financial Officer','خبرة تزيد عن 15 عاماً في قطاع الطاقة والاستثمار.','Over 15 years of experience in energy and investment.',2),
  ('عبدالله الغامدي','Abdullah Al-Ghamdi','مدير العمليات','Chief Operating Officer','مسؤول عن شبكة المحطات والعمليات اليومية.','Responsible for the station network and daily operations.',3),
  ('ريم القحطاني','Reem Al-Qahtani','مدير التسويق','Chief Marketing Officer','تقود العلامة التجارية وبرامج الولاء.','Leads brand and loyalty programs.',4);

INSERT INTO public.awards (name_ar, name_en, issuer_ar, issuer_en, year, sort_order) VALUES
  ('جائزة أسرع الشركات نمواً','Fastest-Growing Company Award','جوائز التمويل الدولي','International Finance Awards',2025,1),
  ('شهادة التميز في خدمة العملاء','Customer Service Excellence','مؤشر رضا العملاء السعودي','Saudi Customer Satisfaction Index',2024,2),
  ('جائزة الاستدامة البيئية','Environmental Sustainability Award','وزارة الطاقة','Ministry of Energy',2024,3);

INSERT INTO public.pages (page_key, block_key, content_ar, content_en) VALUES
  ('about','story_title','قصتنا','Our Story'),
  ('about','story_body','انطلقت قوستيشن برؤية طموحة لتقديم تجربة تعبئة وقود عصرية وموثوقة عبر المملكة، ونمت لتصبح واحدة من أسرع شبكات محطات الوقود نمواً في المنطقة.','GoStation started with a bold vision — to deliver a modern, reliable fueling experience across the Kingdom. We''ve grown to become one of the fastest-growing fuel networks in the region.'),
  ('about','vision','أن نكون الشريك الأول للطاقة والتنقل في المملكة العربية السعودية.','To be the leading energy and mobility partner in Saudi Arabia.'),
  ('about','mission','تقديم خدمات وقود عالية الجودة مع تجربة عميل استثنائية في كل زيارة.','To deliver high-quality fuel services with an exceptional customer experience at every visit.'),
  ('about','values','الابتكار • النزاهة • تميز الخدمة • المسؤولية المجتمعية','Innovation • Integrity • Service Excellence • Community Responsibility'),
  ('about','esg','ملتزمون بتقليل الأثر البيئي، ودعم المجتمع، والالتزام بأعلى معايير الحوكمة تماشياً مع رؤية المملكة 2030.','Committed to reducing environmental impact, supporting our community, and upholding the highest governance standards aligned with Saudi Vision 2030.'),
  ('homepage','hero_headline','محطة وأكثر','A Station and More'),
  ('homepage','hero_sub','أسرع شبكة محطات وقود نمواً في المملكة — تجمع بين الجودة والابتكار.','The fastest-growing fuel network in Saudi Arabia — combining quality and innovation.'),
  ('homepage','why_customers','قربك، تنوع الخدمات، وأسعار تنافسية في كل محطة.','Proximity, service variety, and competitive pricing at every station.'),
  ('homepage','why_investors','عائد استثماري مثبت، شبكة سريعة النمو، وقوة العلامة التجارية.','Proven ROI, a fast-growing network, and strong brand equity.'),
  ('homepage','why_owners','انضم لنموذج تشغيلي متكامل وعلامة تجارية موثوقة.','Join a complete operational model and a trusted brand.'),
  ('stats','stations','180','180'),
  ('stats','regions','13','13'),
  ('stats','years','12','12'),
  ('stats','daily','50000','50,000');
