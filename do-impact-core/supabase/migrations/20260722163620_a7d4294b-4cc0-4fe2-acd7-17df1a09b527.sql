
ALTER TABLE public.workstreams
  ADD COLUMN IF NOT EXISTS source_bridge_id uuid UNIQUE REFERENCES public.waterfall_bridges(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.tg_sync_bridge_workstream()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ws_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.workstreams WHERE source_bridge_id = OLD.id;
    RETURN OLD;
  END IF;
  ws_name := 'Bridge: ' || COALESCE(NEW.title, 'Untitled');
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.workstreams (name, source_bridge_id, company_id)
    VALUES (ws_name, NEW.id, NEW.company_id)
    ON CONFLICT (source_bridge_id) DO NOTHING;
  ELSE
    UPDATE public.workstreams SET name = ws_name WHERE source_bridge_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_sync_bridge_workstream ON public.waterfall_bridges;
CREATE TRIGGER tg_sync_bridge_workstream
AFTER INSERT OR UPDATE OF title OR DELETE ON public.waterfall_bridges
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_bridge_workstream();

CREATE OR REPLACE FUNCTION public.tg_sync_waterfall_item_initiative()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ws_id uuid;
  eff numeric;
  b_company uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.initiatives WHERE source_waterfall_item_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT id, company_id INTO ws_id, b_company
  FROM public.workstreams WHERE source_bridge_id = NEW.bridge_id;

  IF ws_id IS NULL THEN
    SELECT company_id INTO b_company FROM public.waterfall_bridges WHERE id = NEW.bridge_id;
    INSERT INTO public.workstreams (name, source_bridge_id, company_id)
    SELECT 'Bridge: ' || COALESCE(title,'Untitled'), id, company_id
    FROM public.waterfall_bridges WHERE id = NEW.bridge_id
    RETURNING id INTO ws_id;
  END IF;

  eff := abs(COALESCE(NEW.gross_impact,0)) * COALESCE(NEW.realization_pct,0) / 100.0;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.initiatives (
      workstream_id, title, owner_id, gross_value_l1,
      current_stage, source_waterfall_item_id, archived_at, company_id
    ) VALUES (
      ws_id, NEW.label, NEW.owner_id, eff,
      'L1'::public.initiative_stage, NEW.id, NEW.archived_at, b_company
    ) ON CONFLICT (source_waterfall_item_id) DO NOTHING;
  ELSE
    UPDATE public.initiatives
      SET workstream_id = ws_id,
          title = NEW.label,
          owner_id = NEW.owner_id,
          gross_value_l1 = eff,
          archived_at = NEW.archived_at
      WHERE source_waterfall_item_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_sync_waterfall_item_initiative ON public.waterfall_items;
CREATE TRIGGER tg_sync_waterfall_item_initiative
AFTER INSERT OR UPDATE OR DELETE ON public.waterfall_items
FOR EACH ROW EXECUTE FUNCTION public.tg_sync_waterfall_item_initiative();

-- Backfill workstreams for existing bridges
INSERT INTO public.workstreams (name, source_bridge_id, company_id)
SELECT 'Bridge: ' || COALESCE(b.title,'Untitled'), b.id, b.company_id
FROM public.waterfall_bridges b
WHERE NOT EXISTS (SELECT 1 FROM public.workstreams w WHERE w.source_bridge_id = b.id);

-- Backfill initiatives for existing items
INSERT INTO public.initiatives (
  workstream_id, title, owner_id, gross_value_l1,
  current_stage, source_waterfall_item_id, archived_at, company_id
)
SELECT w.id, i.label, i.owner_id,
       abs(COALESCE(i.gross_impact,0)) * COALESCE(i.realization_pct,0) / 100.0,
       'L1'::public.initiative_stage, i.id, i.archived_at, w.company_id
FROM public.waterfall_items i
JOIN public.workstreams w ON w.source_bridge_id = i.bridge_id
WHERE NOT EXISTS (SELECT 1 FROM public.initiatives x WHERE x.source_waterfall_item_id = i.id);
