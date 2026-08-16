GRANT SELECT ON public.stations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;