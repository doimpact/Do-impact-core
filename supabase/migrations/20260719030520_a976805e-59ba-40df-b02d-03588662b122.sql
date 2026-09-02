DROP POLICY "dm_marks insert" ON public.dm_marks;
DROP POLICY "dm_marks update" ON public.dm_marks;
DROP POLICY "dm_marks delete" ON public.dm_marks;
CREATE POLICY "dm_marks insert" ON public.dm_marks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dm_marks update" ON public.dm_marks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dm_marks delete" ON public.dm_marks FOR DELETE TO authenticated USING (true);