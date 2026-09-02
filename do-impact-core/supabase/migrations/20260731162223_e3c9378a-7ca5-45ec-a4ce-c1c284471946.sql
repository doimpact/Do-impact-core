CREATE TYPE public.eight_d_status AS ENUM ('draft','open','containment','verification','closed','archived');
CREATE TYPE public.eight_d_severity AS ENUM ('low','medium','high','critical');

CREATE TABLE public.eight_d_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  reference text,
  owner_id uuid,
  created_by uuid DEFAULT auth.uid(),
  status public.eight_d_status NOT NULL DEFAULT 'draft',
  severity public.eight_d_severity NOT NULL DEFAULT 'medium',
  source_escalation_id uuid REFERENCES public.dm_escalations(id) ON DELETE SET NULL,

  -- D0
  emergency_response boolean NOT NULL DEFAULT false,
  d0_rationale text,
  d0_emergency_action text,
  -- D1
  d1_team text,
  d1_champion text,
  -- D2 (5W2H)
  d2_who text,
  d2_what text,
  d2_where text,
  d2_when text,
  d2_why text,
  d2_how text,
  d2_how_many text,
  -- D3
  d3_containment text,
  d3_escape_verified boolean NOT NULL DEFAULT false,
  d3_containment_cost numeric,
  -- D4
  d4_cause_occurrence text,
  d4_cause_escape text,
  d4_verification text,
  -- D5
  d5_actions text,
  d5_risk_assessment text,
  d5_trial_result text,
  -- D6
  d6_implementation text,
  d6_owner text,
  d6_target_date date,
  d6_validation_period text,
  d6_containment_removed_on date,
  -- D7
  d7_prevention text,
  -- D8
  d8_recognition text,
  d8_closed_on date,

  completed_disciplines text[] NOT NULL DEFAULT '{}',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.eight_d_reports TO authenticated;
GRANT ALL ON public.eight_d_reports TO service_role;

ALTER TABLE public.eight_d_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eight_d company scope" ON public.eight_d_reports
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "eight_d read" ON public.eight_d_reports
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "eight_d insert" ON public.eight_d_reports
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND company_id = public.current_company_id());

CREATE POLICY "eight_d update" ON public.eight_d_reports
  FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role) OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)))
  WITH CHECK (company_id = public.current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role) OR public.has_role(auth.uid(), company_id, 'leader'::public.app_role)));

CREATE POLICY "eight_d delete" ON public.eight_d_reports
  FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND (created_by = auth.uid() OR public.has_role(auth.uid(), company_id, 'admin'::public.app_role)));

CREATE TRIGGER set_company_id_eight_d BEFORE INSERT ON public.eight_d_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER eight_d_updated_at BEFORE UPDATE ON public.eight_d_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.eight_d_reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.eight_d_reports
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE INDEX eight_d_company_idx ON public.eight_d_reports(company_id, updated_at DESC);