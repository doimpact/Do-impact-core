ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS meeting_steps text[],
  ADD COLUMN IF NOT EXISTS meeting_presets jsonb NOT NULL DEFAULT '[]'::jsonb;