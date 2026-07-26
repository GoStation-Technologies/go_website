ALTER TABLE public.job_openings
  ADD COLUMN IF NOT EXISTS department_en text,
  ADD COLUMN IF NOT EXISTS department_ar text,
  ADD COLUMN IF NOT EXISTS city_en text,
  ADD COLUMN IF NOT EXISTS city_ar text;

UPDATE public.job_openings SET
  department_en = COALESCE(department_en, department),
  department_ar = COALESCE(department_ar, department),
  city_en = COALESCE(city_en, city),
  city_ar = COALESCE(city_ar, city);