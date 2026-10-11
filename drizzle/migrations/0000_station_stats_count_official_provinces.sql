-- active_regions_count now reports the number of official KSA provinces
-- (regions.is_master_ksa) instead of distinct station areas.
CREATE OR REPLACE FUNCTION public.station_network_stats()
 RETURNS TABLE(stations_count integer, active_regions_count integer)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT count(*)::int FROM public.stations WHERE is_active = true),
    (SELECT count(*)::int FROM public.regions WHERE is_master_ksa = true);
$function$;

REVOKE ALL ON FUNCTION public.station_network_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.station_network_stats() TO anon, authenticated, service_role;