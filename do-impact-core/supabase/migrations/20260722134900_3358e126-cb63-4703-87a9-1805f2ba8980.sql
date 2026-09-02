
-- 1. Add monthly date columns to waterfall_bridges
ALTER TABLE public.waterfall_bridges
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- 2. Add per-item target month
ALTER TABLE public.waterfall_items
  ADD COLUMN IF NOT EXISTS target_month date;

-- 3. Link initiatives back to a waterfall item
ALTER TABLE public.initiatives
  ADD COLUMN IF NOT EXISTS source_waterfall_item_id uuid UNIQUE
    REFERENCES public.waterfall_items(id) ON DELETE SET NULL;

-- 4. Let objective_actions belong to either an objective OR a waterfall item
ALTER TABLE public.objective_actions
  ALTER COLUMN objective_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS waterfall_item_id uuid
    REFERENCES public.waterfall_items(id) ON DELETE CASCADE;

ALTER TABLE public.objective_actions
  DROP CONSTRAINT IF EXISTS objective_actions_parent_chk;
ALTER TABLE public.objective_actions
  ADD CONSTRAINT objective_actions_parent_chk
  CHECK (objective_id IS NOT NULL OR waterfall_item_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_objective_actions_waterfall_item
  ON public.objective_actions(waterfall_item_id);
