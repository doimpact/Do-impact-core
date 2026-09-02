ALTER TABLE public.profiles ALTER COLUMN company_quota SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.ensure_sample_company()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _cid uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _cid) THEN
    RETURN;
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role, access_level)
  VALUES (_cid, _uid, 'member', 'read')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  INSERT INTO public.user_active_company (user_id, company_id)
  VALUES (_uid, _cid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$function$;