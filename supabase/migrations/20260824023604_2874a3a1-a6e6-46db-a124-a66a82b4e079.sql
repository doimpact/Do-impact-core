ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS overview_how_it_works_collapsed boolean NOT NULL DEFAULT false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;