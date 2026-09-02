-- 1. Remove the inconsistent company deletion rule
DROP POLICY IF EXISTS "owners delete company" ON public.companies;

-- 2. Scope reference skill levels to global rows or the caller's own workspaces
ALTER TABLE public.proficiency_levels
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "proficiency_levels read" ON public.proficiency_levels;
CREATE POLICY "proficiency_levels read" ON public.proficiency_levels
  FOR SELECT TO authenticated
  USING (
    company_id IS NULL
    OR public.is_company_member(company_id, auth.uid())
  );

-- 3. Prevent workspace admins from escalating privileges via user_roles
CREATE OR REPLACE FUNCTION public.is_company_owner(_company_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.company_id = _company_id
      AND cm.user_id = _user_id
      AND cm.role = 'owner'::company_role
  )
$$;

REVOKE ALL ON FUNCTION public.is_company_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_owner(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "user_roles admin insert" ON public.user_roles;
CREATE POLICY "user_roles admin insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.is_company_admin(company_id, auth.uid())
      AND public.is_company_member(company_id, user_id)
      AND (
        role <> 'admin'::app_role
        OR (public.is_company_owner(company_id, auth.uid()) AND user_id <> auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "user_roles admin update" ON public.user_roles;
CREATE POLICY "user_roles admin update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_company_admin(company_id, auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      public.is_company_admin(company_id, auth.uid())
      AND public.is_company_member(company_id, user_id)
      AND (
        role <> 'admin'::app_role
        OR (public.is_company_owner(company_id, auth.uid()) AND user_id <> auth.uid())
      )
    )
  );