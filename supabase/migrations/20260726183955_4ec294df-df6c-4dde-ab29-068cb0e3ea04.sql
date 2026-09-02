DROP POLICY IF EXISTS "a3 insert" ON public.a3_reports;
CREATE POLICY "a3 insert" ON public.a3_reports
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "cal insert" ON public.calendar_events;
CREATE POLICY "cal insert" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "dm_esc insert" ON public.dm_escalations;
CREATE POLICY "dm_esc insert" ON public.dm_escalations
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'leader'::app_role))
  );