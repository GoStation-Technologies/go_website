CREATE OR REPLACE FUNCTION public.station_network_stats()
RETURNS TABLE(stations_count integer, active_regions_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.stations),
    (SELECT count(DISTINCT region_id)::int FROM public.stations WHERE region_id IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION public.station_network_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.station_network_stats() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.active_station_regions()
RETURNS TABLE(id uuid, name text, name_ar text, name_en text, is_master_ksa boolean, stations_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.name, r.name_ar, r.name_en, r.is_master_ksa, count(s.id)::int
  FROM public.regions r
  JOIN public.stations s ON s.region_id = r.id
  GROUP BY r.id, r.name, r.name_ar, r.name_en, r.is_master_ksa
  ORDER BY count(s.id) DESC, r.name ASC;
$$;

REVOKE ALL ON FUNCTION public.active_station_regions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_station_regions() TO anon, authenticated, service_role;