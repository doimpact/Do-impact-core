ALTER TABLE public.strategic_objectives
  ADD COLUMN IF NOT EXISTS source_waterfall_item_id uuid REFERENCES public.waterfall_items(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS strategic_objectives_source_waterfall_item_key
  ON public.strategic_objectives (source_waterfall_item_id)
  WHERE source_waterfall_item_id IS NOT NULL;