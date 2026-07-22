
DROP POLICY IF EXISTS "chat public write" ON public.chatbot_messages;
CREATE POLICY "chat public write" ON public.chatbot_messages
  FOR INSERT
  WITH CHECK (role = 'user' AND session_id IS NOT NULL);

CREATE POLICY "Users insert own export files" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'exports' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users update own export files" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'exports' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users delete own export files" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'exports' AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.generate_reference(prefix text)
RETURNS text LANGUAGE plpgsql SET search_path = public
AS $function$
DECLARE n BIGINT;
BEGIN
  n := nextval('public.reference_seq');
  RETURN 'GS-' || prefix || '-' || to_char(now(),'YYYY') || '-' || lpad(n::text,5,'0');
END; $function$;

REVOKE EXECUTE ON FUNCTION public.export_jobs_lease(integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_limit_purge(integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, PUBLIC;
