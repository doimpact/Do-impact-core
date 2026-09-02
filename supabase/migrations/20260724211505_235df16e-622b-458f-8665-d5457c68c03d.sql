DO $$
DECLARE
  t text;
  p record;
  tables text[] := ARRAY[
    'accounts','contacts','employees',
    'capex_projects','capex_milestones','capex_value_realization',
    'certifications','development_plans','employee_skills','job_roles','role_requirements','skill_categories','skills','training_actions',
    'dm_marks',
    'hoshin_items','hoshin_correlations',
    'objective_actions','objective_kpis','objective_kpi_values','objective_monthly_benefits',
    'opportunity_monthly_values',
    'pillars',
    'shop_floor_gates','shop_floor_lines','shop_floor_parts',
    'siop_capacity','siop_cycles','siop_decisions','siop_demand','siop_kpis','siop_long_lead_materials','siop_osp_jobs','siop_scenarios',
    'strategic_objectives','strategic_themes','workstreams'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO authenticated USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id())',
      t || '_company_all', t
    );
  END LOOP;
END $$;