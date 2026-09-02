-- 1. dm_escalations: remove broad any-authenticated write policies
DROP POLICY IF EXISTS "dm_escalations auth write" ON public.dm_escalations;
DROP POLICY IF EXISTS "dm_escalations auth update" ON public.dm_escalations;
DROP POLICY IF EXISTS "dm_escalations auth delete" ON public.dm_escalations;

DROP POLICY IF EXISTS "dm_esc insert" ON public.dm_escalations;
CREATE POLICY "dm_esc insert" ON public.dm_escalations
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  );

DROP POLICY IF EXISTS "dm_esc update" ON public.dm_escalations;
CREATE POLICY "dm_esc update" ON public.dm_escalations
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  )
  WITH CHECK (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  );

DROP POLICY IF EXISTS "dm_esc delete" ON public.dm_escalations;
CREATE POLICY "dm_esc delete" ON public.dm_escalations
  FOR DELETE TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  );

-- 2. strategies: require an elevated role for writes
DROP POLICY IF EXISTS "strategies auth write" ON public.strategies;
DROP POLICY IF EXISTS "strategies auth update" ON public.strategies;
DROP POLICY IF EXISTS "strategies auth delete" ON public.strategies;
DROP POLICY IF EXISTS "strategy admins delete" ON public.strategies;

CREATE POLICY "strategies elevated insert" ON public.strategies
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  );

CREATE POLICY "strategies elevated update" ON public.strategies
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  )
  WITH CHECK (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  );

CREATE POLICY "strategies elevated delete" ON public.strategies
  FOR DELETE TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'leader'::public.app_role)
      OR public.is_company_admin(public.current_company_id(), auth.uid())
    )
  );

-- 3. calendar_events: pin created_by to the caller on insert
DROP POLICY IF EXISTS "cal insert" ON public.calendar_events;
CREATE POLICY "cal insert" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND created_by = auth.uid()
  );