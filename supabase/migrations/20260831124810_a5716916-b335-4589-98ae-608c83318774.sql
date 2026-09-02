-- Defense in depth: employees SELECT policy must verify caller is an active company member,
-- not just that company_id matches current_company_id().
DROP POLICY IF EXISTS employees_company_read ON public.employees;
CREATE POLICY employees_company_read ON public.employees
FOR SELECT TO authenticated
USING (
  company_id = current_company_id()
  AND (is_company_member(company_id, auth.uid()) OR is_super_admin(auth.uid()))
);
