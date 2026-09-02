CREATE TABLE public.playbook_worksheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  goal_key text NOT NULL,
  title text NOT NULL,
  objective_id uuid REFERENCES public.strategic_objectives(id) ON DELETE SET NULL,
  hoshin_item_id uuid REFERENCES public.hoshin_items(id) ON DELETE SET NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  archived_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.playbook_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  worksheet_id uuid NOT NULL REFERENCES public.playbook_worksheets(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('action','assumption','watch')),
  rule_key text,
  text text NOT NULL,
  rationale text,
  horizon text,
  impact text,
  effort text,
  accepted boolean NOT NULL DEFAULT false,
  owner_id uuid,
  due_date date,
  pushed_action_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX playbook_worksheets_company_idx ON public.playbook_worksheets(company_id);
CREATE INDEX playbook_items_worksheet_idx ON public.playbook_items(worksheet_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.playbook_worksheets TO authenticated;
GRANT ALL ON public.playbook_worksheets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playbook_items TO authenticated;
GRANT ALL ON public.playbook_items TO service_role;

ALTER TABLE public.playbook_worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY playbook_worksheets_company_all ON public.playbook_worksheets
  FOR ALL TO authenticated
  USING (company_id = current_company_id() AND is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = current_company_id() AND is_company_member(company_id, auth.uid()));

CREATE POLICY playbook_items_company_all ON public.playbook_items
  FOR ALL TO authenticated
  USING (company_id = current_company_id() AND is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = current_company_id() AND is_company_member(company_id, auth.uid()));

CREATE TRIGGER playbook_worksheets_set_company BEFORE INSERT ON public.playbook_worksheets
  FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();
CREATE TRIGGER playbook_worksheets_updated_at BEFORE UPDATE ON public.playbook_worksheets
  FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.playbook_worksheets
  FOR EACH ROW EXECUTE FUNCTION enforce_write_access();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.playbook_worksheets
  FOR EACH ROW EXECUTE FUNCTION prevent_template_write();

CREATE TRIGGER playbook_items_set_company BEFORE INSERT ON public.playbook_items
  FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();
CREATE TRIGGER playbook_items_updated_at BEFORE UPDATE ON public.playbook_items
  FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.playbook_items
  FOR EACH ROW EXECUTE FUNCTION enforce_write_access();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.playbook_items
  FOR EACH ROW EXECUTE FUNCTION prevent_template_write();