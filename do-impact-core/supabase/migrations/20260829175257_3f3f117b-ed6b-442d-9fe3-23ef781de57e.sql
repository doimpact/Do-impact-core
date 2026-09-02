DROP VIEW IF EXISTS public.profile_emails;

CREATE OR REPLACE FUNCTION public.profile_emails_for(_ids uuid[])
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND (
      p.id = auth.uid()
      OR public.is_super_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = p.id
          AND (public.is_company_admin(cm.company_id, auth.uid())
               OR public.is_company_owner(cm.company_id, auth.uid()))
      )
    )
$$;

REVOKE ALL ON FUNCTION public.profile_emails_for(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_emails_for(uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_profile_ids_by_email(_needle text)
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE _needle IS NOT NULL
    AND length(btrim(_needle)) > 0
    AND p.email ILIKE '%' || btrim(_needle) || '%'
    AND (
      p.id = auth.uid()
      OR public.is_super_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = p.id
          AND (public.is_company_admin(cm.company_id, auth.uid())
               OR public.is_company_owner(cm.company_id, auth.uid()))
      )
    )
  LIMIT 500
$$;

REVOKE ALL ON FUNCTION public.search_profile_ids_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profile_ids_by_email(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_profile_email(_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(btrim(p.email), '') <> ''
  FROM public.profiles p
  WHERE p.id = _id
$$;

REVOKE ALL ON FUNCTION public.has_profile_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_profile_email(uuid) TO authenticated, service_role;