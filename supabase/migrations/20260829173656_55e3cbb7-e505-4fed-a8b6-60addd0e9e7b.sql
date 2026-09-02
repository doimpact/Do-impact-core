CREATE OR REPLACE FUNCTION public.tg_enforce_company_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user uuid := COALESCE(NEW.created_by, auth.uid());
  _quota integer;
  _count integer;
BEGIN
  IF _user IS NULL OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_super_admin(_user) THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent company creation per user by locking the profile row.
  SELECT COALESCE(p.company_quota, 1) INTO _quota
  FROM public.profiles p
  WHERE p.id = _user
  FOR UPDATE;

  IF _quota IS NULL THEN
    _quota := 1;
  END IF;

  SELECT count(*) INTO _count
  FROM public.companies c
  WHERE c.created_by = _user;

  IF _count >= _quota THEN
    RAISE EXCEPTION 'Company quota reached for this account'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_enforce_company_quota() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_company_quota ON public.companies;
CREATE TRIGGER trg_enforce_company_quota
BEFORE INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_company_quota();

DROP POLICY IF EXISTS "restructuring_members company read" ON public.restructuring_members;
CREATE POLICY "restructuring_members company read"
ON public.restructuring_members
FOR SELECT
TO authenticated
USING (
  company_id = public.current_company_id()
  AND (
    public.is_company_member(company_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
);