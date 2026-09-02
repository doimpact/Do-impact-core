ALTER TABLE public.company_addons
  ADD COLUMN IF NOT EXISTS term_start timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS term_end timestamptz;

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_key text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'active',
  seats integer,
  term_start timestamptz NOT NULL DEFAULT now(),
  term_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_subscriptions TO authenticated;
GRANT ALL ON public.company_subscriptions TO service_role;

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can see their company subscription"
  ON public.company_subscriptions FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins insert subscriptions"
  ON public.company_subscriptions FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins update subscriptions"
  ON public.company_subscriptions FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins delete subscriptions"
  ON public.company_subscriptions FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER company_subscriptions_updated_at
  BEFORE UPDATE ON public.company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_addon(_company uuid, _key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_addons
    WHERE company_id = _company
      AND addon_key = _key
      AND status = 'active'
      AND (term_start IS NULL OR term_start <= now())
      AND (term_end IS NULL OR term_end > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.company_subscription_status(_company uuid)
RETURNS TABLE (plan_key text, status text, seats integer, term_start timestamptz, term_end timestamptz, is_valid boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.plan_key,
         s.status,
         s.seats,
         s.term_start,
         s.term_end,
         (s.status = 'active'
          AND (s.term_start IS NULL OR s.term_start <= now())
          AND (s.term_end IS NULL OR s.term_end > now())) AS is_valid
  FROM public.company_subscriptions s
  WHERE s.company_id = _company
    AND (public.is_company_member(_company, auth.uid()) OR public.is_super_admin(auth.uid()))
$$;