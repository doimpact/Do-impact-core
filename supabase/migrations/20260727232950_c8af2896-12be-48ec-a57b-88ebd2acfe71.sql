-- 1. A3 update: explicit company scoping
DROP POLICY IF EXISTS "a3 update" ON public.a3_reports;
CREATE POLICY "a3 update" ON public.a3_reports
FOR UPDATE TO authenticated
USING (
  company_id = public.current_company_id()
  AND (owner_id = auth.uid() OR created_by = auth.uid()
       OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
       OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role))
)
WITH CHECK (
  company_id = public.current_company_id()
  AND (owner_id = auth.uid() OR created_by = auth.uid()
       OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
       OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role))
);

-- 2. Employees restrictive scope -> public role
DROP POLICY IF EXISTS "employees_company_scope" ON public.employees;
CREATE POLICY "employees_company_scope" ON public.employees
AS RESTRICTIVE FOR ALL TO public
USING (company_id = public.current_company_id())
WITH CHECK (company_id = public.current_company_id());

-- 3. Tasks delete: explicit company scoping
DROP POLICY IF EXISTS "delete tasks" ON public.tasks;
CREATE POLICY "delete tasks" ON public.tasks
FOR DELETE TO authenticated
USING (
  company_id = public.current_company_id()
  AND (created_by = auth.uid()
       OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
       OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role))
);

-- 4. Template write protection on every company-scoped table
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
     AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public' AND c.column_name = 'company_id'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_template_write ON public.%I', t.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()',
      t.table_name);
  END LOOP;
END $$;