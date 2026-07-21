CREATE TABLE public.abuse_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  key TEXT,
  session_id UUID,
  ip_hash TEXT,
  lang TEXT,
  current_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX abuse_events_created_at_idx ON public.abuse_events (created_at DESC);
CREATE INDEX abuse_events_reason_idx ON public.abuse_events (reason, created_at DESC);
CREATE INDEX abuse_events_key_idx ON public.abuse_events (key, created_at DESC);
CREATE INDEX abuse_events_session_idx ON public.abuse_events (session_id, created_at DESC);

GRANT ALL ON public.abuse_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.abuse_events_id_seq TO service_role;

ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages abuse_events"
  ON public.abuse_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);