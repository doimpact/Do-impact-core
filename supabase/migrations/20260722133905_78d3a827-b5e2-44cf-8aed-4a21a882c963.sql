
-- Enums
DO $$ BEGIN
  CREATE TYPE public.waterfall_metric AS ENUM ('sales','ebit','ebitda','free_cash_flow','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.waterfall_category AS ENUM ('headwind','organic_growth','new_strategy','efficiency','investment','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bridges
CREATE TABLE public.waterfall_bridges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  metric public.waterfall_metric NOT NULL DEFAULT 'ebit',
  metric_label text,
  currency text NOT NULL DEFAULT 'USD',
  baseline_value numeric NOT NULL DEFAULT 0,
  baseline_label text NOT NULL DEFAULT 'Baseline',
  target_value numeric,
  target_label text NOT NULL DEFAULT 'Target',
  start_period text,
  end_period text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.waterfall_bridges TO authenticated;
GRANT ALL ON public.waterfall_bridges TO service_role;
ALTER TABLE public.waterfall_bridges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wb_select" ON public.waterfall_bridges FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "wb_insert" ON public.waterfall_bridges FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "wb_update" ON public.waterfall_bridges FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "wb_delete" ON public.waterfall_bridges FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER trg_wb_updated BEFORE UPDATE ON public.waterfall_bridges
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_wb_company BEFORE INSERT ON public.waterfall_bridges
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

-- Items
CREATE TABLE public.waterfall_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bridge_id uuid NOT NULL REFERENCES public.waterfall_bridges(id) ON DELETE CASCADE,
  company_id uuid NOT NULL DEFAULT public.current_company_id(),
  sort_order int NOT NULL DEFAULT 0,
  label text NOT NULL,
  category public.waterfall_category NOT NULL DEFAULT 'organic_growth',
  gross_impact numeric NOT NULL DEFAULT 0,
  realization_pct numeric NOT NULL DEFAULT 100 CHECK (realization_pct >= 0 AND realization_pct <= 100),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  program_manager text,
  kpi text,
  milestone_quarter text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.waterfall_items TO authenticated;
GRANT ALL ON public.waterfall_items TO service_role;
ALTER TABLE public.waterfall_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wi_select" ON public.waterfall_items FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "wi_insert" ON public.waterfall_items FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "wi_update" ON public.waterfall_items FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "wi_delete" ON public.waterfall_items FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER trg_wi_updated BEFORE UPDATE ON public.waterfall_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_wi_company BEFORE INSERT ON public.waterfall_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE INDEX idx_wi_bridge ON public.waterfall_items(bridge_id, sort_order);
