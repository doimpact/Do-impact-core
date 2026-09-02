CREATE TABLE public.mro_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.problem_plans(id) ON DELETE SET NULL,
  title text NOT NULL,
  aircraft_type text,
  check_type text,
  wrench_time_pct numeric NOT NULL DEFAULT 40,
  drivers jsonb NOT NULL DEFAULT '{}'::jsonb,
  modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mro_assessments TO authenticated;
GRANT ALL ON public.mro_assessments TO service_role;
ALTER TABLE public.mro_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY mro_assessments_company_all ON public.mro_assessments
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY mro_assessments_company_scope ON public.mro_assessments
  AS RESTRICTIVE FOR ALL TO public
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.mro_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.mro_assessments(id) ON DELETE CASCADE,
  driver_key text,
  title text NOT NULL,
  owner_id uuid,
  due_date date,
  status public.problem_step_status NOT NULL DEFAULT 'not_started',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mro_actions TO authenticated;
GRANT ALL ON public.mro_actions TO service_role;
ALTER TABLE public.mro_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY mro_actions_company_all ON public.mro_actions
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY mro_actions_company_scope ON public.mro_actions
  AS RESTRICTIVE FOR ALL TO public
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER mro_assessments_set_company BEFORE INSERT ON public.mro_assessments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER mro_assessments_set_updated BEFORE UPDATE ON public.mro_assessments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER mro_actions_set_company BEFORE INSERT ON public.mro_actions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER mro_actions_set_updated BEFORE UPDATE ON public.mro_actions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX mro_actions_assessment_idx ON public.mro_actions(assessment_id);