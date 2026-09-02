REVOKE EXECUTE ON FUNCTION public.company_is_entitled(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.company_is_entitled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_is_entitled(uuid) TO authenticated, service_role;