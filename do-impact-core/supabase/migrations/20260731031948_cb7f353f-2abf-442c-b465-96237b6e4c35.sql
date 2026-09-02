CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name text NOT NULL DEFAULT 'doimpact.llc',
  legal_address text,
  support_email text NOT NULL DEFAULT 'operator@example.com',
  business_currency text NOT NULL DEFAULT 'EUR',
  cost_baseline_monthly numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can manage business settings"
  ON public.business_settings
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_super_admin(auth.uid())));

CREATE TRIGGER tg_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Seed the default row.
INSERT INTO public.business_settings (entity_name, legal_address, support_email, business_currency, cost_baseline_monthly)
VALUES ('doimpact.llc', NULL, 'operator@example.com', 'EUR', 0)
ON CONFLICT DO NOTHING;
