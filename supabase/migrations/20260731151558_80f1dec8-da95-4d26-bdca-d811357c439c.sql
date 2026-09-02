CREATE TABLE public.cpp_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  aircraft_reg text NOT NULL,
  aircraft_type text,
  check_type text,
  bay text,
  induction_date date,
  planned_redelivery date,
  total_planned_hours numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpp_visits TO authenticated;
GRANT ALL ON public.cpp_visits TO service_role;
ALTER TABLE public.cpp_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpp_visits_company_all ON public.cpp_visits FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY cpp_visits_company_scope ON public.cpp_visits AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.cpp_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES public.cpp_visits(id) ON DELETE CASCADE,
  title text NOT NULL,
  work_area text,
  planned_hours numeric NOT NULL DEFAULT 0,
  earned_hours numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started',
  owner_name text,
  predecessor_id uuid REFERENCES public.cpp_tasks(id) ON DELETE SET NULL,
  on_critical_path boolean NOT NULL DEFAULT false,
  red_tagged boolean NOT NULL DEFAULT false,
  non_routine_type text,
  reevaluated_at timestamptz,
  reevaluation_note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpp_tasks TO authenticated;
GRANT ALL ON public.cpp_tasks TO service_role;
ALTER TABLE public.cpp_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpp_tasks_company_all ON public.cpp_tasks FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY cpp_tasks_company_scope ON public.cpp_tasks AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.cpp_pulse_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES public.cpp_visits(id) ON DELETE CASCADE,
  check_at timestamptz NOT NULL DEFAULT now(),
  window_hours numeric NOT NULL DEFAULT 2,
  planned_hours numeric NOT NULL DEFAULT 0,
  earned_hours numeric NOT NULL DEFAULT 0,
  stopped_over_15min boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpp_pulse_checks TO authenticated;
GRANT ALL ON public.cpp_pulse_checks TO service_role;
ALTER TABLE public.cpp_pulse_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpp_pulse_company_all ON public.cpp_pulse_checks FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY cpp_pulse_company_scope ON public.cpp_pulse_checks AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.cpp_blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES public.cpp_visits(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.cpp_tasks(id) ON DELETE SET NULL,
  blocker_type text NOT NULL DEFAULT 'other',
  support_function text NOT NULL DEFAULT 'planning',
  description text,
  raised_at timestamptz NOT NULL DEFAULT now(),
  target_response_minutes integer NOT NULL DEFAULT 30,
  responded_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpp_blockers TO authenticated;
GRANT ALL ON public.cpp_blockers TO service_role;
ALTER TABLE public.cpp_blockers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpp_blockers_company_all ON public.cpp_blockers FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY cpp_blockers_company_scope ON public.cpp_blockers AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.cpp_handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES public.cpp_visits(id) ON DELETE CASCADE,
  handover_date date NOT NULL DEFAULT current_date,
  shift_label text NOT NULL DEFAULT 'Day',
  outgoing_lead text,
  incoming_lead text,
  cards_reviewed text,
  blockers_carried text,
  kit_readiness text NOT NULL DEFAULT 'ready',
  kit_note text,
  next_priorities text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cpp_handovers TO authenticated;
GRANT ALL ON public.cpp_handovers TO service_role;
ALTER TABLE public.cpp_handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpp_handovers_company_all ON public.cpp_handovers FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY cpp_handovers_company_scope ON public.cpp_handovers AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cpp_visits','cpp_tasks','cpp_pulse_checks','cpp_blockers','cpp_handovers'] LOOP
    EXECUTE format('CREATE TRIGGER set_company_id_%1$s BEFORE INSERT ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id()', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
    EXECUTE format('CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()', t);
    EXECUTE format('CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()', t);
  END LOOP;
END $$;

CREATE INDEX cpp_tasks_visit_idx ON public.cpp_tasks(visit_id);
CREATE INDEX cpp_pulse_visit_idx ON public.cpp_pulse_checks(visit_id);
CREATE INDEX cpp_blockers_visit_idx ON public.cpp_blockers(visit_id);
CREATE INDEX cpp_handovers_visit_idx ON public.cpp_handovers(visit_id);