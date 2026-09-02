UPDATE public.company_addons
SET term_end = NULL
WHERE company_id = '31e399ea-5f9c-4f17-98e0-a6bfd11c7304'
  AND addon_key = 'exec_team_room'
  AND status = 'active';