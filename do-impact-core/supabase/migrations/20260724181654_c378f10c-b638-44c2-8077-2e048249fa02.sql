
CREATE OR REPLACE FUNCTION public.join_showcase_company()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cid uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (_cid, _uid, 'member')
  ON CONFLICT (company_id, user_id) DO NOTHING;
  INSERT INTO public.user_active_company (user_id, company_id)
  VALUES (_uid, _cid)
  ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_showcase_company() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_showcase_company() TO authenticated;
