-- 1. Company-scope user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

INSERT INTO public.user_roles (user_id, role, company_id)
SELECT DISTINCT ur.user_id, ur.role, cm.company_id
FROM public.user_roles ur
JOIN public.company_members cm ON cm.user_id = ur.user_id
WHERE ur.company_id IS NULL;

DELETE FROM public.user_roles WHERE company_id IS NULL;

ALTER TABLE public.user_roles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN company_id SET DEFAULT public.current_company_id();

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_company_role_key
  ON public.user_roles (user_id, company_id, role);

-- 2. Company-scoped role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _company_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND company_id = _company_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, public.current_company_id(), _role)
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated, service_role;

-- 3. New users no longer get a global role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- 4. user_roles read policy scoped to the active company
DROP POLICY IF EXISTS "user_roles read own" ON public.user_roles;
DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles read own in company" ON public.user_roles;
CREATE POLICY "user_roles read own in company"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id());

-- 5. proficiency_levels: read for authenticated, writes admin-only
DROP POLICY IF EXISTS "proficiency_levels auth delete" ON public.proficiency_levels;
DROP POLICY IF EXISTS "proficiency_levels auth update" ON public.proficiency_levels;
DROP POLICY IF EXISTS "proficiency_levels auth write" ON public.proficiency_levels;
DROP POLICY IF EXISTS "proficiency_levels auth read" ON public.proficiency_levels;

CREATE POLICY "proficiency_levels read" ON public.proficiency_levels
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "proficiency_levels admin insert" ON public.proficiency_levels
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proficiency_levels admin update" ON public.proficiency_levels
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "proficiency_levels admin delete" ON public.proficiency_levels
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));