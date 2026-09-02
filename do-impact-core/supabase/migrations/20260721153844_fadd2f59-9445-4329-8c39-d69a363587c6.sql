
-- 1. Cash flow settings (one row per user typically, but keep multi-row)
CREATE TABLE public.cash_flow_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Default',
  anchor_week date NOT NULL DEFAULT date_trunc('week', now())::date,
  opening_balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  monthly_revenue numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow_settings TO authenticated;
GRANT ALL ON public.cash_flow_settings TO service_role;
ALTER TABLE public.cash_flow_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfs all auth" ON public.cash_flow_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER cfs_updated_at BEFORE UPDATE ON public.cash_flow_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Cash flow weekly line items
CREATE TABLE public.cash_flow_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_id uuid REFERENCES public.cash_flow_settings(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  line_key text NOT NULL,
  line_label text NOT NULL,
  category text NOT NULL CHECK (category IN ('inflow','outflow')),
  plan numeric NOT NULL DEFAULT 0,
  actual numeric NOT NULL DEFAULT 0,
  notes text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cfw_settings_week_idx ON public.cash_flow_weeks(settings_id, week_start_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_flow_weeks TO authenticated;
GRANT ALL ON public.cash_flow_weeks TO service_role;
ALTER TABLE public.cash_flow_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfw all auth" ON public.cash_flow_weeks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER cfw_updated_at BEFORE UPDATE ON public.cash_flow_weeks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Working capital items
CREATE TABLE public.working_capital_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('raw','wip','fg','ar','ap','other')),
  title text NOT NULL,
  description text,
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  realized_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  owner_id uuid,
  action text,
  due_date date,
  realized_date date,
  status text NOT NULL DEFAULT 'identified' CHECK (status IN ('identified','in_progress','realized','blocked')),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_capital_items TO authenticated;
GRANT ALL ON public.working_capital_items TO service_role;
ALTER TABLE public.working_capital_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wci all auth" ON public.working_capital_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER wci_updated_at BEFORE UPDATE ON public.working_capital_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Working capital monthly KPIs
CREATE TABLE public.working_capital_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  dio numeric,
  dso numeric,
  dpo numeric,
  inventory_total numeric,
  ar_total numeric,
  ap_total numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.working_capital_kpis TO authenticated;
GRANT ALL ON public.working_capital_kpis TO service_role;
ALTER TABLE public.working_capital_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wck all auth" ON public.working_capital_kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER wck_updated_at BEFORE UPDATE ON public.working_capital_kpis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Part margins
CREATE TABLE public.part_margins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text NOT NULL,
  description text,
  customer text,
  annual_qty numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  material_cost numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  overhead numeric NOT NULL DEFAULT 0,
  scrap_pct numeric NOT NULL DEFAULT 0,
  nre_recovery numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  capex_project_id uuid REFERENCES public.capex_projects(id) ON DELETE SET NULL,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pm_customer_idx ON public.part_margins(customer);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.part_margins TO authenticated;
GRANT ALL ON public.part_margins TO service_role;
ALTER TABLE public.part_margins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm all auth" ON public.part_margins FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER pm_updated_at BEFORE UPDATE ON public.part_margins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. COPQ entries
CREATE TABLE public.copq_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  category text NOT NULL CHECK (category IN ('scrap','rework','warranty','customer_return','concession','sorting','other')),
  part_number text,
  description text,
  quantity numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  root_cause text,
  corrective_action text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  capex_project_id uuid REFERENCES public.capex_projects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX copq_month_idx ON public.copq_entries(month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copq_entries TO authenticated;
GRANT ALL ON public.copq_entries TO service_role;
ALTER TABLE public.copq_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "copq all auth" ON public.copq_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER copq_updated_at BEFORE UPDATE ON public.copq_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
