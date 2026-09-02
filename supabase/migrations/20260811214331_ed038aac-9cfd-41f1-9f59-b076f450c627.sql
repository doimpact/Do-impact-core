DELETE FROM public.company_subscriptions
WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';

UPDATE public.company_subscriptions
SET plan_key = 'trial', status = 'trialing', seats = 1, billing_period = 'monthly',
    currency = 'USD', pricing_mode = 'list', list_price = 0,
    term_start = now(), term_end = now() + interval '7 days', environment = 'trial'
WHERE environment = 'manual';

UPDATE public.company_subscriptions
SET seats = 1
WHERE plan_key = 'trial' AND seats IS DISTINCT FROM 1;

CREATE OR REPLACE FUNCTION public.tg_company_bootstrap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.company_members(company_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (company_id, user_id) DO NOTHING;

    INSERT INTO public.user_active_company(user_id, company_id)
    VALUES (NEW.created_by, NEW.id)
    ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id, updated_at = now();
  END IF;

  INSERT INTO public.company_subscriptions(
    company_id, plan_key, status, seats, billing_period, currency,
    pricing_mode, list_price, term_start, term_end, environment)
  VALUES (NEW.id, 'trial', 'trialing', 1, 'monthly', 'USD',
          'list', 0, now(), now() + interval '7 days', 'trial')
  ON CONFLICT (company_id) DO NOTHING;

  INSERT INTO public.ai_usage_limits(scope, company_id, monthly_credits)
  VALUES ('company', NEW.id, 20)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;