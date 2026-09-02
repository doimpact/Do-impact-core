ALTER TABLE public.company_subscriptions
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'list',
  ADD COLUMN IF NOT EXISTS list_price numeric,
  ADD COLUMN IF NOT EXISTS discount_pct numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric,
  ADD COLUMN IF NOT EXISTS custom_price numeric,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS price_note text;

ALTER TABLE public.company_addons
  ADD COLUMN IF NOT EXISTS pricing_mode text NOT NULL DEFAULT 'list',
  ADD COLUMN IF NOT EXISTS list_price numeric,
  ADD COLUMN IF NOT EXISTS discount_pct numeric,
  ADD COLUMN IF NOT EXISTS discount_amount numeric,
  ADD COLUMN IF NOT EXISTS custom_price numeric,
  ADD COLUMN IF NOT EXISTS price_note text;

CREATE OR REPLACE FUNCTION public.effective_price(
  _mode text, _list numeric, _pct numeric, _amount numeric, _custom numeric
) RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _mode = 'custom' THEN COALESCE(_custom, 0)
    WHEN _mode = 'discount' THEN GREATEST(
      COALESCE(_list, 0) - COALESCE(_amount, 0) - (COALESCE(_list, 0) * COALESCE(_pct, 0) / 100.0), 0)
    ELSE COALESCE(_list, 0)
  END
$$;

CREATE OR REPLACE FUNCTION public.company_seats_used(_company uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT count(*) FROM public.company_members WHERE company_id = _company)
       + (SELECT count(*) FROM public.company_invites
           WHERE company_id = _company AND status = 'pending' AND expires_at > now())
$$;

CREATE OR REPLACE FUNCTION public.enforce_seat_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _seats integer;
BEGIN
  IF public.is_super_admin() THEN RETURN NEW; END IF;

  SELECT seats INTO _seats FROM public.company_subscriptions WHERE company_id = NEW.company_id;
  IF _seats IS NULL THEN RETURN NEW; END IF;

  IF public.company_seats_used(NEW.company_id) >= _seats THEN
    RAISE EXCEPTION 'All % seats in this workspace are in use. Remove a person or add seats to the subscription.', _seats;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_seat_limit_members ON public.company_members;
CREATE TRIGGER enforce_seat_limit_members
  BEFORE INSERT ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_seat_limit();

DROP TRIGGER IF EXISTS enforce_seat_limit_invites ON public.company_invites;
CREATE TRIGGER enforce_seat_limit_invites
  BEFORE INSERT ON public.company_invites
  FOR EACH ROW EXECUTE FUNCTION public.enforce_seat_limit();

CREATE OR REPLACE VIEW public.company_entitlements
WITH (security_invoker = true) AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  s.plan_key,
  COALESCE(s.status, 'none') AS status,
  s.seats,
  public.company_seats_used(c.id) AS seats_used,
  s.term_start,
  s.term_end,
  COALESCE(
    s.status = 'active'
    AND (s.term_start IS NULL OR s.term_start <= now())
    AND (s.term_end IS NULL OR s.term_end > now()), false) AS is_valid,
  s.currency,
  s.billing_period,
  s.pricing_mode,
  s.price_note,
  public.effective_price(s.pricing_mode, s.list_price, s.discount_pct, s.discount_amount, s.custom_price) AS plan_price,
  COALESCE((
    SELECT array_agg(a.addon_key ORDER BY a.addon_key)
    FROM public.company_addons a
    WHERE a.company_id = c.id
      AND a.status = 'active'
      AND (a.term_start IS NULL OR a.term_start <= now())
      AND (a.term_end IS NULL OR a.term_end > now())
  ), ARRAY[]::text[]) AS addon_keys,
  COALESCE((
    SELECT sum(public.effective_price(a.pricing_mode, a.list_price, a.discount_pct, a.discount_amount, a.custom_price))
    FROM public.company_addons a
    WHERE a.company_id = c.id
      AND a.status = 'active'
      AND (a.term_start IS NULL OR a.term_start <= now())
      AND (a.term_end IS NULL OR a.term_end > now())
  ), 0) AS addons_price
FROM public.companies c
LEFT JOIN public.company_subscriptions s ON s.company_id = c.id;

GRANT SELECT ON public.company_entitlements TO authenticated;
GRANT ALL ON public.company_entitlements TO service_role;