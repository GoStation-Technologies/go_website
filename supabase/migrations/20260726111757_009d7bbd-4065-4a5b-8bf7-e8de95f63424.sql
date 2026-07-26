-- 1) Move role-check SECURITY DEFINER functions out of the API-exposed schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION private.is_staff(uuid) SET search_path = public;

-- 2) chatbot_messages: no direct client inserts (server uses service role)
DROP POLICY IF EXISTS "chat public write" ON public.chatbot_messages;
REVOKE INSERT, UPDATE, DELETE ON public.chatbot_messages FROM anon, authenticated;
GRANT ALL ON public.chatbot_messages TO service_role;

-- 3) report_downloads: no forged client-side logging (server validates report)
DROP POLICY IF EXISTS "downloads public log" ON public.report_downloads;
REVOKE INSERT, UPDATE, DELETE ON public.report_downloads FROM anon, authenticated;
GRANT ALL ON public.report_downloads TO service_role;

-- 4) allow authenticated users to read their own roles (self-role checks in app code)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;