CREATE OR REPLACE FUNCTION public.roadmap_workstream_id(_company_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT id
  FROM public.workstreams
  WHERE name = '3-Year Roadmap Objectives'
    AND company_id = _company_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.roadmap_workstream_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT public.roadmap_workstream_id(public.current_company_id())
$$;

CREATE OR REPLACE FUNCTION public.tg_sync_objective_initiative()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  ws_id uuid;
  v_sum numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  ws_id := public.roadmap_workstream_id(NEW.company_id);

  IF ws_id IS NULL THEN
    INSERT INTO public.workstreams (name, company_id)
    VALUES ('3-Year Roadmap Objectives', NEW.company_id)
    RETURNING id INTO ws_id;
  END IF;

  SELECT COALESCE(SUM(value), 0) INTO v_sum
  FROM public.objective_monthly_benefits
  WHERE objective_id = NEW.id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.initiatives (
      source_objective_id,
      workstream_id,
      title,
      description,
      owner_id,
      gross_value_l1,
      current_stage,
      archived_at,
      company_id
    ) VALUES (
      NEW.id,
      ws_id,
      NEW.title,
      NEW.description,
      NEW.owner_id,
      v_sum,
      NEW.stage::public.initiative_stage,
      NEW.archived_at,
      NEW.company_id
    )
    ON CONFLICT (source_objective_id) DO NOTHING;
  ELSE
    UPDATE public.initiatives
    SET title = NEW.title,
        description = NEW.description,
        owner_id = NEW.owner_id,
        current_stage = NEW.stage::public.initiative_stage,
        archived_at = NEW.archived_at,
        company_id = NEW.company_id,
        workstream_id = ws_id
    WHERE source_objective_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_sync_objective_benefit_sum()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  obj_id uuid;
  v_sum numeric;
BEGIN
  obj_id := COALESCE(NEW.objective_id, OLD.objective_id);

  SELECT COALESCE(SUM(value), 0) INTO v_sum
  FROM public.objective_monthly_benefits
  WHERE objective_id = obj_id;

  UPDATE public.initiatives
  SET gross_value_l1 = v_sum
  WHERE source_objective_id = obj_id;

  RETURN NULL;
END;
$$;