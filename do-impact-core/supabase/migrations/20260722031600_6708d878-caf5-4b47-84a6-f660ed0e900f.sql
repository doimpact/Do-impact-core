
-- =========================================================================
-- 1. Companies, members, active-company tables
-- =========================================================================

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TYPE public.company_role AS ENUM ('owner','admin','member');

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_active_company (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_active_company TO authenticated;
GRANT ALL ON public.user_active_company TO service_role;
ALTER TABLE public.user_active_company ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 2. Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.is_company_member(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.company_members
                 WHERE company_id=_company AND user_id=_user);
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.company_members
                 WHERE company_id=_company AND user_id=_user
                   AND role IN ('owner','admin'));
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT company_id FROM public.user_active_company WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.tg_set_company_id()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_company_id();
  END IF;
  RETURN NEW;
END; $$;

-- Auto-bootstrap: creator becomes owner + active company
CREATE OR REPLACE FUNCTION public.tg_company_bootstrap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.company_members(company_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (company_id, user_id) DO NOTHING;

    INSERT INTO public.user_active_company(user_id, company_id)
    VALUES (NEW.created_by, NEW.id)
    ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id, updated_at = now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER company_bootstrap
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.tg_company_bootstrap();

-- =========================================================================
-- 3. Policies on the new tables
-- =========================================================================

CREATE POLICY "members view companies" ON public.companies
  FOR SELECT TO authenticated USING (public.is_company_member(id, auth.uid()));
CREATE POLICY "signed-in can create company" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "admins update company" ON public.companies
  FOR UPDATE TO authenticated USING (public.is_company_admin(id, auth.uid()))
  WITH CHECK (public.is_company_admin(id, auth.uid()));
CREATE POLICY "owners delete company" ON public.companies
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_members
             WHERE company_id=companies.id AND user_id=auth.uid() AND role='owner')
  );

CREATE POLICY "members view members" ON public.company_members
  FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "admins add members" ON public.company_members
  FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(company_id, auth.uid()));
CREATE POLICY "admins update members" ON public.company_members
  FOR UPDATE TO authenticated USING (public.is_company_admin(company_id, auth.uid()))
  WITH CHECK (public.is_company_admin(company_id, auth.uid()));
CREATE POLICY "admins remove members" ON public.company_members
  FOR DELETE TO authenticated USING (public.is_company_admin(company_id, auth.uid()));

CREATE POLICY "self manage active" ON public.user_active_company
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_company_member(company_id, auth.uid()));

-- =========================================================================
-- 4. Backfill + add company_id to every business table
-- =========================================================================

DO $mig$
DECLARE
  default_id uuid;
  t text;
  u uuid;
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
  -- Default company for backfill (bypass bootstrap trigger since created_by is NULL,
  -- then wire memberships manually below)
  INSERT INTO public.companies(name, slug, created_by)
  VALUES ('Default', 'default', NULL)
  RETURNING id INTO default_id;

  -- Every existing auth user becomes owner + gets active company set
  FOR u IN SELECT id FROM auth.users LOOP
    INSERT INTO public.company_members(company_id, user_id, role)
    VALUES (default_id, u, 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_active_company(user_id, company_id)
    VALUES (u, default_id) ON CONFLICT (user_id) DO NOTHING;
  END LOOP;

  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid', t);
    EXECUTE format('UPDATE public.%I SET company_id = %L WHERE company_id IS NULL', t, default_id);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET NOT NULL', t);
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE',
                     t, t || '_company_id_fkey');
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(company_id)',
                   t || '_company_id_idx', t);

    -- Restrictive tenant-scope policy (ANDs with existing permissive policies)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL '
      'USING (company_id = public.current_company_id()) '
      'WITH CHECK (company_id = public.current_company_id())',
      t || '_company_scope', t);

    -- Auto-fill company_id on insert from user's active company
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id()',
      'set_company_id_' || t, t);
  END LOOP;
END $mig$;

-- updated_at trigger on companies
CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
