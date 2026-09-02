
CREATE TABLE public.consolidation_pnl_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.consolidation_projects(id) ON DELETE CASCADE,
  scenario text NOT NULL CHECK (scenario IN ('before','after')),
  month date NOT NULL,
  line text NOT NULL CHECK (line IN ('revenue','variable_cost','fixed_cost')),
  amount numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, scenario, month, line)
);

CREATE INDEX consolidation_pnl_entries_project_idx
  ON public.consolidation_pnl_entries (project_id, scenario, month);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consolidation_pnl_entries TO authenticated;
GRANT ALL ON public.consolidation_pnl_entries TO service_role;

ALTER TABLE public.consolidation_pnl_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consolidation_pnl_entries_member_all"
  ON public.consolidation_pnl_entries
  FOR ALL
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER consolidation_pnl_entries_set_company
  BEFORE INSERT ON public.consolidation_pnl_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE TRIGGER consolidation_pnl_entries_set_updated_at
  BEFORE UPDATE ON public.consolidation_pnl_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
