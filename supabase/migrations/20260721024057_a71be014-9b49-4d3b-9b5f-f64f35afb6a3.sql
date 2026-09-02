
-- Link initiatives to strategic objectives (3-year roadmap)
ALTER TABLE public.initiatives
  ADD COLUMN IF NOT EXISTS source_objective_id uuid UNIQUE
    REFERENCES public.strategic_objectives(id) ON DELETE CASCADE;

-- Ensure a default workstream to host roadmap-derived initiatives
INSERT INTO public.workstreams (name, target_value_usd)
SELECT '3-Year Roadmap Objectives', 0
WHERE NOT EXISTS (SELECT 1 FROM public.workstreams WHERE name = '3-Year Roadmap Objectives');

-- Helper: default workstream id
CREATE OR REPLACE FUNCTION public.roadmap_workstream_id()
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT id FROM public.workstreams WHERE name = '3-Year Roadmap Objectives' LIMIT 1
$$;

-- Trigger: mirror strategic_objectives -> initiatives
CREATE OR REPLACE FUNCTION public.tg_sync_objective_initiative()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  ws_id uuid;
  v_sum numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  ws_id := public.roadmap_workstream_id();

  SELECT COALESCE(SUM(value),0) INTO v_sum
  FROM public.objective_monthly_benefits WHERE objective_id = NEW.id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.initiatives (source_objective_id, workstream_id, title, description, owner_id, gross_value_l1, archived_at)
    VALUES (NEW.id, ws_id, NEW.title, NEW.description, NEW.owner_id, v_sum, NEW.archived_at)
    ON CONFLICT (source_objective_id) DO NOTHING;
  ELSE
    UPDATE public.initiatives
    SET title = NEW.title,
        description = NEW.description,
        owner_id = NEW.owner_id,
        archived_at = NEW.archived_at
    WHERE source_objective_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_objective_initiative ON public.strategic_objectives;
CREATE TRIGGER trg_sync_objective_initiative
AFTER INSERT OR UPDATE ON public.strategic_objectives
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_objective_initiative();

-- Trigger: keep initiative gross_value_l1 = sum of monthly benefits for the objective
CREATE OR REPLACE FUNCTION public.tg_sync_objective_benefit_sum()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  obj_id uuid;
  v_sum numeric;
BEGIN
  obj_id := COALESCE(NEW.objective_id, OLD.objective_id);
  SELECT COALESCE(SUM(value),0) INTO v_sum
  FROM public.objective_monthly_benefits WHERE objective_id = obj_id;
  UPDATE public.initiatives SET gross_value_l1 = v_sum WHERE source_objective_id = obj_id;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_objective_benefit_sum ON public.objective_monthly_benefits;
CREATE TRIGGER trg_sync_objective_benefit_sum
AFTER INSERT OR UPDATE OR DELETE ON public.objective_monthly_benefits
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_objective_benefit_sum();

-- Backfill: create initiatives for existing objectives
INSERT INTO public.initiatives (source_objective_id, workstream_id, title, description, owner_id, gross_value_l1, archived_at)
SELECT o.id,
       public.roadmap_workstream_id(),
       o.title,
       o.description,
       o.owner_id,
       COALESCE((SELECT SUM(value) FROM public.objective_monthly_benefits b WHERE b.objective_id = o.id), 0),
       o.archived_at
FROM public.strategic_objectives o
WHERE NOT EXISTS (SELECT 1 FROM public.initiatives i WHERE i.source_objective_id = o.id);
