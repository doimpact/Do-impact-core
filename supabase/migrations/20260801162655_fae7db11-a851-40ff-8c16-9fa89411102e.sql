ALTER TABLE public.dm_escalations ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS dm_escalations_archived_idx ON public.dm_escalations (company_id, archived_at);