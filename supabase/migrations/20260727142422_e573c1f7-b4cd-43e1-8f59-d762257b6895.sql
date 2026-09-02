
CREATE TYPE public.problem_step_status AS ENUM ('not_started','in_progress','blocked','done');
CREATE TYPE public.problem_plan_status AS ENUM ('draft','active','on_hold','complete');

CREATE TABLE public.problem_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  statement text,
  source_problem_id text,
  owner_id uuid,
  status public.problem_plan_status NOT NULL DEFAULT 'active',
  target_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.problem_plan_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.problem_plans(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  label text NOT NULL,
  why text,
  owner_id uuid,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  progress_pct smallint NOT NULL DEFAULT 0,
  due_date date,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX problem_plan_steps_plan_idx ON public.problem_plan_steps(plan_id, sort_order);

CREATE TABLE public.problem_step_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.problem_plan_steps(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.problem_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  owner_id uuid,
  due_date date,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX problem_step_actions_step_idx ON public.problem_step_actions(step_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_plans TO authenticated;
GRANT ALL ON public.problem_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_plan_steps TO authenticated;
GRANT ALL ON public.problem_plan_steps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_step_actions TO authenticated;
GRANT ALL ON public.problem_step_actions TO service_role;

ALTER TABLE public.problem_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_step_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "problem_plans_company_all" ON public.problem_plans
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "problem_plan_steps_company_all" ON public.problem_plan_steps
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "problem_step_actions_company_all" ON public.problem_step_actions
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER problem_plans_updated_at BEFORE UPDATE ON public.problem_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER problem_plan_steps_updated_at BEFORE UPDATE ON public.problem_plan_steps
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER problem_step_actions_updated_at BEFORE UPDATE ON public.problem_step_actions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER problem_plans_set_company BEFORE INSERT ON public.problem_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER problem_plan_steps_set_company BEFORE INSERT ON public.problem_plan_steps
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER problem_step_actions_set_company BEFORE INSERT ON public.problem_step_actions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
