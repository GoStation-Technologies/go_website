
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: table is service-role only.

CREATE INDEX IF NOT EXISTS rate_limits_updated_at_idx
  ON public.rate_limits (updated_at);

-- Atomic fixed-window rate-limit increment.
-- Returns (allowed, current_count, reset_at). If window has expired, it resets first.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(
  _key TEXT,
  _window_seconds INTEGER,
  _limit INTEGER
) RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.rate_limits%ROWTYPE;
  win_start TIMESTAMPTZ;
BEGIN
  win_start := now() - make_interval(secs => _window_seconds);

  INSERT INTO public.rate_limits (key, window_start, count, updated_at)
  VALUES (_key, now(), 1, now())
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE WHEN public.rate_limits.window_start < win_start THEN 1
                 ELSE public.rate_limits.count + 1 END,
    window_start = CASE WHEN public.rate_limits.window_start < win_start THEN now()
                        ELSE public.rate_limits.window_start END,
    updated_at = now()
  RETURNING * INTO rec;

  allowed := rec.count <= _limit;
  current_count := rec.count;
  reset_at := rec.window_start + make_interval(secs => _window_seconds);
  RETURN NEXT;
END;
$$;

-- Housekeeping: purge expired counter rows.
CREATE OR REPLACE FUNCTION public.rate_limit_purge(_older_than_seconds INTEGER DEFAULT 86400)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  DELETE FROM public.rate_limits
   WHERE updated_at < now() - make_interval(secs => _older_than_seconds);
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
