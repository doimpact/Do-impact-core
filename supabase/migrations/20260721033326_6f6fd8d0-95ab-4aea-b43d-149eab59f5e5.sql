
REVOKE EXECUTE ON FUNCTION public.is_authenticated() FROM PUBLIC, authenticated, anon;
DROP FUNCTION IF EXISTS public.is_authenticated();
