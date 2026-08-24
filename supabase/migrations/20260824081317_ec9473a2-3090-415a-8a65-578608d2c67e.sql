ALTER TABLE public.job_openings
  ADD COLUMN IF NOT EXISTS responsibilities_en text,
  ADD COLUMN IF NOT EXISTS responsibilities_ar text,
  ADD COLUMN IF NOT EXISTS requirements_en text,
  ADD COLUMN IF NOT EXISTS requirements_ar text,
  ADD COLUMN IF NOT EXISTS apply_url text;