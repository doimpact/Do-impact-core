ALTER FUNCTION public.duplicate_company(uuid, text) RENAME TO duplicate_company_impl;

REVOKE ALL ON FUNCTION public.duplicate_company_impl(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.duplicate_company(_source uuid, _new_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.can_create_company(_uid) THEN
    RAISE EXCEPTION 'Workspace limit reached for your plan';
  END IF;
  RETURN public.duplicate_company_impl(_source, _new_name);
END;
$function$;

REVOKE ALL ON FUNCTION public.duplicate_company(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_company(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duplicate_company_impl(uuid, text) TO service_role;