DROP POLICY IF EXISTS "manage kpis" ON public.kpis;
CREATE POLICY "authenticated manage kpis" ON public.kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);