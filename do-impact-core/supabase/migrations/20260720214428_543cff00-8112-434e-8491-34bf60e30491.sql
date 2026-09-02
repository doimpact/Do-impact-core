
CREATE TABLE public.capex_value_realization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capex_project_id UUID NOT NULL REFERENCES public.capex_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('financial','operational','quality_risk','investment')),
  metric_name TEXT NOT NULL,
  target_kpi TEXT,
  realized_result TEXT,
  financial_impact NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('exceeded','favorable','on_track','unfavorable','pending')),
  review_phase TEXT CHECK (review_phase IN ('baseline','closeout','initial_audit','pir')),
  review_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capex_value_realization TO authenticated;
GRANT ALL ON public.capex_value_realization TO service_role;
ALTER TABLE public.capex_value_realization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read capex vr" ON public.capex_value_realization FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write capex vr" ON public.capex_value_realization FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update capex vr" ON public.capex_value_realization FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete capex vr" ON public.capex_value_realization FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_capex_vr_updated BEFORE UPDATE ON public.capex_value_realization FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_capex_vr_project ON public.capex_value_realization(capex_project_id);
