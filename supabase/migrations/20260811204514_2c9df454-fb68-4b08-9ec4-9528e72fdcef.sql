ALTER TABLE public.company_subscriptions
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

ALTER TABLE public.company_addons
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

DROP VIEW IF EXISTS public.company_entitlements;

CREATE VIEW public.company_entitlements
WITH (security_invoker = true) AS
SELECT c.id AS company_id,
    c.name AS company_name,
    s.plan_key,
    COALESCE(s.status, 'none') AS status,
    s.seats,
    public.company_seats_used(c.id) AS seats_used,
    s.term_start,
    s.term_end,
    COALESCE(s.environment, 'manual') AS environment,
    COALESCE(s.cancel_at_period_end, false) AS cancel_at_period_end,
    COALESCE(
      s.status IN ('active','trialing','past_due','cancelled','canceled')
      AND (s.term_start IS NULL OR s.term_start <= now())
      AND (s.term_end IS NULL OR s.term_end > now())
      AND NOT (s.status IN ('cancelled','canceled') AND s.term_end IS NULL),
      false) AS is_valid,
    s.currency,
    s.billing_period,
    s.pricing_mode,
    s.price_note,
    public.effective_price(s.pricing_mode, s.list_price, s.discount_pct, s.discount_amount, s.custom_price) AS plan_price,
    COALESCE((SELECT array_agg(a.addon_key ORDER BY a.addon_key)
       FROM public.company_addons a
      WHERE a.company_id = c.id
        AND a.status IN ('active','past_due','cancelled','canceled')
        AND (a.term_start IS NULL OR a.term_start <= now())
        AND (a.term_end IS NULL OR a.term_end > now())
        AND NOT (a.status IN ('cancelled','canceled') AND a.term_end IS NULL)), ARRAY[]::text[]) AS addon_keys,
    COALESCE((SELECT sum(public.effective_price(a.pricing_mode, a.list_price, a.discount_pct, a.discount_amount, a.custom_price))
       FROM public.company_addons a
      WHERE a.company_id = c.id
        AND a.status IN ('active','past_due','cancelled','canceled')
        AND (a.term_start IS NULL OR a.term_start <= now())
        AND (a.term_end IS NULL OR a.term_end > now())
        AND NOT (a.status IN ('cancelled','canceled') AND a.term_end IS NULL)), 0::numeric) AS addons_price
FROM public.companies c
LEFT JOIN public.company_subscriptions s ON s.company_id = c.id;

GRANT SELECT ON public.company_entitlements TO authenticated;
GRANT ALL ON public.company_entitlements TO service_role;

CREATE OR REPLACE FUNCTION public.company_subscription_status(_company uuid)
RETURNS TABLE(plan_key text, status text, seats integer, term_start timestamp with time zone, term_end timestamp with time zone, is_valid boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT s.plan_key, s.status, s.seats, s.term_start, s.term_end,
         (s.status IN ('active','trialing','past_due','cancelled','canceled')
          AND (s.term_start IS NULL OR s.term_start <= now())
          AND (s.term_end IS NULL OR s.term_end > now())
          AND NOT (s.status IN ('cancelled','canceled') AND s.term_end IS NULL)) AS is_valid
  FROM public.company_subscriptions s
  WHERE s.company_id = _company
    AND (public.is_company_member(_company, auth.uid()) OR public.is_super_admin(auth.uid()))
$function$;

CREATE OR REPLACE FUNCTION public.company_is_entitled(_company uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT s.status IN ('active','trialing','past_due','cancelled','canceled')
       AND (s.term_start IS NULL OR s.term_start <= now())
       AND (s.term_end IS NULL OR s.term_end > now())
       AND NOT (s.status IN ('cancelled','canceled') AND s.term_end IS NULL)
    FROM public.company_subscriptions s
    WHERE s.company_id = _company
  ), false);
$function$;

GRANT EXECUTE ON FUNCTION public.company_is_entitled(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.tg_company_bootstrap()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  VALUES (NEW.id, 'trial', 'trialing', 3, 'monthly', 'USD',
          'list', 0, now(), now() + interval '7 days', 'trial')
  ON CONFLICT (company_id) DO NOTHING;

  INSERT INTO public.ai_usage_limits(scope, company_id, monthly_credits)
  VALUES ('company', NEW.id, 20)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $function$;