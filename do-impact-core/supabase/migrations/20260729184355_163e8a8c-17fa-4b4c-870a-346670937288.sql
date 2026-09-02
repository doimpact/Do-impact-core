CREATE OR REPLACE FUNCTION public.ai_usage_this_month(_user uuid, _company uuid DEFAULT NULL::uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _user <> auth.uid()
     AND NOT public.is_super_admin(auth.uid())
     AND NOT (_company IS NOT NULL AND public.is_company_admin(_company, auth.uid())) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN (SELECT COALESCE(SUM(credits),0) FROM public.ai_usage_events
          WHERE user_id = _user
            AND created_at >= date_trunc('month', now())
            AND (_company IS NULL OR company_id = _company));
END $function$;

CREATE OR REPLACE FUNCTION public.ai_limit_for(_user uuid, _company uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _user <> auth.uid()
     AND NOT public.is_super_admin(auth.uid())
     AND NOT (_company IS NOT NULL AND public.is_company_admin(_company, auth.uid())) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN COALESCE(
    (SELECT monthly_credits FROM public.ai_usage_limits WHERE scope='user' AND user_id=_user AND company_id=_company),
    (SELECT monthly_credits FROM public.ai_usage_limits WHERE scope='company' AND company_id=_company),
    (SELECT monthly_credits FROM public.ai_usage_limits WHERE scope='global'),
    0);
END $function$;

REVOKE EXECUTE ON FUNCTION public.ai_usage_this_month(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_limit_for(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ai_usage_this_month(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_limit_for(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_addon(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.company_subscription_status(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.company_seats_used(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_seat_limit() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.has_addon(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.company_subscription_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.company_seats_used(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enforce_seat_limit() TO service_role;