CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_ar TEXT,
  name_en TEXT,
  dataverse_code INTEGER UNIQUE,
  is_master_ksa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.regions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regions TO authenticated;
GRANT ALL ON public.regions TO service_role;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions public read" ON public.regions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "regions ops write" ON public.regions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'ops'::app_role) OR private.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'ops'::app_role) OR private.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER regions_updated BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.regions (name, name_ar, name_en, dataverse_code, is_master_ksa) VALUES
  ('الرياض','الرياض','Riyadh',120870000,true),
  ('الشرقية','الشرقية','Eastern Province',120870001,true),
  ('عسير','عسير','Asir',120870002,true),
  ('مكة المكرمة','مكة المكرمة','Makkah',120870003,true),
  ('نجران','نجران','Najran',120870004,true),
  ('جازان','جازان','Jazan',120870005,true),
  ('تبوك','تبوك','Tabuk',120870006,true),
  ('المدينة المنورة','المدينة المنورة','Madinah',120870007,true),
  ('الحدود الشمالية','الحدود الشمالية','Northern Borders',120870008,true),
  ('حائل','حائل','Hail',120870009,true),
  ('الباحة','الباحة','Al Baha',120870010,true),
  ('القصيم','القصيم','Qassim',120870011,true),
  ('الجوف','الجوف','Al Jouf',120870012,true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.stations
  ADD COLUMN IF NOT EXISTS dataverse_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS master_region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.stations ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE public.stations ALTER COLUMN lng DROP NOT NULL;

CREATE INDEX IF NOT EXISTS stations_region_id_idx ON public.stations(region_id);

DELETE FROM public.stations WHERE dataverse_id IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'sync-dataverse-locations',
  '0 21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--c1862ef1-c082-4ae4-9879-6f18d23db5e4.lovable.app/api/public/hooks/sync-dataverse-locations',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_wPxBBshhbwNv8ZcUPwbHaw_jbj8nOV3"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);