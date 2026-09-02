-- 1. Harden the template read-only guard: handle DELETE (OLD row) as well as INSERT/UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_template_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  _cid uuid;
  _is_template boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _cid := OLD.company_id;
  ELSE
    _cid := NEW.company_id;
  END IF;

  SELECT c.is_template INTO _is_template
  FROM public.companies c
  WHERE c.id = _cid;

  IF COALESCE(_is_template, false) THEN
    RAISE EXCEPTION 'TitanScale Template is read-only. Duplicate it to edit.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Attach the guard to EVERY company-scoped table in public (idempotent).
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
     AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.column_name = 'company_id'
      AND c.table_name NOT IN ('companies')
    ORDER BY 1
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_template_write ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()', t);
  END LOOP;
END $$;

-- 3. Revoke public/anon EXECUTE on internal SECURITY DEFINER trigger function.
REVOKE ALL ON FUNCTION public.tg_dm_board_seed_metrics() FROM PUBLIC, anon, authenticated;