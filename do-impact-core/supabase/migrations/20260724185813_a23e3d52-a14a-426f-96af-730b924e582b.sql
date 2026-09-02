
-- 1) Profiles: restrict cross-tenant read access
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Profiles readable to self or shared company"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM public.company_members me
      JOIN public.company_members them ON them.company_id = me.company_id
      WHERE me.user_id = auth.uid() AND them.user_id = profiles.id
    )
  );

-- 2) Tighten permissive ALL/INSERT/UPDATE/DELETE policies -> company-scoped
DO $$
DECLARE
  r record;
  scoped_tables text[] := ARRAY[
    'restructuring_projects','restructuring_members',
    'cash_flow_settings','cash_flow_weeks',
    'working_capital_items','working_capital_kpis',
    'part_margins','copq_entries',
    'npi_projects','npi_gate_checklist','npi_risks',
    'siop_long_lead_materials','siop_osp_jobs'
  ];
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename = ANY(scoped_tables)
      AND cmd IN ('ALL','INSERT','UPDATE','DELETE')
      AND (qual='true' OR with_check='true' OR qual IS NULL AND with_check='true')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Recreate as company-scoped write policies
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'restructuring_projects','restructuring_members',
    'cash_flow_settings','cash_flow_weeks',
    'working_capital_items','working_capital_kpis',
    'part_margins','copq_entries',
    'npi_projects','npi_gate_checklist','npi_risks',
    'siop_long_lead_materials','siop_osp_jobs'
  ]
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%1$s company write" ON public.%1$I
        FOR ALL TO authenticated
        USING (company_id = public.current_company_id())
        WITH CHECK (company_id = public.current_company_id())
    $f$, t);
  END LOOP;
END $$;

-- 3) Lock down SECURITY DEFINER function EXECUTE grants
-- Revoke from PUBLIC and anon on all definer functions in public schema.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

-- Revoke authenticated on trigger-only / bootstrap definer functions (they run under trigger context).
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE ALL ON FUNCTION public.tg_company_seed_dm_board() FROM authenticated;
REVOKE ALL ON FUNCTION public.tg_company_bootstrap() FROM authenticated;
REVOKE ALL ON FUNCTION public.tg_sync_bridge_workstream() FROM authenticated;
REVOKE ALL ON FUNCTION public.tg_sync_waterfall_item_initiative() FROM authenticated;

-- Keep EXECUTE for authenticated on functions actually invoked as RPCs or from RLS expressions.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duplicate_company(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_showcase_company() TO authenticated;
