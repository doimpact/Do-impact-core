ALTER TABLE public.pillars ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS pillars_owner_id_idx ON public.pillars(owner_id);