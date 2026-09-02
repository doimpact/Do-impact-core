CREATE TABLE public.company_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'sandbox',
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  kind text NOT NULL DEFAULT 'plan',
  item_key text,
  price_id text,
  status text NOT NULL DEFAULT 'active',
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stripe_subscription_id)
);

CREATE INDEX idx_company_billing_company ON public.company_billing(company_id, environment);

GRANT SELECT ON public.company_billing TO authenticated;
GRANT ALL ON public.company_billing TO service_role;

ALTER TABLE public.company_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace admins can view their billing link"
  ON public.company_billing FOR SELECT
  TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE TRIGGER company_billing_set_updated_at
  BEFORE UPDATE ON public.company_billing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();