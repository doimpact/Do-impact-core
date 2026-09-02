-- 1. demo_leads: writes only via server-side service role
REVOKE INSERT, UPDATE, DELETE ON public.demo_leads FROM anon, authenticated;
REVOKE SELECT ON public.demo_leads FROM anon;
GRANT ALL ON public.demo_leads TO service_role;

-- 2. restructuring_members: reads company-wide, writes admins/owners only
DROP POLICY IF EXISTS "restructuring_members company write" ON public.restructuring_members;
DROP POLICY IF EXISTS "restructuring_members_company_scope" ON public.restructuring_members;

CREATE POLICY "restructuring_members admin insert"
ON public.restructuring_members FOR INSERT TO authenticated
WITH CHECK (company_id = current_company_id() AND (is_company_admin(company_id, auth.uid()) OR is_company_owner(company_id, auth.uid()) OR is_super_admin(auth.uid())));

CREATE POLICY "restructuring_members admin update"
ON public.restructuring_members FOR UPDATE TO authenticated
USING (company_id = current_company_id() AND (is_company_admin(company_id, auth.uid()) OR is_company_owner(company_id, auth.uid()) OR is_super_admin(auth.uid())))
WITH CHECK (company_id = current_company_id() AND (is_company_admin(company_id, auth.uid()) OR is_company_owner(company_id, auth.uid()) OR is_super_admin(auth.uid())));

CREATE POLICY "restructuring_members admin delete"
ON public.restructuring_members FOR DELETE TO authenticated
USING (company_id = current_company_id() AND (is_company_admin(company_id, auth.uid()) OR is_company_owner(company_id, auth.uid()) OR is_super_admin(auth.uid())));

-- 3. user_roles: block admins from editing their own role row (no self-promotion)
DROP POLICY IF EXISTS "user_roles admin insert" ON public.user_roles;
CREATE POLICY "user_roles admin insert"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    is_company_admin(company_id, auth.uid())
    AND is_company_member(company_id, user_id)
    AND user_id <> auth.uid()
    AND (role <> 'admin'::app_role OR is_company_owner(company_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "user_roles admin update" ON public.user_roles;
CREATE POLICY "user_roles admin update"
ON public.user_roles FOR UPDATE TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (is_company_admin(company_id, auth.uid()) AND user_id <> auth.uid())
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    is_company_admin(company_id, auth.uid())
    AND is_company_member(company_id, user_id)
    AND user_id <> auth.uid()
    AND (role <> 'admin'::app_role OR is_company_owner(company_id, auth.uid()))
  )
);

DROP POLICY IF EXISTS "user_roles admin delete" ON public.user_roles;
CREATE POLICY "user_roles admin delete"
ON public.user_roles FOR DELETE TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (is_company_admin(company_id, auth.uid()) AND user_id <> auth.uid())
);
