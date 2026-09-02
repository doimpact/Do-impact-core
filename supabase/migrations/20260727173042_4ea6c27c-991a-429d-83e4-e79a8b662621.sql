DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'consolidation_pnl_entries','consolidation_baseline_costs','consolidation_monthly_entries',
    'consolidation_phases','consolidation_projects','consolidation_transition_costs',
    'vsm_maps','vsm_steps','vsm_inventories','vsm_info_flows',
    'toc_analyses','toc_candidates','toc_steps',
    'journey_maps','journey_stages','journey_pain_points',
    'ibp_cycles','ibp_gaps','ibp_steps',
    'cld_diagrams','hoshin_reviews',
    'problem_plans','problem_plan_steps','problem_step_actions'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_company_scope', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO public USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id())',
      t || '_company_scope', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "restructuring_members_company_scope" ON public.restructuring_members;
CREATE POLICY "restructuring_members_company_scope"
ON public.restructuring_members AS RESTRICTIVE FOR ALL TO public
USING (company_id = public.current_company_id())
WITH CHECK (company_id = public.current_company_id());