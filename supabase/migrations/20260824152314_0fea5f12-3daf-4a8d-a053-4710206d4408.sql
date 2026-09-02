CREATE TABLE public.safety_walks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  walk_type text NOT NULL DEFAULT 'daily',
  walk_date date NOT NULL DEFAULT current_date,
  area text,
  department text,
  led_by text,
  participants text,
  good_practices text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  ref text,
  source text NOT NULL DEFAULT 'report',
  walk_id uuid REFERENCES public.safety_walks(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'unsafe_condition',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  location text,
  department text,
  reporter_name text,
  anonymous boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  immediate_action text,
  potential_consequence text,
  photo_path text,
  severity integer NOT NULL DEFAULT 1,
  likelihood integer NOT NULL DEFAULT 1,
  risk_score integer GENERATED ALWAYS AS (severity * likelihood) STORED,
  immediate_control text,
  permanent_action text,
  control_level text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  verified_by text,
  effectiveness text,
  closed_at date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT safety_reports_severity_chk CHECK (severity BETWEEN 1 AND 5),
  CONSTRAINT safety_reports_likelihood_chk CHECK (likelihood BETWEEN 1 AND 5),
  CONSTRAINT safety_reports_status_chk CHECK (status IN ('open','in_progress','verifying','closed'))
);

CREATE INDEX idx_safety_reports_company ON public.safety_reports(company_id);
CREATE INDEX idx_safety_reports_status ON public.safety_reports(company_id, status);
CREATE INDEX idx_safety_walks_company ON public.safety_walks(company_id, walk_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_reports TO authenticated;
GRANT ALL ON public.safety_reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_walks TO authenticated;
GRANT ALL ON public.safety_walks TO service_role;

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view safety_reports" ON public.safety_reports FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Company members can insert safety_reports" ON public.safety_reports FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Company members can update safety_reports" ON public.safety_reports FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid())) WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Company members can delete safety_reports" ON public.safety_reports FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "safety_reports_company_scope" ON public.safety_reports AS RESTRICTIVE TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company members can view safety_walks" ON public.safety_walks FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "Company members can insert safety_walks" ON public.safety_walks FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Company members can update safety_walks" ON public.safety_walks FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid())) WITH CHECK (is_company_member(company_id, auth.uid()));
CREATE POLICY "Company members can delete safety_walks" ON public.safety_walks FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()));
CREATE POLICY "safety_walks_company_scope" ON public.safety_walks AS RESTRICTIVE TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TRIGGER safety_reports_set_company BEFORE INSERT ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER safety_reports_updated_at BEFORE UPDATE ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER safety_reports_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER safety_reports_template_lock BEFORE INSERT OR UPDATE OR DELETE ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TRIGGER safety_walks_set_company BEFORE INSERT ON public.safety_walks FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER safety_walks_updated_at BEFORE UPDATE ON public.safety_walks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER safety_walks_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.safety_walks FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER safety_walks_template_lock BEFORE INSERT OR UPDATE OR DELETE ON public.safety_walks FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE OR REPLACE FUNCTION public.tg_safety_report_ref()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NEW.ref IS NULL OR NEW.ref = '' THEN
    SELECT count(*) + 1 INTO n
    FROM public.safety_reports
    WHERE company_id = NEW.company_id
      AND date_part('year', created_at) = date_part('year', now());
    NEW.ref := 'SAF-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_safety_report_ref() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER safety_reports_ref BEFORE INSERT ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.tg_safety_report_ref();