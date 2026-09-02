-- ============ enums ============
DO $$ BEGIN
  CREATE TYPE public.dm_loop_state AS ENUM ('contain','cause','countermeasure','standardised','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dm_metric_direction AS ENUM ('higher_better','lower_better');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ dm_metric_defs ============
CREATE TABLE IF NOT EXISTS public.dm_metric_defs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.dm_boards(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  unit text NOT NULL DEFAULT '%',
  target numeric,
  red_trigger numeric,
  direction public.dm_metric_direction NOT NULL DEFAULT 'higher_better',
  active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_metric_defs TO authenticated;
GRANT ALL ON public.dm_metric_defs TO service_role;
ALTER TABLE public.dm_metric_defs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_metric_defs_company_all" ON public.dm_metric_defs
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "dm_metric_defs_company_scope" ON public.dm_metric_defs
  AS RESTRICTIVE FOR ALL TO public
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER trg_dm_metric_defs_updated_at BEFORE UPDATE ON public.dm_metric_defs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ dm_metric_values ============
CREATE TABLE IF NOT EXISTS public.dm_metric_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.dm_boards(id) ON DELETE CASCADE,
  metric_def_id uuid NOT NULL REFERENCES public.dm_metric_defs(id) ON DELETE CASCADE,
  value_date date NOT NULL,
  value numeric,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric_def_id, value_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_metric_values TO authenticated;
GRANT ALL ON public.dm_metric_values TO service_role;
ALTER TABLE public.dm_metric_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_metric_values_company_all" ON public.dm_metric_values
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "dm_metric_values_company_scope" ON public.dm_metric_values
  AS RESTRICTIVE FOR ALL TO public
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER trg_dm_metric_values_updated_at BEFORE UPDATE ON public.dm_metric_values
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_dm_metric_values_board_date ON public.dm_metric_values(board_id, value_date);

-- ============ 3C closed-loop columns ============
ALTER TABLE public.dm_escalations
  ADD COLUMN IF NOT EXISTS loop_state public.dm_loop_state NOT NULL DEFAULT 'contain',
  ADD COLUMN IF NOT EXISTS recurrence_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS a3_report_id uuid REFERENCES public.a3_reports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS standardised_at timestamptz,
  ADD COLUMN IF NOT EXISTS standardised_by uuid,
  ADD COLUMN IF NOT EXISTS metric_def_id uuid REFERENCES public.dm_metric_defs(id) ON DELETE SET NULL;

-- ============ gemba walks ============
CREATE TABLE IF NOT EXISTS public.dm_gemba_walks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.dm_boards(id) ON DELETE CASCADE,
  walked_on date NOT NULL DEFAULT CURRENT_DATE,
  leader_id uuid,
  notes text,
  avg_depth numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_gemba_walks TO authenticated;
GRANT ALL ON public.dm_gemba_walks TO service_role;
ALTER TABLE public.dm_gemba_walks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_gemba_walks_company_all" ON public.dm_gemba_walks
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "dm_gemba_walks_company_scope" ON public.dm_gemba_walks
  AS RESTRICTIVE FOR ALL TO public
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER trg_dm_gemba_walks_updated_at BEFORE UPDATE ON public.dm_gemba_walks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.dm_gemba_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  walk_id uuid NOT NULL REFERENCES public.dm_gemba_walks(id) ON DELETE CASCADE,
  escalation_id uuid REFERENCES public.dm_escalations(id) ON DELETE CASCADE,
  metric_def_id uuid REFERENCES public.dm_metric_defs(id) ON DELETE SET NULL,
  label text,
  depth_score smallint,
  objective_id uuid REFERENCES public.strategic_objectives(id) ON DELETE SET NULL,
  note text,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_gemba_items TO authenticated;
GRANT ALL ON public.dm_gemba_items TO service_role;
ALTER TABLE public.dm_gemba_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_gemba_items_company_all" ON public.dm_gemba_items
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "dm_gemba_items_company_scope" ON public.dm_gemba_items
  AS RESTRICTIVE FOR ALL TO public
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER trg_dm_gemba_items_updated_at BEFORE UPDATE ON public.dm_gemba_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ default friction metrics per board ============
CREATE OR REPLACE FUNCTION public.tg_dm_board_seed_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.dm_metric_defs (company_id, board_id, key, label, unit, target, red_trigger, direction, sort_order)
  VALUES
    (NEW.company_id, NEW.id, 'kit_completeness', 'Kit completeness', '%', 95, 90, 'higher_better', 0),
    (NEW.company_id, NEW.id, 'tool_readiness',   'Tool / equipment readiness', '%', 98, 95, 'higher_better', 1),
    (NEW.company_id, NEW.id, 'rfi_aging',        'RFI / query aging (open > limit)', 'count', 0, 3, 'lower_better', 2),
    (NEW.company_id, NEW.id, 'manning_coverage', 'Manning & skills coverage', '%', 100, 95, 'higher_better', 3)
  ON CONFLICT (board_id, key) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_dm_board_seed_metrics ON public.dm_boards;
CREATE TRIGGER trg_dm_board_seed_metrics AFTER INSERT ON public.dm_boards
  FOR EACH ROW EXECUTE FUNCTION public.tg_dm_board_seed_metrics();

-- backfill existing boards
INSERT INTO public.dm_metric_defs (company_id, board_id, key, label, unit, target, red_trigger, direction, sort_order)
SELECT b.company_id, b.id, d.key, d.label, d.unit, d.target, d.red_trigger, d.direction::public.dm_metric_direction, d.sort_order
FROM public.dm_boards b
CROSS JOIN (VALUES
  ('kit_completeness','Kit completeness','%',95,90,'higher_better',0),
  ('tool_readiness','Tool / equipment readiness','%',98,95,'higher_better',1),
  ('rfi_aging','RFI / query aging (open > limit)','count',0,3,'lower_better',2),
  ('manning_coverage','Manning & skills coverage','%',100,95,'higher_better',3)
) AS d(key,label,unit,target,red_trigger,direction,sort_order)
ON CONFLICT (board_id, key) DO NOTHING;