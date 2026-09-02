
-- Enums
DO $$ BEGIN
  CREATE TYPE public.consolidation_status AS ENUM ('planning','approved','in_progress','complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.consolidation_bucket AS ENUM ('fixed','variable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.consolidation_transition_cat AS ENUM ('direct_transfer','double_running','pmo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.consolidation_phase_status AS ENUM ('not_started','in_progress','done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Projects
CREATE TABLE public.consolidation_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  from_site_a text,
  from_site_b text,
  to_site text,
  target_go_live date,
  status public.consolidation_status NOT NULL DEFAULT 'planning',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consolidation_projects TO authenticated;
GRANT ALL ON public.consolidation_projects TO service_role;
ALTER TABLE public.consolidation_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY consolidation_projects_member_all ON public.consolidation_projects
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_consolidation_projects_company BEFORE INSERT ON public.consolidation_projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER trg_consolidation_projects_updated BEFORE UPDATE ON public.consolidation_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Baseline costs
CREATE TABLE public.consolidation_baseline_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.consolidation_projects(id) ON DELETE CASCADE,
  bucket public.consolidation_bucket NOT NULL,
  category text NOT NULL,
  as_is_annual numeric NOT NULL DEFAULT 0,
  to_be_annual numeric NOT NULL DEFAULT 0,
  note text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consolidation_baseline_costs TO authenticated;
GRANT ALL ON public.consolidation_baseline_costs TO service_role;
ALTER TABLE public.consolidation_baseline_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY consolidation_baseline_member_all ON public.consolidation_baseline_costs
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_consolidation_baseline_company BEFORE INSERT ON public.consolidation_baseline_costs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER trg_consolidation_baseline_updated BEFORE UPDATE ON public.consolidation_baseline_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Transition costs
CREATE TABLE public.consolidation_transition_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.consolidation_projects(id) ON DELETE CASCADE,
  category public.consolidation_transition_cat NOT NULL,
  label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  note text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consolidation_transition_costs TO authenticated;
GRANT ALL ON public.consolidation_transition_costs TO service_role;
ALTER TABLE public.consolidation_transition_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY consolidation_transition_member_all ON public.consolidation_transition_costs
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_consolidation_transition_company BEFORE INSERT ON public.consolidation_transition_costs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER trg_consolidation_transition_updated BEFORE UPDATE ON public.consolidation_transition_costs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Phases
CREATE TABLE public.consolidation_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.consolidation_projects(id) ON DELETE CASCADE,
  sort_order smallint NOT NULL,
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.consolidation_phase_status NOT NULL DEFAULT 'not_started',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consolidation_phases TO authenticated;
GRANT ALL ON public.consolidation_phases TO service_role;
ALTER TABLE public.consolidation_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY consolidation_phases_member_all ON public.consolidation_phases
  FOR ALL USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_consolidation_phases_company BEFORE INSERT ON public.consolidation_phases
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER trg_consolidation_phases_updated BEFORE UPDATE ON public.consolidation_phases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed 5 phases automatically for each new project
CREATE OR REPLACE FUNCTION public.tg_consolidation_seed_phases()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  phases text[][] := ARRAY[
    ARRAY['Baseline & Layout Design','Audit both sites to lock in exact fixed and variable costs. Map out the value streams for the new site to ensure it has the floor space and capacity to absorb all incoming volume.'],
    ARRAY['Financial Approval','Combine your transition costs and divide them by your annual recurring savings. If the payback period fits your company target (typically 2 to 3 years), secure board approval.'],
    ARRAY['Buffer Build & Preparation','Begin building safety stock to cover the planned production downtime. Inform key customers and regulatory authorities, and lock in retention agreements with critical staff.'],
    ARRAY['Wave-Based Relocation','Move equipment in staggered product line waves, starting with lower-risk lines. For each line: build stock, tear down, ship, re-install, re-qualify, and hand over to production.'],
    ARRAY['Decommissioning & Savings Realization','Complete final shutdown of the old facility, hand back the keys or sell the property, and audit the new site to confirm actual operational savings match the baseline model.']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(phases,1) LOOP
    INSERT INTO public.consolidation_phases (company_id, project_id, sort_order, name, description)
    VALUES (NEW.company_id, NEW.id, i, phases[i][1], phases[i][2]);
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_consolidation_projects_seed AFTER INSERT ON public.consolidation_projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_consolidation_seed_phases();
