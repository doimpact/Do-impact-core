DROP POLICY IF EXISTS "strategy leaders update" ON public.strategies;
DROP POLICY IF EXISTS "strategy leaders insert" ON public.strategies;
CREATE POLICY "strategy authenticated update" ON public.strategies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "strategy authenticated insert" ON public.strategies FOR INSERT TO authenticated WITH CHECK (true);