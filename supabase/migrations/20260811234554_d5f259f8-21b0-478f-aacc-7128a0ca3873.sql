ALTER TABLE public.profiles ALTER COLUMN company_quota SET DEFAULT 1;
UPDATE public.profiles p
SET company_quota = 1
WHERE COALESCE(p.company_quota, 0) = 0
  AND (SELECT count(*) FROM public.companies c WHERE c.created_by = p.id) = 0;