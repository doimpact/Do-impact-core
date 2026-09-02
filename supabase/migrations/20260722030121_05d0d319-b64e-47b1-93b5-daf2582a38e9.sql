ALTER TABLE public.booked_backlog ADD COLUMN IF NOT EXISTS stream text NOT NULL DEFAULT 'Default';

DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname FROM pg_constraint
   WHERE conrelid = 'public.booked_backlog'::regclass AND contype='u'
     AND pg_get_constraintdef(oid) ILIKE '%(year, month)%'
     AND pg_get_constraintdef(oid) NOT ILIKE '%stream%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.booked_backlog DROP CONSTRAINT %I', cname);
  END IF;
END $$;

DROP INDEX IF EXISTS public.booked_backlog_year_month_key;

ALTER TABLE public.booked_backlog
  DROP CONSTRAINT IF EXISTS booked_backlog_year_month_stream_key;
ALTER TABLE public.booked_backlog
  ADD CONSTRAINT booked_backlog_year_month_stream_key UNIQUE (year, month, stream);