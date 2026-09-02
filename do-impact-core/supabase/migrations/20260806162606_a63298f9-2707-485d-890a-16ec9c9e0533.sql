ALTER TABLE public.siop_capacity
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_ref uuid;

CREATE UNIQUE INDEX IF NOT EXISTS siop_capacity_cycle_source_ref_idx
  ON public.siop_capacity (cycle_id, source_ref)
  WHERE source = 'aps';