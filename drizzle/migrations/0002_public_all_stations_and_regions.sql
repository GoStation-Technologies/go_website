ALTER POLICY "stations public read" ON public.stations TO anon, authenticated USING (true);
GRANT SELECT ON public.stations TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.station_network_stats()
RETURNS TABLE(stations_count integer, active_regions_count integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT (SELECT count(*)::int FROM public.stations),
         (SELECT count(*)::int FROM public.regions WHERE is_master_ksa = true);
$$;
GRANT EXECUTE ON FUNCTION public.station_network_stats() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.active_station_regions()
RETURNS TABLE(id uuid, name text, name_ar text, name_en text, is_master_ksa boolean, stations_count integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT r.id, r.name, r.name_ar, r.name_en, r.is_master_ksa, count(s.id)::int
  FROM public.regions r
  JOIN public.stations s ON s.region_id = r.id
  GROUP BY r.id, r.name, r.name_ar, r.name_en, r.is_master_ksa
  ORDER BY count(s.id) DESC, r.name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.active_station_regions() TO anon, authenticated, service_role;