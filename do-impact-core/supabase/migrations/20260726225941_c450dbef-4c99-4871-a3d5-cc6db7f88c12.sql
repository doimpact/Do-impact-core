DROP POLICY IF EXISTS "a3 delete" ON public.a3_reports;
CREATE POLICY "a3 delete" ON public.a3_reports FOR DELETE TO authenticated
USING (
  company_id = public.current_company_id()
  AND (created_by = auth.uid() OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role))
);

DROP POLICY IF EXISTS "cal delete" ON public.calendar_events;
CREATE POLICY "cal delete" ON public.calendar_events FOR DELETE TO authenticated
USING (
  company_id = public.current_company_id()
  AND (
    auth.uid() = created_by
    OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)
    OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)
  )
);

DROP POLICY IF EXISTS "create tasks" ON public.tasks;
CREATE POLICY "create tasks" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.current_company_id()
  AND auth.uid() = created_by
);