DROP POLICY IF EXISTS "user_roles read own in company" ON public.user_roles;
CREATE POLICY "user_roles read in company"
  ON public.user_roles FOR SELECT TO authenticated
  USING (company_id = public.current_company_id()
         AND public.is_company_member(company_id, auth.uid()));