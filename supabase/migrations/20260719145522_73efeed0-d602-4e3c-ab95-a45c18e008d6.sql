DROP POLICY IF EXISTS "jr all" ON public.job_roles;
CREATE POLICY "jr all" ON public.job_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "rr all" ON public.role_requirements;
CREATE POLICY "rr all" ON public.role_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);