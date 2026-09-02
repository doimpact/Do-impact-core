CREATE TABLE public.owner_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id(),
  month date NOT NULL,
  revenue numeric,
  revenue_budget numeric,
  revenue_py numeric,
  cogs numeric,
  opex numeric,
  ebitda numeric,
  ebitda_budget numeric,
  ebitda_py numeric,
  cash numeric,
  debt numeric,
  operating_cash_flow numeric,
  free_cash_flow numeric,
  ar_total numeric,
  ar_over_60 numeric,
  ap_total numeric,
  inventory numeric,
  headcount numeric,
  labor_cost numeric,
  overtime_pct numeric,
  turnover_pct numeric,
  safety_incidents numeric,
  valuation_multiple numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_financials TO authenticated;
GRANT ALL ON public.owner_financials TO service_role;
ALTER TABLE public.owner_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_financials company scope" ON public.owner_financials FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER owner_financials_set_updated_at BEFORE UPDATE ON public.owner_financials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER owner_financials_no_template BEFORE INSERT OR UPDATE OR DELETE ON public.owner_financials
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TABLE public.owner_dashboard_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id(),
  name text NOT NULL DEFAULT 'Owner dashboard',
  is_default boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_dashboard_templates TO authenticated;
GRANT ALL ON public.owner_dashboard_templates TO service_role;
ALTER TABLE public.owner_dashboard_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_dashboard_templates company scope" ON public.owner_dashboard_templates FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER owner_dashboard_templates_set_updated_at BEFORE UPDATE ON public.owner_dashboard_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER owner_dashboard_templates_no_template BEFORE INSERT OR UPDATE OR DELETE ON public.owner_dashboard_templates
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();