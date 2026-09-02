DELETE FROM public.companies WHERE name IN ('TestCo A','TestCo B','TestCo RLS 2','TestCo RLS 3','TestCo RLS');

DROP POLICY IF EXISTS "members view companies" ON public.companies;
CREATE POLICY "members view companies" ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_company_member(id, auth.uid()) OR created_by = auth.uid());