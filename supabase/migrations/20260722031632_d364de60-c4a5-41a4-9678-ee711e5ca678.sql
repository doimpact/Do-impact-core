
DO $mig$
DECLARE
  t text;
  tables text[] := ARRAY[
    'a3_reports','accounts','booked_backlog','calendar_events','capex_milestones','capex_projects',
    'capex_value_realization','cash_flow_settings','cash_flow_weeks','certifications','contacts','contracts',
    'copq_entries','development_plans','dm_escalations','dm_marks','employee_skills','employees',
    'growth_targets','hoshin_correlations','hoshin_items','initiatives','interactions','job_roles',
    'kpi_values','kpis','meeting_notes','npi_gate_checklist','npi_projects','npi_risks',
    'objective_actions','objective_kpi_values','objective_kpis','objective_monthly_benefits','opportunities',
    'opportunity_monthly_values','org_settings','part_margins','pillar_notes','pillars','quotes',
    'restructuring_items','restructuring_members','restructuring_projects','review_notes','reviews',
    'role_requirements','shop_floor_gates','shop_floor_lines','shop_floor_parts','siop_capacity',
    'siop_cycles','siop_decisions','siop_demand','siop_kpis','siop_long_lead_materials','siop_osp_jobs',
    'siop_scenarios','skill_categories','skills','stakeholder_touchpoints','strategic_objectives',
    'strategic_themes','strategies','sub_pillars','tasks','training_actions','working_capital_items',
    'working_capital_kpis','workstreams'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET DEFAULT public.current_company_id()', t);
  END LOOP;
END $mig$;
