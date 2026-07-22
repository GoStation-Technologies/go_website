ALTER TABLE public.export_jobs
  ADD COLUMN IF NOT EXISTS processed_rows integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rows integer,
  ADD COLUMN IF NOT EXISTS pages_processed integer NOT NULL DEFAULT 0;