-- employees: keep company-wide read, restrict writes to admins/leaders/company owners
DROP POLICY IF EXISTS employees_company_all ON public.employees;

CREATE POLICY employees_company_read ON public.employees
FOR SELECT TO authenticated
USING (company_id = public.current_company_id());

CREATE POLICY employees_admin_insert ON public.employees
FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.current_company_id()
  AND (
    public.is_company_admin(company_id, auth.uid())
    OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
    OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)
  )
);

CREATE POLICY employees_admin_update ON public.employees
FOR UPDATE TO authenticated
USING (
  company_id = public.current_company_id()
  AND (
    public.is_company_admin(company_id, auth.uid())
    OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
    OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)
  )
)
WITH CHECK (
  company_id = public.current_company_id()
  AND (
    public.is_company_admin(company_id, auth.uid())
    OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
    OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)
  )
);

CREATE POLICY employees_admin_delete ON public.employees
FOR DELETE TO authenticated
USING (
  company_id = public.current_company_id()
  AND (
    public.is_company_admin(company_id, auth.uid())
    OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
    OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)
  )
);

-- employees: hard tenant guard
DROP POLICY IF EXISTS employees_company_scope ON public.employees;
CREATE POLICY employees_company_scope ON public.employees
AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = public.current_company_id())
WITH CHECK (company_id = public.current_company_id());

-- restructuring_members: ensure restrictive company-scope guard exists
DROP POLICY IF EXISTS restructuring_members_company_scope ON public.restructuring_members;
CREATE POLICY restructuring_members_company_scope ON public.restructuring_members
AS RESTRICTIVE FOR ALL TO authenticated
USING (company_id = public.current_company_id())
WITH CHECK (company_id = public.current_company_id());