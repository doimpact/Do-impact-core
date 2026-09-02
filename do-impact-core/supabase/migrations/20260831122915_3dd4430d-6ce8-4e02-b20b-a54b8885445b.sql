ALTER TABLE public.demo_leads ADD COLUMN IF NOT EXISTS landing_variant text;

CREATE TABLE IF NOT EXISTS public.landing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  variant text,
  attribution jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.landing_events TO anon;
GRANT INSERT ON public.landing_events TO authenticated;
GRANT ALL ON public.landing_events TO service_role;

ALTER TABLE public.landing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a landing event"
  ON public.landing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Platform admins can read landing events"
  ON public.landing_events FOR SELECT
  TO authenticated
  USING (public.is_super_admin(auth.uid()));