ALTER TABLE public.compliance_snapshots
  ADD COLUMN IF NOT EXISTS framework text NOT NULL DEFAULT 'part145',
  ADD COLUMN IF NOT EXISTS auditor text,
  ADD COLUMN IF NOT EXISTS audit_date date;

UPDATE public.compliance_snapshots SET framework = 'part145' WHERE framework IS NULL;

CREATE INDEX IF NOT EXISTS compliance_snapshots_framework_idx
  ON public.compliance_snapshots (company_id, framework, created_at DESC);