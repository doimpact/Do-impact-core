
-- Tighten permissive RLS write policies: require an authenticated user
-- instead of USING (true) / WITH CHECK (true). Preserves shared-team editing
-- semantics (any signed-in user can write) while closing anon-write exposure
-- flagged by the Supabase linter.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname='public'
      AND cmd <> 'SELECT'
      AND (qual = 'true' OR with_check = 'true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Reusable helper: signed in?
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Recreate an "authenticated can write" policy on every table listed above.
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'capex_milestones','capex_projects','capex_value_realization','certifications',
  'development_plans','dm_escalations','dm_marks','employee_skills','employees',
  'hoshin_correlations','hoshin_items','job_roles','kpis','objective_actions',
  'objective_kpi_values','objective_kpis','objective_monthly_benefits',
  'opportunity_monthly_values','pillars','proficiency_levels','restructuring_items',
  'role_requirements','shop_floor_gates','shop_floor_lines','shop_floor_parts',
  'siop_capacity','siop_cycles','siop_decisions','siop_demand','siop_kpis',
  'siop_scenarios','skill_categories','skills','strategic_objectives',
  'strategic_themes','strategies','training_actions','workstreams'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format($f$
      CREATE POLICY "%1$s auth write" ON public.%1$I
        FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
      CREATE POLICY "%1$s auth update" ON public.%1$I
        FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
      CREATE POLICY "%1$s auth delete" ON public.%1$I
        FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
    $f$, t);
  END LOOP;
END $$;

-- Ensure has_role remains executable by authenticated users (fixes prior
-- "permission denied for function has_role" reports).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authenticated() TO authenticated;
