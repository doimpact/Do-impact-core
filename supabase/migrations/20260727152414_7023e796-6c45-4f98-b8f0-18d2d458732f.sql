-- ============ Theory of Constraints ============
CREATE TABLE public.toc_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.problem_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  system_scope text,
  constraint_name text,
  throughput numeric,
  inventory numeric,
  operating_expense numeric,
  c2c_baseline numeric,
  c2c_target numeric,
  c2c_current numeric,
  buffer_notes text,
  dbr_notes text,
  policy_constraints jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.toc_analyses TO authenticated;
GRANT ALL ON public.toc_analyses TO service_role;
ALTER TABLE public.toc_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY toc_analyses_company_all ON public.toc_analyses FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER toc_analyses_set_company BEFORE INSERT ON public.toc_analyses FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER toc_analyses_updated_at BEFORE UPDATE ON public.toc_analyses FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.toc_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_id uuid NOT NULL REFERENCES public.toc_analyses(id) ON DELETE CASCADE,
  name text NOT NULL,
  load_pct numeric,
  capacity_note text,
  is_constraint boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.toc_candidates TO authenticated;
GRANT ALL ON public.toc_candidates TO service_role;
ALTER TABLE public.toc_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY toc_candidates_company_all ON public.toc_candidates FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER toc_candidates_set_company BEFORE INSERT ON public.toc_candidates FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER toc_candidates_updated_at BEFORE UPDATE ON public.toc_candidates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.toc_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  analysis_id uuid NOT NULL REFERENCES public.toc_analyses(id) ON DELETE CASCADE,
  step smallint NOT NULL DEFAULT 1,
  title text NOT NULL,
  description text,
  owner_id uuid,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.toc_steps TO authenticated;
GRANT ALL ON public.toc_steps TO service_role;
ALTER TABLE public.toc_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY toc_steps_company_all ON public.toc_steps FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER toc_steps_set_company BEFORE INSERT ON public.toc_steps FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER toc_steps_updated_at BEFORE UPDATE ON public.toc_steps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Causal Loop Diagrams ============
CREATE TABLE public.cld_diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.problem_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  loop_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cld_diagrams TO authenticated;
GRANT ALL ON public.cld_diagrams TO service_role;
ALTER TABLE public.cld_diagrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY cld_diagrams_company_all ON public.cld_diagrams FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER cld_diagrams_set_company BEFORE INSERT ON public.cld_diagrams FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER cld_diagrams_updated_at BEFORE UPDATE ON public.cld_diagrams FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Integrated Business Planning ============
CREATE TABLE public.ibp_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.problem_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  cycle_month date,
  horizon_months integer NOT NULL DEFAULT 18,
  notes text,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ibp_cycles TO authenticated;
GRANT ALL ON public.ibp_cycles TO service_role;
ALTER TABLE public.ibp_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ibp_cycles_company_all ON public.ibp_cycles FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER ibp_cycles_set_company BEFORE INSERT ON public.ibp_cycles FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER ibp_cycles_updated_at BEFORE UPDATE ON public.ibp_cycles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ibp_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.ibp_cycles(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  owner_id uuid,
  meeting_date date,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  decisions text,
  assumptions text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ibp_steps TO authenticated;
GRANT ALL ON public.ibp_steps TO service_role;
ALTER TABLE public.ibp_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY ibp_steps_company_all ON public.ibp_steps FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER ibp_steps_set_company BEFORE INSERT ON public.ibp_steps FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER ibp_steps_updated_at BEFORE UPDATE ON public.ibp_steps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ibp_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.ibp_cycles(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'gap',
  label text NOT NULL,
  month date,
  demand_val numeric,
  supply_val numeric,
  financial_val numeric,
  lead_time_weeks numeric,
  risk text,
  owner_id uuid,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ibp_gaps TO authenticated;
GRANT ALL ON public.ibp_gaps TO service_role;
ALTER TABLE public.ibp_gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY ibp_gaps_company_all ON public.ibp_gaps FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER ibp_gaps_set_company BEFORE INSERT ON public.ibp_gaps FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER ibp_gaps_updated_at BEFORE UPDATE ON public.ibp_gaps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Hoshin cascade review ============
CREATE TABLE public.hoshin_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.problem_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  review_date date,
  notes text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  catchball jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoshin_reviews TO authenticated;
GRANT ALL ON public.hoshin_reviews TO service_role;
ALTER TABLE public.hoshin_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY hoshin_reviews_company_all ON public.hoshin_reviews FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER hoshin_reviews_set_company BEFORE INSERT ON public.hoshin_reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER hoshin_reviews_updated_at BEFORE UPDATE ON public.hoshin_reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Employee Journey Mapping ============
CREATE TABLE public.journey_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.problem_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  segment text,
  notes text,
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_maps TO authenticated;
GRANT ALL ON public.journey_maps TO service_role;
ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY journey_maps_company_all ON public.journey_maps FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER journey_maps_set_company BEFORE INSERT ON public.journey_maps FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER journey_maps_updated_at BEFORE UPDATE ON public.journey_maps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.journey_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  map_id uuid NOT NULL REFERENCES public.journey_maps(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  sentiment smallint NOT NULL DEFAULT 3,
  moments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_id, stage_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_stages TO authenticated;
GRANT ALL ON public.journey_stages TO service_role;
ALTER TABLE public.journey_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY journey_stages_company_all ON public.journey_stages FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER journey_stages_set_company BEFORE INSERT ON public.journey_stages FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER journey_stages_updated_at BEFORE UPDATE ON public.journey_stages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.journey_pain_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  map_id uuid NOT NULL REFERENCES public.journey_maps(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  label text NOT NULL,
  severity smallint NOT NULL DEFAULT 3,
  frequency smallint NOT NULL DEFAULT 3,
  root_cause text,
  countermeasure text,
  owner_id uuid,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_pain_points TO authenticated;
GRANT ALL ON public.journey_pain_points TO service_role;
ALTER TABLE public.journey_pain_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY journey_pain_points_company_all ON public.journey_pain_points FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER journey_pain_points_set_company BEFORE INSERT ON public.journey_pain_points FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER journey_pain_points_updated_at BEFORE UPDATE ON public.journey_pain_points FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();