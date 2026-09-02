
ALTER TABLE public.strategic_objectives ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'L1';
ALTER TABLE public.strategic_objectives DROP CONSTRAINT IF EXISTS strategic_objectives_stage_check;
ALTER TABLE public.strategic_objectives ADD CONSTRAINT strategic_objectives_stage_check CHECK (stage IN ('L1','L3','L4','L5'));

CREATE OR REPLACE FUNCTION public.tg_sync_objective_initiative()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
    INSERT INTO public.initiatives (source_objective_id, workstream_id, title, description, owner_id, gross_value_l1, current_stage, archived_at)
    VALUES (NEW.id, ws_id, NEW.title, NEW.description, NEW.owner_id, v_sum, NEW.stage::public.initiative_stage, NEW.archived_at)
    ON CONFLICT (source_objective_id) DO NOTHING;
  ELSE
    UPDATE public.initiatives
    SET title = NEW.title,
        description = NEW.description,
        owner_id = NEW.owner_id,
        current_stage = NEW.stage::public.initiative_stage,
        archived_at = NEW.archived_at
    WHERE source_objective_id = NEW.id;
  END IF;
  RETURN NEW;
END; $function$;

UPDATE public.initiatives i
SET current_stage = o.stage::public.initiative_stage
FROM public.strategic_objectives o
WHERE i.source_objective_id = o.id;
