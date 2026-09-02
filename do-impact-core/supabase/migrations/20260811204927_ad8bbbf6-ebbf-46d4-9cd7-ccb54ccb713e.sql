INSERT INTO public.company_subscriptions(
  company_id, plan_key, status, seats, billing_period, currency,
  pricing_mode, list_price, term_start, term_end, environment)
SELECT c.id, 'trial', 'trialing', 3, 'monthly', 'USD', 'list', 0,
       now(), now() + interval '7 days', 'trial'
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.company_subscriptions s WHERE s.company_id = c.id);