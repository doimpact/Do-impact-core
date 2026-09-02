-- dm_escalations: scope reads and writes to the active company
DROP POLICY IF EXISTS "dm_esc read" ON public.dm_escalations;
CREATE POLICY "dm_esc read" ON public.dm_escalations
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "dm_escalations auth write" ON public.dm_escalations;
CREATE POLICY "dm_escalations auth write" ON public.dm_escalations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "dm_escalations auth update" ON public.dm_escalations;
CREATE POLICY "dm_escalations auth update" ON public.dm_escalations
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND company_id = public.current_company_id())
  WITH CHECK (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "dm_escalations auth delete" ON public.dm_escalations;
CREATE POLICY "dm_escalations auth delete" ON public.dm_escalations
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

-- initiatives: scope reads
DROP POLICY IF EXISTS "initiatives readable" ON public.initiatives;
CREATE POLICY "initiatives readable" ON public.initiatives
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

-- kpi_values: scope reads
DROP POLICY IF EXISTS "read kpi_values" ON public.kpi_values;
CREATE POLICY "read kpi_values" ON public.kpi_values
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

-- strategies: scope reads and writes
DROP POLICY IF EXISTS "strategy readable" ON public.strategies;
CREATE POLICY "strategy readable" ON public.strategies
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "strategies auth write" ON public.strategies;
CREATE POLICY "strategies auth write" ON public.strategies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "strategies auth update" ON public.strategies;
CREATE POLICY "strategies auth update" ON public.strategies
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND company_id = public.current_company_id())
  WITH CHECK (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "strategies auth delete" ON public.strategies;
CREATE POLICY "strategies auth delete" ON public.strategies
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND company_id = public.current_company_id());

-- profiles: limit co-member visibility to the active company only
DROP POLICY IF EXISTS "Profiles readable to self or shared company" ON public.profiles;
CREATE POLICY "Profiles readable to self or active company" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR (
      public.is_company_member(public.current_company_id(), auth.uid())
      AND public.is_company_member(public.current_company_id(), profiles.id)
    )
  );

-- proficiency_levels: global reference data, but only for actual company members
DROP POLICY IF EXISTS "proficiency_levels read" ON public.proficiency_levels;
CREATE POLICY "proficiency_levels read" ON public.proficiency_levels
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_members cm WHERE cm.user_id = auth.uid()));