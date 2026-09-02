UPDATE public.companies c
SET pending_checkout = true
WHERE c.id = 'fbec49c3-9e2d-4cfb-bafb-57001f6740dd'::uuid
  AND c.is_template = false
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