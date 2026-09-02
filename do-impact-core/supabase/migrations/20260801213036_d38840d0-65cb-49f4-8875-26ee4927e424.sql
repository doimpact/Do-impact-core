CREATE TABLE public.waterfall_item_monthly_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.waterfall_items(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  actual numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waterfall_item_monthly_benefits TO authenticated;
GRANT ALL ON public.waterfall_item_monthly_benefits TO service_role;
ALTER TABLE public.waterfall_item_monthly_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY wimb_company_all ON public.waterfall_item_monthly_benefits FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.waterfall_item_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.waterfall_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text,
  kind public.objective_kpi_kind NOT NULL DEFAULT 'leading',
  target numeric,
  higher_is_better boolean NOT NULL DEFAULT true,
  frequency text NOT NULL DEFAULT 'monthly',
  owner_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waterfall_item_kpis TO authenticated;
GRANT ALL ON public.waterfall_item_kpis TO service_role;
ALTER TABLE public.waterfall_item_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY wik_company_all ON public.waterfall_item_kpis FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.waterfall_item_kpi_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kpi_id uuid NOT NULL REFERENCES public.waterfall_item_kpis(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  actual numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waterfall_item_kpi_values TO authenticated;
GRANT ALL ON public.waterfall_item_kpi_values TO service_role;
ALTER TABLE public.waterfall_item_kpi_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY wikv_company_all ON public.waterfall_item_kpi_values FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER set_company_id BEFORE INSERT ON public.waterfall_item_monthly_benefits FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER set_company_id BEFORE INSERT ON public.waterfall_item_kpis FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER set_company_id BEFORE INSERT ON public.waterfall_item_kpi_values FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.waterfall_item_monthly_benefits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.waterfall_item_kpis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.waterfall_item_kpi_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.waterfall_item_monthly_benefits FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.waterfall_item_kpis FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.waterfall_item_kpi_values FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();