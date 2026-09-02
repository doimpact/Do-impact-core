
-- SIOP tables
CREATE TABLE public.siop_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_month DATE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'demand_review',
  current_step INT NOT NULL DEFAULT 1,
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_cycles TO authenticated;
GRANT ALL ON public.siop_cycles TO service_role;
ALTER TABLE public.siop_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_cycles all authenticated" ON public.siop_cycles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_siop_cycles_updated BEFORE UPDATE ON public.siop_cycles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.siop_demand (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  product_line TEXT NOT NULL,
  workscope TEXT,
  segment TEXT,
  firm_units NUMERIC DEFAULT 0,
  pipeline_units NUMERIC DEFAULT 0,
  weighted_units NUMERIC DEFAULT 0,
  revenue_estimate NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_demand TO authenticated;
GRANT ALL ON public.siop_demand TO service_role;
ALTER TABLE public.siop_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_demand all" ON public.siop_demand FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_siop_demand_updated BEFORE UPDATE ON public.siop_demand FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.siop_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- labor | facility | tooling | material
  resource_name TEXT NOT NULL,
  available_capacity NUMERIC DEFAULT 0,
  required_capacity NUMERIC DEFAULT 0,
  unit TEXT,
  status TEXT DEFAULT 'green', -- green/yellow/red
  mitigation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_capacity TO authenticated;
GRANT ALL ON public.siop_capacity TO service_role;
ALTER TABLE public.siop_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_capacity all" ON public.siop_capacity FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_siop_capacity_updated BEFORE UPDATE ON public.siop_capacity FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.siop_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  option_label TEXT NOT NULL,
  description TEXT,
  revenue_impact NUMERIC DEFAULT 0,
  cost_impact NUMERIC DEFAULT 0,
  ebitda_impact NUMERIC DEFAULT 0,
  tat_impact TEXT,
  risk_level TEXT DEFAULT 'medium',
  recommended BOOLEAN DEFAULT false,
  selected BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_scenarios TO authenticated;
GRANT ALL ON public.siop_scenarios TO service_role;
ALTER TABLE public.siop_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_scenarios all" ON public.siop_scenarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_siop_scenarios_updated BEFORE UPDATE ON public.siop_scenarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.siop_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  step INT NOT NULL DEFAULT 4,
  decision TEXT NOT NULL,
  rationale TEXT,
  owner_id UUID REFERENCES auth.users(id),
  due_date DATE,
  status TEXT DEFAULT 'open',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_decisions TO authenticated;
GRANT ALL ON public.siop_decisions TO service_role;
ALTER TABLE public.siop_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_decisions all" ON public.siop_decisions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_siop_decisions_updated BEFORE UPDATE ON public.siop_decisions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.siop_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  kpi_name TEXT NOT NULL,
  category TEXT, -- financial | operational | tat | material
  plan_value NUMERIC,
  actual_value NUMERIC,
  variance NUMERIC,
  status TEXT DEFAULT 'green',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_kpis TO authenticated;
GRANT ALL ON public.siop_kpis TO service_role;
ALTER TABLE public.siop_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_kpis all" ON public.siop_kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_siop_kpis_updated BEFORE UPDATE ON public.siop_kpis FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
