-- 1. Access level on memberships -------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.access_level AS ENUM ('read','write','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.company_members
  ADD COLUMN IF NOT EXISTS access_level public.access_level NOT NULL DEFAULT 'write',
  ADD COLUMN IF NOT EXISTS allowed_modules text[];

UPDATE public.company_members
SET access_level = 'admin'
WHERE role IN ('owner','admin') AND access_level = 'write';

-- 2. Platform super admins ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user);
$$;

DROP POLICY IF EXISTS "read own or super admin" ON public.platform_admins;
CREATE POLICY "read own or super admin" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "super admins manage" ON public.platform_admins;
CREATE POLICY "super admins manage" ON public.platform_admins
  FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

INSERT INTO public.platform_admins (user_id)
SELECT id FROM public.profiles ORDER BY created_at LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Access helpers ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_access_level(_company uuid)
RETURNS public.access_level LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.is_super_admin() THEN 'admin'::public.access_level
    ELSE (SELECT access_level FROM public.company_members
          WHERE company_id = _company AND user_id = auth.uid())
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_write_access(_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.my_access_level(_company) IN ('write','admin'), false);
$$;

CREATE OR REPLACE FUNCTION public.has_module_access(_company uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.is_super_admin() THEN true
    ELSE COALESCE(
      (SELECT allowed_modules IS NULL OR _key = ANY(allowed_modules)
       FROM public.company_members
       WHERE company_id = _company AND user_id = auth.uid()), false)
  END;
$$;

-- membership visibility for super admins + self-management by company admins
DROP POLICY IF EXISTS "members view members" ON public.company_members;
CREATE POLICY "members view members" ON public.company_members
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()) OR public.is_super_admin());

DROP POLICY IF EXISTS "admins add members" ON public.company_members;
CREATE POLICY "admins add members" ON public.company_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin());

DROP POLICY IF EXISTS "admins update members" ON public.company_members;
CREATE POLICY "admins update members" ON public.company_members
  FOR UPDATE TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin())
  WITH CHECK (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin());

DROP POLICY IF EXISTS "admins remove members" ON public.company_members;
CREATE POLICY "admins remove members" ON public.company_members
  FOR DELETE TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin());

-- profiles: super admins can list every user
DROP POLICY IF EXISTS "super admins read all profiles" ON public.profiles;
CREATE POLICY "super admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_super_admin());

-- companies: super admins can list every company
DROP POLICY IF EXISTS "super admins read all companies" ON public.companies;
CREATE POLICY "super admins read all companies" ON public.companies
  FOR SELECT TO authenticated USING (public.is_super_admin());

-- 4. Read-only enforcement trigger ------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_write_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid; _lvl public.access_level;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  IF TG_OP = 'DELETE' THEN _cid := OLD.company_id; ELSE _cid := NEW.company_id; END IF;
  IF _cid IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  SELECT access_level INTO _lvl FROM public.company_members
   WHERE company_id = _cid AND user_id = auth.uid();
  IF _lvl = 'read' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'You have read-only access to this company.';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.table_name FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.column_name='company_id'
      AND c.table_name NOT IN ('company_members','user_active_company')
      AND EXISTS (SELECT 1 FROM information_schema.tables t
                  WHERE t.table_schema='public' AND t.table_name=c.table_name
                    AND t.table_type='BASE TABLE')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_write_access ON public.%I', r.table_name);
    EXECUTE format('CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()', r.table_name);
  END LOOP;
END $$;

-- 5. Invites -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_level public.access_level NOT NULL DEFAULT 'write',
  allowed_modules text[],
  token text NOT NULL DEFAULT encode(gen_random_bytes(16),'hex'),
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS company_invites_pending_uniq
  ON public.company_invites (company_id, lower(email)) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_invites TO authenticated;
GRANT ALL ON public.company_invites TO service_role;
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read invites" ON public.company_invites;
CREATE POLICY "admins read invites" ON public.company_invites
  FOR SELECT TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin());

DROP POLICY IF EXISTS "admins write invites" ON public.company_invites;
CREATE POLICY "admins write invites" ON public.company_invites
  FOR ALL TO authenticated
  USING (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin())
  WITH CHECK (public.is_company_admin(company_id, auth.uid()) OR public.is_super_admin());

DROP TRIGGER IF EXISTS trg_invites_updated_at ON public.company_invites;
CREATE TRIGGER trg_invites_updated_at BEFORE UPDATE ON public.company_invites
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.accept_pending_invites()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _n int := 0; r record;
BEGIN
  IF _uid IS NULL THEN RETURN 0; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL THEN RETURN 0; END IF;

  FOR r IN SELECT * FROM public.company_invites
            WHERE status = 'pending' AND expires_at > now()
              AND lower(email) = lower(_email)
  LOOP
    INSERT INTO public.company_members (company_id, user_id, role, access_level, allowed_modules)
    VALUES (r.company_id, _uid,
            CASE WHEN r.access_level = 'admin' THEN 'admin'::public.company_role ELSE 'member'::public.company_role END,
            r.access_level, r.allowed_modules)
    ON CONFLICT (company_id, user_id) DO UPDATE
      SET access_level = EXCLUDED.access_level,
          allowed_modules = EXCLUDED.allowed_modules;

    UPDATE public.company_invites
      SET status = 'accepted', accepted_at = now() WHERE id = r.id;

    INSERT INTO public.user_active_company (user_id, company_id)
    VALUES (_uid, r.company_id)
    ON CONFLICT (user_id) DO NOTHING;

    _n := _n + 1;
  END LOOP;
  RETURN _n;
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_pending_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_pending_invites() TO authenticated;

-- 6. AI usage ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  feature text NOT NULL,
  model text,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  credits numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_events_user_time ON public.ai_usage_events (user_id, created_at DESC);

GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own or admin usage" ON public.ai_usage_events;
CREATE POLICY "read own or admin usage" ON public.ai_usage_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.is_super_admin()
         OR (company_id IS NOT NULL AND public.is_company_admin(company_id, auth.uid())));

CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global','company','user')),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_credits numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_limits_global ON public.ai_usage_limits (scope) WHERE scope = 'global';
CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_limits_company ON public.ai_usage_limits (company_id) WHERE scope = 'company';
CREATE UNIQUE INDEX IF NOT EXISTS ai_usage_limits_user ON public.ai_usage_limits (company_id, user_id) WHERE scope = 'user';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_usage_limits TO authenticated;
GRANT ALL ON public.ai_usage_limits TO service_role;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read limits" ON public.ai_usage_limits;
CREATE POLICY "read limits" ON public.ai_usage_limits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()
         OR public.is_super_admin()
         OR (company_id IS NOT NULL AND public.is_company_admin(company_id, auth.uid())));

DROP POLICY IF EXISTS "manage limits" ON public.ai_usage_limits;
CREATE POLICY "manage limits" ON public.ai_usage_limits
  FOR ALL TO authenticated
  USING (public.is_super_admin()
         OR (scope <> 'global' AND company_id IS NOT NULL AND public.is_company_admin(company_id, auth.uid())))
  WITH CHECK (public.is_super_admin()
         OR (scope <> 'global' AND company_id IS NOT NULL AND public.is_company_admin(company_id, auth.uid())));

DROP TRIGGER IF EXISTS trg_ai_limits_updated_at ON public.ai_usage_limits;
CREATE TRIGGER trg_ai_limits_updated_at BEFORE UPDATE ON public.ai_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.ai_usage_limits (scope, monthly_credits)
VALUES ('global', 50)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.ai_usage_this_month(_user uuid, _company uuid DEFAULT NULL)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(credits),0) FROM public.ai_usage_events
  WHERE user_id = _user
    AND created_at >= date_trunc('month', now())
    AND (_company IS NULL OR company_id = _company);
$$;

CREATE OR REPLACE FUNCTION public.ai_limit_for(_user uuid, _company uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT monthly_credits FROM public.ai_usage_limits WHERE scope='user' AND user_id=_user AND company_id=_company),
    (SELECT monthly_credits FROM public.ai_usage_limits WHERE scope='company' AND company_id=_company),
    (SELECT monthly_credits FROM public.ai_usage_limits WHERE scope='global'),
    0);
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_write_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ai_usage_this_month(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage_this_month(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.ai_limit_for(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_limit_for(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.my_access_level(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_access_level(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_write_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_write_access(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_module_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_module_access(uuid, text) TO authenticated;