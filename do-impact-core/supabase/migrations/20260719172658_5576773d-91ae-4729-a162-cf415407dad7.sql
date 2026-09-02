ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TYPE calendar_event_type ADD VALUE IF NOT EXISTS 'event';