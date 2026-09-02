
-- objective_actions
CREATE TYPE public.objective_action_status AS ENUM ('open','in_progress','done','blocked');

CREATE TABLE public.objective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  status public.objective_action_status NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX objective_actions_objective_idx ON public.objective_actions(objective_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_actions TO authenticated;
GRANT ALL ON public.objective_actions TO service_role;
ALTER TABLE public.objective_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objective_actions authenticated all" ON public.objective_actions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER objective_actions_updated_at
  BEFORE UPDATE ON public.objective_actions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- objective_kpis
CREATE TYPE public.objective_kpi_kind AS ENUM ('leading','lagging');

CREATE TABLE public.objective_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.strategic_objectives(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text,
  kind public.objective_kpi_kind NOT NULL DEFAULT 'leading',
  target numeric,
  higher_is_better boolean NOT NULL DEFAULT true,
  frequency text NOT NULL DEFAULT 'monthly',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX objective_kpis_objective_idx ON public.objective_kpis(objective_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_kpis TO authenticated;
GRANT ALL ON public.objective_kpis TO service_role;
ALTER TABLE public.objective_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objective_kpis authenticated all" ON public.objective_kpis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER objective_kpis_updated_at
  BEFORE UPDATE ON public.objective_kpis
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- objective_kpi_values
CREATE TABLE public.objective_kpi_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL REFERENCES public.objective_kpis(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  actual numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, period_start)
);
CREATE INDEX objective_kpi_values_kpi_idx ON public.objective_kpi_values(kpi_id, period_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.objective_kpi_values TO authenticated;
GRANT ALL ON public.objective_kpi_values TO service_role;
ALTER TABLE public.objective_kpi_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objective_kpi_values authenticated all" ON public.objective_kpi_values
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER objective_kpi_values_updated_at
  BEFORE UPDATE ON public.objective_kpi_values
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
