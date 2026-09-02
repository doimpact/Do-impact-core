ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_quota integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.can_create_company(_user uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user IS NULL THEN false
    WHEN public.is_super_admin(_user) THEN true
    ELSE (
      SELECT (SELECT count(*) FROM public.companies c WHERE c.created_by = _user)
             < COALESCE((SELECT p.company_quota FROM public.profiles p WHERE p.id = _user), 1)
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.can_create_company(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_create_company(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "signed-in can create company" ON public.companies;
CREATE POLICY "signed-in can create company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.can_create_company(auth.uid()));

DROP POLICY IF EXISTS "admins update company quota" ON public.profiles;
CREATE POLICY "admins update company quota"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());