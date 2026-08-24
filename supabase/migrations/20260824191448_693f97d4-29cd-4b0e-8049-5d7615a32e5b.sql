-- 1. Station stats helpers: drop elevated privileges, rely on public read policies
CREATE OR REPLACE FUNCTION public.station_network_stats()
 RETURNS TABLE(stations_count integer, active_regions_count integer)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT count(*)::int FROM public.stations WHERE is_active = true),
    (SELECT count(DISTINCT region_id)::int FROM public.stations WHERE is_active = true AND region_id IS NOT NULL);
$function$;

CREATE OR REPLACE FUNCTION public.active_station_regions()
 RETURNS TABLE(id uuid, name text, name_ar text, name_en text, is_master_ksa boolean, stations_count integer)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.name, r.name_ar, r.name_en, r.is_master_ksa, count(s.id)::int
  FROM public.regions r
  JOIN public.stations s ON s.region_id = r.id AND s.is_active = true
  GROUP BY r.id, r.name, r.name_ar, r.name_en, r.is_master_ksa
  ORDER BY count(s.id) DESC, r.name ASC;
$function$;

-- 2. SMS logs: restrict to super_admin only
DROP POLICY IF EXISTS sms_logs_select_staff ON public.sms_logs;
CREATE POLICY sms_logs_select_super_admin ON public.sms_logs
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));