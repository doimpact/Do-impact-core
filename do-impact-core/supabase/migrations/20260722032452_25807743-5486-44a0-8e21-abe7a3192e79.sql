
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS archived_at timestamptz;

DROP POLICY IF EXISTS "owners update companies" ON public.companies;
DROP POLICY IF EXISTS "owners delete companies" ON public.companies;

CREATE POLICY "owners update companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.is_company_admin(id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_company_admin(id, auth.uid()) OR created_by = auth.uid());

CREATE POLICY "owners delete companies" ON public.companies
  FOR DELETE TO authenticated
  USING (public.is_company_admin(id, auth.uid()) OR created_by = auth.uid());
