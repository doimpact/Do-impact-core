-- ============================================================================
-- DO.Impact Core (open-source edition) — final local-mode migration.
--
-- This migration converts the hosted multi-tenant SaaS schema into a
-- single-user local database:
--   1. Removes all personal identity rows (users, memberships, roles).
--   2. Disables Row Level Security and grants full access to the local roles.
--   3. Replaces hosted-only RPCs (demo showcase, invites, billing paywall)
--      with local no-op / always-allow versions.
-- ============================================================================

-- 1. Personal data purge ------------------------------------------------------
TRUNCATE TABLE public.user_active_company;
TRUNCATE TABLE public.user_roles;
TRUNCATE TABLE public.platform_admins;
TRUNCATE TABLE public.company_members;
TRUNCATE TABLE public.profiles;
TRUNCATE TABLE public.user_preferences;

-- 2. Local access: no RLS, full grants ----------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', r.tablename);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.tablename);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. Hosted-only RPCs become local no-ops / always-allow ----------------------
CREATE OR REPLACE FUNCTION public.join_showcase_company()
RETURNS void LANGUAGE plpgsql AS $$ BEGIN END $$;

CREATE OR REPLACE FUNCTION public.ensure_sample_company()
RETURNS void LANGUAGE plpgsql AS $$ BEGIN END $$;

CREATE OR REPLACE FUNCTION public.accept_pending_invites()
RETURNS integer LANGUAGE plpgsql AS $$ BEGIN RETURN 0; END $$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.company_is_entitled(_company uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT true $$;

-- The "current company" resolves from the single local user's active row.
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT company_id FROM public.user_active_company LIMIT 1
$$;
