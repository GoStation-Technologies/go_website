
CREATE TYPE public.export_job_status AS ENUM ('queued','processing','ready','failed','expired');

CREATE TABLE public.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.export_job_status NOT NULL DEFAULT 'queued',
  row_count integer,
  storage_path text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.export_jobs TO authenticated;
GRANT ALL ON public.export_jobs TO service_role;

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own export jobs"
  ON public.export_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own export jobs"
  ON public.export_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own export jobs"
  ON public.export_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_export_jobs_user_created ON public.export_jobs(user_id, created_at DESC);
CREATE INDEX idx_export_jobs_pending ON public.export_jobs(status, created_at) WHERE status IN ('queued','processing');

CREATE TRIGGER export_jobs_set_updated_at
  BEFORE UPDATE ON public.export_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Atomically claim up to _limit queued jobs (or stuck 'processing' > 5 min).
CREATE OR REPLACE FUNCTION public.export_jobs_lease(_limit integer DEFAULT 3)
RETURNS SETOF public.export_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id FROM public.export_jobs
    WHERE (status = 'queued')
       OR (status = 'processing' AND started_at < now() - interval '5 minutes')
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT _limit
  )
  UPDATE public.export_jobs j
  SET status = 'processing',
      started_at = now(),
      attempts = j.attempts + 1,
      updated_at = now()
  FROM candidates c
  WHERE j.id = c.id
  RETURNING j.*;
END;
$$;
