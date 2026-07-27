REVOKE ALL ON FUNCTION public.submit_contact_message(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_acquisition_request(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_franchise_application(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_acquisition_request(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_franchise_application(jsonb) TO service_role;