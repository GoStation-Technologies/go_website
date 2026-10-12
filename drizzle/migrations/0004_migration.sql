CREATE OR REPLACE FUNCTION public.log_abuse_event(_reason text, _key text, _session_id uuid, _ip_hash text, _lang text, _current_count integer, _metadata jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _reason IS NULL OR length(_reason) = 0 OR length(_reason) > 40 THEN RETURN; END IF;
  INSERT INTO public.abuse_events (reason, key, session_id, ip_hash, lang, current_count, metadata)
  VALUES (_reason, left(_key, 200), _session_id, left(_ip_hash, 128), left(_lang, 5), _current_count,
          CASE WHEN _metadata IS NULL OR length(_metadata::text) > 2000 THEN '{}'::jsonb ELSE _metadata END);
END; $$;
REVOKE ALL ON FUNCTION public.log_abuse_event(text,text,uuid,text,text,integer,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.log_abuse_event(text,text,uuid,text,text,integer,jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text,integer,integer) TO anon, authenticated, service_role;

GRANT SELECT ON public.abuse_events TO authenticated;
DROP POLICY IF EXISTS "abuse_events super admin read" ON public.abuse_events;
CREATE POLICY "abuse_events super admin read" ON public.abuse_events FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::app_role));