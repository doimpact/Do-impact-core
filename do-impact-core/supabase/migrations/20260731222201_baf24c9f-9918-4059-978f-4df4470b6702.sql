DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'voc_notes','voc_tasks','voc_metrics',
    'waterfall_bridges','waterfall_items',
    'oms_standard_work','oms_standard_work_templates',
    'compliance_snapshots','exec_room_threads','exec_room_messages',
    'dm_boards'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_company_scope', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id())',
      t || '_company_scope', t);
  END LOOP;
END $$;