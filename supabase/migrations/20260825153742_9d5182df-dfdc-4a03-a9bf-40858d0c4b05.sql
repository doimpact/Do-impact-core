
-- user_roles: explicit admin-only write policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP POLICY IF EXISTS "user_roles admin insert" ON public.user_roles;
CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_company_admin(company_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "user_roles admin update" ON public.user_roles;
CREATE POLICY "user_roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.is_company_admin(company_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    public.is_company_admin(company_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "user_roles admin delete" ON public.user_roles;
CREATE POLICY "user_roles admin delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_company_admin(company_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

-- proficiency_levels: read-only global reference data for signed-in members
ALTER TABLE public.proficiency_levels ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.proficiency_levels FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.proficiency_levels FROM authenticated;
GRANT SELECT ON public.proficiency_levels TO authenticated;
GRANT ALL ON public.proficiency_levels TO service_role;

DROP POLICY IF EXISTS "proficiency_levels read" ON public.proficiency_levels;
CREATE POLICY "proficiency_levels read" ON public.proficiency_levels
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));
