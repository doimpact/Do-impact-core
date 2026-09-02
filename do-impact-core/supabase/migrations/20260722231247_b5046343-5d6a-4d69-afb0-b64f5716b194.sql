
CREATE OR REPLACE FUNCTION public.duplicate_company(_source uuid, _new_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new uuid;
  _uid uuid := auth.uid();
  _tbl text;
  _cols text;
  _fk record;
  _skip text[] := ARRAY['company_members','user_active_company'];
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _source AND user_id = _uid) THEN
    RAISE EXCEPTION 'Not a member of source company';
  END IF;

  -- Bypass triggers so sync triggers (e.g. tg_sync_objective_initiative) don't
  -- double-insert rows we are already copying explicitly.
  SET LOCAL session_replication_role = 'replica';

  INSERT INTO public.companies(name, created_by)
  VALUES (_new_name, _uid)
  RETURNING id INTO _new;

  -- Membership + active-company pointer (triggers are off, so do it manually)
  INSERT INTO public.company_members(company_id, user_id, role)
  VALUES (_new, _uid, 'owner')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  INSERT INTO public.user_active_company(user_id, company_id)
  VALUES (_uid, _new)
  ON CONFLICT (user_id) DO UPDATE SET company_id = EXCLUDED.company_id, updated_at = now();

  CREATE TEMP TABLE IF NOT EXISTS _dup_map(tbl text, old_id uuid, new_id uuid) ON COMMIT DROP;
  TRUNCATE _dup_map;

  -- Pass 1: copy rows into new company, generate new ids, record mapping.
  FOR _tbl IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.columns c2
      ON c2.table_schema='public' AND c2.table_name=c.table_name
     AND c2.column_name='id' AND c2.data_type='uuid'
    WHERE c.table_schema='public' AND c.column_name='company_id'
      AND c.table_name <> ALL(_skip)
    ORDER BY c.table_name
  LOOP
    -- Build "col1, col2, ..." excluding id and company_id
    SELECT string_agg(quote_ident(column_name), ', ')
    INTO _cols
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name=_tbl
      AND column_name NOT IN ('id','company_id')
      AND (is_generated = 'NEVER' OR is_generated IS NULL);

    IF _cols IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format($f$
      WITH src AS (SELECT * FROM public.%1$I WHERE company_id = %2$L),
      mapped AS (
        SELECT src.id AS old_id, gen_random_uuid() AS new_id, src.*
        FROM src
      ),
      ins AS (
        INSERT INTO public.%1$I (id, company_id, %3$s)
        SELECT new_id, %4$L, %3$s FROM mapped
      )
      INSERT INTO _dup_map(tbl, old_id, new_id)
      SELECT %1$L, old_id, new_id FROM mapped
    $f$, _tbl, _source, _cols, _new);
  END LOOP;

  -- Pass 2: remap FK uuid columns within the new company using the mapping.
  FOR _fk IN
    SELECT
      tc.table_name  AS from_table,
      kcu.column_name AS from_col,
      ccu.table_name AS to_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema='public'
      AND ccu.table_schema='public'
      AND ccu.column_name='id'
      AND tc.table_name IN (SELECT DISTINCT tbl FROM _dup_map)
      AND ccu.table_name IN (SELECT DISTINCT tbl FROM _dup_map)
      AND tc.table_name <> ccu.table_name  -- self-refs handled separately below
  LOOP
    EXECUTE format($f$
      UPDATE public.%1$I t
      SET %2$I = m.new_id
      FROM _dup_map m
      WHERE t.company_id = %3$L
        AND m.tbl = %4$L
        AND t.%2$I = m.old_id
    $f$, _fk.from_table, _fk.from_col, _new, _fk.to_table);
  END LOOP;

  -- Self-referential FKs (e.g. employees.manager_id, workstreams.parent_id)
  FOR _fk IN
    SELECT
      tc.table_name  AS from_table,
      kcu.column_name AS from_col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema='public' AND ccu.table_schema='public'
      AND ccu.column_name='id'
      AND tc.table_name = ccu.table_name
      AND tc.table_name IN (SELECT DISTINCT tbl FROM _dup_map)
  LOOP
    EXECUTE format($f$
      UPDATE public.%1$I t
      SET %2$I = m.new_id
      FROM _dup_map m
      WHERE t.company_id = %3$L
        AND m.tbl = %4$L
        AND t.%2$I = m.old_id
    $f$, _fk.from_table, _fk.from_col, _new, _fk.from_table);
  END LOOP;

  RETURN _new;
END;
$$;

REVOKE ALL ON FUNCTION public.duplicate_company(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.duplicate_company(uuid, text) TO authenticated;
