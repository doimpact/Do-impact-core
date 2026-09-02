ALTER TABLE public.dm_categories ADD COLUMN IF NOT EXISTS unit text;

CREATE TABLE public.dm_category_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.dm_boards(id) ON DELETE CASCADE,
  category_key text NOT NULL,
  value_date date NOT NULL,
  plan_value numeric,
  actual_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, category_key, value_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_category_targets TO authenticated;
GRANT ALL ON public.dm_category_targets TO service_role;

ALTER TABLE public.dm_category_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "category targets readable by company members"
  ON public.dm_category_targets FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "category targets insert in active company"
  ON public.dm_category_targets FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "category targets update in active company"
  ON public.dm_category_targets FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "category targets delete in active company"
  ON public.dm_category_targets FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER dm_category_targets_set_company
  BEFORE INSERT ON public.dm_category_targets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE TRIGGER dm_category_targets_set_updated_at
  BEFORE UPDATE ON public.dm_category_targets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER dm_category_targets_no_template_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.dm_category_targets
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TRIGGER dm_category_targets_write_access
  BEFORE INSERT OR UPDATE OR DELETE ON public.dm_category_targets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();

CREATE INDEX dm_category_targets_lookup
  ON public.dm_category_targets (company_id, board_id, value_date);