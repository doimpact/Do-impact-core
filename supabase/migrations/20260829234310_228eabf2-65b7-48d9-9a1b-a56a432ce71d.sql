ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS tour_state JSONB NOT NULL DEFAULT '{}'::jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
