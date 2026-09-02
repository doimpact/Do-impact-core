DROP POLICY IF EXISTS "emp all" ON public.employees;
CREATE POLICY "emp all" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);