-- Remove blanket column access to profiles.email for signed-in users
REVOKE SELECT ON TABLE public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, created_at, updated_at, title, manager_id, company_quota, free_started_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Need-to-know email access: self, workspace admins/owners, platform admins
CREATE OR REPLACE VIEW public.profile_emails
WITH (security_barrier = true) AS
SELECT p.id, p.email
FROM public.profiles p
WHERE p.id = auth.uid()
   OR public.is_super_admin(auth.uid())
   OR EXISTS (
     SELECT 1
     FROM public.company_members cm
     WHERE cm.user_id = p.id
       AND (
         public.is_company_admin(cm.company_id, auth.uid())
         OR public.is_company_owner(cm.company_id, auth.uid())
       )
   );

REVOKE ALL ON public.profile_emails FROM anon;
GRANT SELECT ON public.profile_emails TO authenticated;
GRANT ALL ON public.profile_emails TO service_role;