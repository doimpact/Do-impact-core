
ALTER TABLE public.vsm_steps
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS first_pass_yield_pct numeric,
  ADD COLUMN IF NOT EXISTS working_time_per_shift_min numeric;

ALTER TABLE public.vsm_steps
  DROP CONSTRAINT IF EXISTS vsm_steps_state_check;
ALTER TABLE public.vsm_steps
  ADD CONSTRAINT vsm_steps_state_check CHECK (state IN ('current','future'));

ALTER TABLE public.vsm_inventories
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'current';
ALTER TABLE public.vsm_inventories
  DROP CONSTRAINT IF EXISTS vsm_inventories_state_check;
ALTER TABLE public.vsm_inventories
  ADD CONSTRAINT vsm_inventories_state_check CHECK (state IN ('current','future'));

ALTER TABLE public.vsm_info_flows
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'current';
ALTER TABLE public.vsm_info_flows
  DROP CONSTRAINT IF EXISTS vsm_info_flows_state_check;
ALTER TABLE public.vsm_info_flows
  ADD CONSTRAINT vsm_info_flows_state_check CHECK (state IN ('current','future'));

ALTER TABLE public.vsm_maps
  ADD COLUMN IF NOT EXISTS shifts integer,
  ADD COLUMN IF NOT EXISTS working_time_per_shift_min numeric;

CREATE INDEX IF NOT EXISTS vsm_steps_map_state_idx ON public.vsm_steps (map_id, state, position);
CREATE INDEX IF NOT EXISTS vsm_inventories_map_state_idx ON public.vsm_inventories (map_id, state);
CREATE INDEX IF NOT EXISTS vsm_info_flows_map_state_idx ON public.vsm_info_flows (map_id, state);
