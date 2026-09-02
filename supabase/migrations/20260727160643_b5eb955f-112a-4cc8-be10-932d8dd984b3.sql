ALTER TABLE public.toc_analyses ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.cld_diagrams ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.ibp_cycles ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.hoshin_reviews ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.journey_maps ADD COLUMN IF NOT EXISTS archived_at timestamptz;