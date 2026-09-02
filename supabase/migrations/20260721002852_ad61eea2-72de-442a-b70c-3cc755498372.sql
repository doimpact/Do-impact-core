CREATE TABLE public.objective_monthly_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (objective_id, year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_monthly_benefits TO authenticated;
GRANT ALL ON public.objective_monthly_benefits TO service_role;
ALTER TABLE public.objective_monthly_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objective_monthly_benefits auth all" ON public.objective_monthly_benefits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER objective_monthly_benefits_set_updated_at BEFORE UPDATE ON public.objective_monthly_benefits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.objective_monthly_benefits (objective_id);