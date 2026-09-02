CREATE TABLE public.board_report_layouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL DEFAULT public.current_company_id(),
  name text NOT NULL DEFAULT 'Board cut',
  is_default boolean NOT NULL DEFAULT false,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_report_layouts TO authenticated;
GRANT ALL ON public.board_report_layouts TO service_role;

ALTER TABLE public.board_report_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brl read own company" ON public.board_report_layouts
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "brl insert own company" ON public.board_report_layouts
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "brl update own company" ON public.board_report_layouts
  FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "brl delete own company" ON public.board_report_layouts
  FOR DELETE TO authenticated
  USING (company_id = public.current_company_id());

CREATE TRIGGER trg_brl_updated_at BEFORE UPDATE ON public.board_report_layouts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX brl_company_idx ON public.board_report_layouts(company_id);