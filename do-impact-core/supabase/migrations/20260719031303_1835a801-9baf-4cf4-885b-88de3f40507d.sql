DROP POLICY IF EXISTS "dm_escalations_write_leaders" ON public.dm_escalations;
DROP POLICY IF EXISTS "dm_escalations_insert" ON public.dm_escalations;
DROP POLICY IF EXISTS "dm_escalations_update" ON public.dm_escalations;
DROP POLICY IF EXISTS "dm_escalations_delete" ON public.dm_escalations;

CREATE POLICY "dm_escalations_insert" ON public.dm_escalations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dm_escalations_update" ON public.dm_escalations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dm_escalations_delete" ON public.dm_escalations FOR DELETE TO authenticated USING (true);