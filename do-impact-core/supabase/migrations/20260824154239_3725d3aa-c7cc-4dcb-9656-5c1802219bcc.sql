CREATE TABLE public.bcm_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  department text,
  process text NOT NULL,
  process_owner text,
  customers_affected text,
  employees_required text,
  equipment_required text,
  it_systems text,
  utilities text,
  materials text,
  critical_suppliers text,
  minimum_operating_level text,
  mtd_hours numeric,
  rto_hours numeric,
  rpo_hours numeric,
  business_impact text,
  quality_regulatory_impact text,
  dependencies text,
  single_point_of_failure text,
  current_backup text,
  additional_actions text,
  criticality text NOT NULL DEFAULT 'high',
  bia_complete boolean NOT NULL DEFAULT false,
  recovery_plan_complete boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcm_processes_crit_chk CHECK (criticality IN ('critical','high','medium','low'))
);

CREATE TABLE public.bcm_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  ref text,
  risk text NOT NULL,
  category text NOT NULL DEFAULT 'facility',
  department text,
  cause text,
  consequence text,
  process_id uuid REFERENCES public.bcm_processes(id) ON DELETE SET NULL,
  affected_process text,
  likelihood integer NOT NULL DEFAULT 3,
  impact integer NOT NULL DEFAULT 3,
  risk_score integer,
  existing_controls text,
  preventive_action text,
  recovery_action text,
  owner_name text,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  residual_risk text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcm_risks_like_chk CHECK (likelihood BETWEEN 1 AND 5),
  CONSTRAINT bcm_risks_impact_chk CHECK (impact BETWEEN 1 AND 5),
  CONSTRAINT bcm_risks_status_chk CHECK (status IN ('open','in_progress','mitigated','closed')),
  CONSTRAINT bcm_risks_cat_chk CHECK (category IN ('facility','utilities','equipment','supply_chain','people','technology','quality'))
);

CREATE TABLE public.bcm_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  asset_kind text NOT NULL,
  name text NOT NULL,
  department text,
  process text,
  criticality text NOT NULL DEFAULT 'high',
  has_backup_strategy boolean NOT NULL DEFAULT false,
  recovery_strategy text,
  recovery_time_hours numeric,
  rpo_hours numeric,
  last_tested date,
  notes text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcm_assets_kind_chk CHECK (asset_kind IN ('equipment','supplier','skill','it_system')),
  CONSTRAINT bcm_assets_crit_chk CHECK (criticality IN ('critical','high','medium','low'))
);

CREATE TABLE public.bcm_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  ref text,
  title text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  activation_level integer NOT NULL DEFAULT 1,
  incident_commander text,
  location text,
  description text,
  safety_impact text,
  facility_impact text,
  equipment_impact text,
  it_impact text,
  production_impact text,
  supply_chain_impact text,
  customer_impact text,
  environmental_impact text,
  immediate_actions text,
  decisions text,
  communications text,
  recovery_actions text,
  final_resolution text,
  lessons_learned text,
  status text NOT NULL DEFAULT 'open',
  recovery_hours numeric,
  closed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcm_incidents_level_chk CHECK (activation_level BETWEEN 0 AND 4),
  CONSTRAINT bcm_incidents_status_chk CHECK (status IN ('open','recovering','closed'))
);

CREATE TABLE public.bcm_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  title text NOT NULL,
  exercise_type text NOT NULL DEFAULT 'tabletop',
  exercise_date date NOT NULL DEFAULT current_date,
  scenario text,
  objectives text,
  participants text,
  expected_actions text,
  actual_actions text,
  what_worked text,
  what_failed text,
  lessons_learned text,
  next_exercise date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcm_exercises_type_chk CHECK (exercise_type IN ('tabletop','functional','simulation'))
);

CREATE TABLE public.bcm_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_kind text NOT NULL DEFAULT 'risk',
  risk_id uuid REFERENCES public.bcm_risks(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES public.bcm_incidents(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.bcm_exercises(id) ON DELETE CASCADE,
  action text NOT NULL,
  owner_name text,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bcm_actions_src_chk CHECK (source_kind IN ('risk','incident','exercise')),
  CONSTRAINT bcm_actions_status_chk CHECK (status IN ('open','in_progress','done'))
);

CREATE INDEX idx_bcm_processes_company ON public.bcm_processes(company_id);
CREATE INDEX idx_bcm_risks_company ON public.bcm_risks(company_id);
CREATE INDEX idx_bcm_assets_company ON public.bcm_assets(company_id, asset_kind);
CREATE INDEX idx_bcm_incidents_company ON public.bcm_incidents(company_id, occurred_at DESC);
CREATE INDEX idx_bcm_exercises_company ON public.bcm_exercises(company_id, exercise_date DESC);
CREATE INDEX idx_bcm_actions_company ON public.bcm_actions(company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcm_processes TO authenticated;
GRANT ALL ON public.bcm_processes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcm_risks TO authenticated;
GRANT ALL ON public.bcm_risks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcm_assets TO authenticated;
GRANT ALL ON public.bcm_assets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcm_incidents TO authenticated;
GRANT ALL ON public.bcm_incidents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcm_exercises TO authenticated;
GRANT ALL ON public.bcm_exercises TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bcm_actions TO authenticated;
GRANT ALL ON public.bcm_actions TO service_role;

ALTER TABLE public.bcm_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bcm_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bcm_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bcm_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bcm_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bcm_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bcm_processes','bcm_risks','bcm_assets','bcm_incidents','bcm_exercises','bcm_actions'] LOOP
    EXECUTE format('CREATE POLICY "Company members can view %1$s" ON public.%1$I FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Company members can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Company members can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid())) WITH CHECK (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Company members can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "%1$s_company_scope" ON public.%1$I AS RESTRICTIVE TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())', t);
    EXECUTE format('CREATE TRIGGER %1$s_set_company BEFORE INSERT ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id()', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
    EXECUTE format('CREATE TRIGGER %1$s_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()', t);
    EXECUTE format('CREATE TRIGGER %1$s_template_lock BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.tg_bcm_risk_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.risk_score := COALESCE(NEW.likelihood,0) * COALESCE(NEW.impact,0);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.tg_bcm_risk_score() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER bcm_risks_score BEFORE INSERT OR UPDATE ON public.bcm_risks FOR EACH ROW EXECUTE FUNCTION public.tg_bcm_risk_score();