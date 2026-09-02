ALTER TABLE public.strategic_objectives ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.initiatives ADD COLUMN IF NOT EXISTS archived_at timestamptz;