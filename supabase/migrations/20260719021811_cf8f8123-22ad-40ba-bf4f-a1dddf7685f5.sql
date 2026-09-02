-- Shared updated_at trigger fn
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- STRATEGIES (single-row org strategy)
CREATE TABLE public.strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vision text,
  mission text,
  horizon_start_year int NOT NULL DEFAULT extract(year from now())::int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategies TO authenticated;
GRANT ALL ON public.strategies TO service_role;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategy readable" ON public.strategies FOR SELECT TO authenticated USING (true);
CREATE POLICY "strategy leaders insert" ON public.strategies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
CREATE POLICY "strategy leaders update" ON public.strategies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
CREATE POLICY "strategy admins delete" ON public.strategies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER strategies_updated_at BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.strategies (vision, mission) VALUES (NULL, NULL);

-- STRATEGIC THEMES
CREATE TABLE public.strategic_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  color text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategic_themes TO authenticated;
GRANT ALL ON public.strategic_themes TO service_role;
ALTER TABLE public.strategic_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes readable" ON public.strategic_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "themes leaders write" ON public.strategic_themes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
CREATE TRIGGER themes_updated_at BEFORE UPDATE ON public.strategic_themes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- STRATEGIC OBJECTIVES
CREATE TYPE public.objective_status AS ENUM ('not_started','on_track','at_risk','done');
CREATE TABLE public.strategic_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid REFERENCES public.strategic_themes(id) ON DELETE SET NULL,
  horizon_year int NOT NULL CHECK (horizon_year BETWEEN 1 AND 3),
  title text NOT NULL,
  description text,
  target_metric text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.objective_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.strategic_objectives TO authenticated;
GRANT ALL ON public.strategic_objectives TO service_role;
ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "objectives readable" ON public.strategic_objectives FOR SELECT TO authenticated USING (true);
CREATE POLICY "objectives leaders write" ON public.strategic_objectives FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
CREATE TRIGGER objectives_updated_at BEFORE UPDATE ON public.strategic_objectives
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- WORKSTREAMS
CREATE TABLE public.workstreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_value_usd numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workstreams TO authenticated;
GRANT ALL ON public.workstreams TO service_role;
ALTER TABLE public.workstreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workstreams readable" ON public.workstreams FOR SELECT TO authenticated USING (true);
CREATE POLICY "workstreams leaders write" ON public.workstreams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
CREATE TRIGGER workstreams_updated_at BEFORE UPDATE ON public.workstreams
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- INITIATIVES (Wave pipeline)
CREATE TYPE public.initiative_stage AS ENUM ('L0','L1','L2','L3','L4','L5');
CREATE TABLE public.initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workstream_id uuid NOT NULL REFERENCES public.workstreams(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  current_stage public.initiative_stage NOT NULL DEFAULT 'L0',
  gross_value_l1 numeric NOT NULL DEFAULT 0,
  validated_value_l2 numeric NOT NULL DEFAULT 0,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.initiatives TO authenticated;
GRANT ALL ON public.initiatives TO service_role;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "initiatives readable" ON public.initiatives FOR SELECT TO authenticated USING (true);
CREATE POLICY "initiatives write" ON public.initiatives FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'leader')
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'leader')
    OR owner_id = auth.uid()
  );
CREATE TRIGGER initiatives_updated_at BEFORE UPDATE ON public.initiatives
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- A3 REPORTS
CREATE TYPE public.a3_status AS ENUM ('draft','active','completed','archived');
CREATE TABLE public.a3_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.a3_status NOT NULL DEFAULT 'draft',
  problem_statement text,
  background text,
  current_condition text,
  goal text,
  root_cause text,
  countermeasures text,
  action_plan text,
  followup text,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.a3_reports TO authenticated;
GRANT ALL ON public.a3_reports TO service_role;
ALTER TABLE public.a3_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "a3 readable" ON public.a3_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "a3 insert" ON public.a3_reports FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "a3 update" ON public.a3_reports FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR created_by = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'leader')
  );
CREATE POLICY "a3 delete" ON public.a3_reports FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(),'admin')
  );
CREATE TRIGGER a3_updated_at BEFORE UPDATE ON public.a3_reports
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();