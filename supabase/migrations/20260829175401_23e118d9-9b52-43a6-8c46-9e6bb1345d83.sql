CREATE OR REPLACE FUNCTION public.demo_persona_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id FROM public.profiles p WHERE p.email LIKE '%@titanscale.example'
$$;

REVOKE ALL ON FUNCTION public.demo_persona_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.demo_persona_ids() TO authenticated, service_role;