CREATE OR REPLACE FUNCTION public.station_network_stats()
 RETURNS TABLE(stations_count integer, active_regions_count integer)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    (SELECT count(*)::int FROM public.stations),
    (SELECT count(*)::int FROM public.regions WHERE is_master_ksa = true);
$$;