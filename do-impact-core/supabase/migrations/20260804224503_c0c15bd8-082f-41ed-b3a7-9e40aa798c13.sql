ALTER TABLE public.contacts ADD COLUMN archived_at timestamptz NULL;
ALTER TABLE public.workstreams ADD COLUMN archived_at timestamptz NULL;
ALTER TABLE public.pillars ADD COLUMN archived_at timestamptz NULL;
ALTER TABLE public.employees ADD COLUMN archived_at timestamptz NULL;
ALTER TABLE public.skills ADD COLUMN archived_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_archived_at ON public.contacts(archived_at);
CREATE INDEX IF NOT EXISTS idx_workstreams_archived_at ON public.workstreams(archived_at);
CREATE INDEX IF NOT EXISTS idx_pillars_archived_at ON public.pillars(archived_at);
CREATE INDEX IF NOT EXISTS idx_employees_archived_at ON public.employees(archived_at);
CREATE INDEX IF NOT EXISTS idx_skills_archived_at ON public.skills(archived_at);