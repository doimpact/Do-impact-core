DO $$
DECLARE t text; cid uuid := 'f03167e2-e0d5-4a82-970d-23818d32be14'; uid uuid := 'b6b3172f-5b5d-4554-ba4b-abd5d6e1ec42';
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns c
           WHERE c.table_schema='public' AND c.column_name='company_id'
             AND EXISTS (SELECT 1 FROM information_schema.tables x WHERE x.table_schema='public' AND x.table_name=c.table_name AND x.table_type='BASE TABLE')
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', t) USING cid;
  END LOOP;

  DELETE FROM public.user_active_company WHERE company_id = cid OR user_id = uid;
  DELETE FROM public.companies WHERE id = cid;

  DELETE FROM public.company_members WHERE user_id = uid;
  DELETE FROM public.user_preferences WHERE user_id = uid;
  DELETE FROM public.user_roles WHERE user_id = uid;
  DELETE FROM public.platform_admins WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END $$;