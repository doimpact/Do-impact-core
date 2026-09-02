
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'capex_milestones','capex_projects','certifications','development_plans',
  'employee_skills','employees','hoshin_correlations','hoshin_items','job_roles',
  'objective_actions','objective_kpi_values','objective_kpis',
  'objective_monthly_benefits','proficiency_levels','restructuring_items',
  'role_requirements','shop_floor_gates','shop_floor_lines','shop_floor_parts',
  'siop_capacity','siop_cycles','siop_decisions','siop_demand','siop_kpis',
  'siop_scenarios','skill_categories','skills','training_actions'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS "%1$s auth read" ON public.%1$I;
      CREATE POLICY "%1$s auth read" ON public.%1$I
        FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
    $f$, t);
  END LOOP;
END $$;
