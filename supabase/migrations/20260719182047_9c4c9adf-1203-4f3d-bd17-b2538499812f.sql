
CREATE TABLE public.opportunity_monthly_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, year, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_monthly_values TO authenticated;
GRANT ALL ON public.opportunity_monthly_values TO service_role;

ALTER TABLE public.opportunity_monthly_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read opp monthly" ON public.opportunity_monthly_values
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write opp monthly" ON public.opportunity_monthly_values
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_opp_monthly_updated_at BEFORE UPDATE ON public.opportunity_monthly_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_opp_monthly_opp ON public.opportunity_monthly_values(opportunity_id);
CREATE INDEX idx_opp_monthly_ym ON public.opportunity_monthly_values(year, month);
