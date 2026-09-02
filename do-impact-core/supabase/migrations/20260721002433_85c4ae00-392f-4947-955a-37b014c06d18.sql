DROP POLICY IF EXISTS "workstreams leaders write" ON public.workstreams;
CREATE POLICY "workstreams auth write" ON public.workstreams FOR ALL TO authenticated USING (true) WITH CHECK (true);