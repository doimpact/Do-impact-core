ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS kpis_archived_at_idx ON public.kpis (archived_at);