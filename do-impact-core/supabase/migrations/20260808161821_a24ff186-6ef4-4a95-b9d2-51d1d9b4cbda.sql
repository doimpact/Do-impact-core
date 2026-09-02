ALTER TABLE public.voc_notes ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.voc_tasks ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.voc_metrics ADD COLUMN IF NOT EXISTS archived_at timestamptz;