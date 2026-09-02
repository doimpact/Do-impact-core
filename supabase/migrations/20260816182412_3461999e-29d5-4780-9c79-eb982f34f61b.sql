ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS pending_checkout boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS companies_pending_checkout_idx
  ON public.companies (pending_checkout)
  WHERE pending_checkout = true;

UPDATE public.companies c
SET pending_checkout = true
WHERE c.is_template = false
  AND EXISTS (
    SELECT 1
    FROM public.demo_leads dl
    JOIN public.profiles p ON lower(p.email) = lower(dl.email)
    WHERE p.id = c.created_by
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.company_billing cb
    WHERE cb.company_id = c.id
      AND cb.status IN ('active', 'trialing', 'past_due')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.company_subscriptions cs
    WHERE cs.company_id = c.id
      AND cs.status IN ('active', 'trialing', 'past_due')
  );

UPDATE public.profiles p
SET company_quota = 0
WHERE EXISTS (
  SELECT 1 FROM public.demo_leads dl
  WHERE lower(dl.email) = lower(p.email)
);

INSERT INTO public.company_members (company_id, user_id, role, access_level)
SELECT
  '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'::uuid,
  p.id,
  'member'::public.company_role,
  'read'::public.access_level
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.demo_leads dl
  WHERE lower(dl.email) = lower(p.email)
)
ON CONFLICT (company_id, user_id)
DO UPDATE SET role = 'member'::public.company_role, access_level = 'read'::public.access_level;

INSERT INTO public.user_active_company (user_id, company_id)
SELECT
  p.id,
  '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'::uuid
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.demo_leads dl
  WHERE lower(dl.email) = lower(p.email)
)
ON CONFLICT (user_id)
DO UPDATE SET company_id = EXCLUDED.company_id;