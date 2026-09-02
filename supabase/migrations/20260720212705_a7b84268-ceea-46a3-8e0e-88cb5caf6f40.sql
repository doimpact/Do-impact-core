
-- Enums
CREATE TYPE public.capex_strategic_objective AS ENUM ('operational_efficiency','capacity_scaling','supply_chain_resilience','sustainability_compliance','safety_quality','other');
CREATE TYPE public.capex_stage AS ENUM ('request','approval','procurement','installation','validation','closed');
CREATE TYPE public.capex_status AS ENUM ('not_started','in_progress','on_hold','at_risk','blocked','done');
CREATE TYPE public.capex_health AS ENUM ('green','yellow','red');

-- Sequence for numbering
CREATE SEQUENCE public.capex_seq START 1;

-- Projects
CREATE TABLE public.capex_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  number text UNIQUE,
  title text NOT NULL,
  description text,
  strategic_objective public.capex_strategic_objective NOT NULL DEFAULT 'operational_efficiency',
  category text,
  business_unit text,
  -- Gate 1 business case
  total_cost numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  expected_annual_savings numeric(14,2) NOT NULL DEFAULT 0,
  expected_annual_revenue numeric(14,2) NOT NULL DEFAULT 0,
  payback_months numeric(8,2),
  irr_pct numeric(6,2),
  npv numeric(14,2),
  risk_summary text,
  -- Gate 2 scoring
  score_strategic_fit smallint NOT NULL DEFAULT 0 CHECK (score_strategic_fit BETWEEN 0 AND 5),
  score_throughput smallint NOT NULL DEFAULT 0 CHECK (score_throughput BETWEEN 0 AND 5),
  score_quality_defect smallint NOT NULL DEFAULT 0 CHECK (score_quality_defect BETWEEN 0 AND 5),
  score_safety smallint NOT NULL DEFAULT 0 CHECK (score_safety BETWEEN 0 AND 5),
  score_sustainability smallint NOT NULL DEFAULT 0 CHECK (score_sustainability BETWEEN 0 AND 5),
  score_financial smallint NOT NULL DEFAULT 0 CHECK (score_financial BETWEEN 0 AND 5),
  total_score smallint GENERATED ALWAYS AS (
    score_strategic_fit + score_throughput + score_quality_defect + score_safety + score_sustainability + score_financial
  ) STORED,
  -- Gate 3 execution
  stage public.capex_stage NOT NULL DEFAULT 'request',
  status public.capex_status NOT NULL DEFAULT 'not_started',
  health public.capex_health NOT NULL DEFAULT 'green',
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  approved_at date,
  procurement_start date,
  install_start date,
  validation_start date,
  closed_at date,
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  committed_cost numeric(14,2) NOT NULL DEFAULT 0,
  actual_cost numeric(14,2) NOT NULL DEFAULT 0,
  -- Gate 4 audit
  audit_due_date date,
  audit_completed_at date,
  audit_realized_savings numeric(14,2),
  audit_benefit_realization_pct numeric(6,2),
  audit_notes text,
  -- Lifecycle
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.capex_projects TO authenticated;
GRANT ALL ON public.capex_projects TO service_role;
GRANT USAGE ON SEQUENCE public.capex_seq TO authenticated, service_role;
ALTER TABLE public.capex_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage capex projects" ON public.capex_projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_capex_projects_updated_at
  BEFORE UPDATE ON public.capex_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_capex_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number := 'CAPEX-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.capex_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_capex_number
  BEFORE INSERT ON public.capex_projects
  FOR EACH ROW EXECUTE FUNCTION public.tg_capex_number();

-- Milestones
CREATE TABLE public.capex_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capex_id uuid NOT NULL REFERENCES public.capex_projects(id) ON DELETE CASCADE,
  gate public.capex_stage NOT NULL DEFAULT 'approval',
  title text NOT NULL,
  due_date date,
  completed_at date,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.capex_milestones TO authenticated;
GRANT ALL ON public.capex_milestones TO service_role;
ALTER TABLE public.capex_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage capex milestones" ON public.capex_milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_capex_milestones_updated_at
  BEFORE UPDATE ON public.capex_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_capex_milestones_capex ON public.capex_milestones(capex_id);
CREATE INDEX idx_capex_projects_stage ON public.capex_projects(stage) WHERE archived_at IS NULL;
