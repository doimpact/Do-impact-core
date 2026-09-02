DO $$
DECLARE
  _c uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  _b uuid := '71000000-0000-0000-0000-000000000000';
  d date;
  n int;
  plan_v numeric;
  act_v numeric;
  cat text;
  st public.dm_status;
  rc uuid;
  reasons uuid[] := ARRAY[
    'ac252e02-6f9b-4a4c-8b70-09baea5e3f2c'::uuid, -- Material shortage
    '69ddf79a-975d-40a2-8b5e-e39b6304393a'::uuid, -- Machine down
    '742e2bb3-76ca-4550-a8d8-de5b46254952'::uuid, -- Manpower
    '6f76a1d0-0db7-4e99-8f8f-7d0af970b90d'::uuid, -- Quality escape
    '3a3e983e-0be0-4d11-99b4-6a8df6800895'::uuid, -- Supplier
    '97a684ac-0d04-4020-8b8c-3544443e8d24'::uuid, -- Method / process
    'd667d3f8-a01a-4c40-ae4f-e691124d6604'::uuid  -- Customer / external
  ];
BEGIN
  SET LOCAL session_replication_role = 'replica';

  UPDATE public.dm_categories SET unit = v.u
  FROM (VALUES ('safety','checks'),('people','%'),('quality','%'),('delivery','ship-sets')) AS v(k,u)
  WHERE company_id = _c AND key = v.k;

  FOR d IN SELECT gs::date FROM generate_series(current_date - 45, current_date, interval '1 day') gs
           WHERE extract(dow from gs) BETWEEN 1 AND 5
  LOOP
    n := extract(day from d)::int;

    FOREACH cat IN ARRAY ARRAY['safety','people','quality','delivery'] LOOP
      IF cat = 'safety' THEN
        plan_v := 4;
        act_v := CASE WHEN n % 11 = 0 THEN 2 WHEN n % 7 = 0 THEN 3 ELSE 4 END;
      ELSIF cat = 'people' THEN
        plan_v := 100;
        act_v := CASE WHEN n % 9 IN (0,1) THEN 88 + (n % 4) ELSE 96 + (n % 5) END;
      ELSIF cat = 'quality' THEN
        plan_v := 98;
        act_v := CASE WHEN n IN (8,9,17,23) THEN 90 + (n % 4) ELSE 97 + (n % 3) END;
      ELSE
        plan_v := 12;
        act_v := CASE
          WHEN n IN (8,9,10,17,18,24) THEN 7 + (n % 3)
          WHEN n % 5 = 0 THEN 11
          ELSE 12 + (n % 2) END;
      END IF;

      INSERT INTO public.dm_category_targets (company_id, board_id, category_key, value_date, plan_value, actual_value)
      VALUES (_c, _b, cat, d, plan_v, act_v)
      ON CONFLICT (board_id, category_key, value_date)
      DO UPDATE SET plan_value = EXCLUDED.plan_value, actual_value = EXCLUDED.actual_value;

      IF act_v < plan_v * 0.97 THEN
        st := 'red';
        rc := reasons[1 + ((n + length(cat)) % array_length(reasons,1))];
      ELSE
        st := 'green';
        rc := NULL;
      END IF;

      INSERT INTO public.dm_marks (company_id, board_id, category, mark_date, status, reason_code_id, note)
      VALUES (_c, _b, cat, d, st, rc,
              CASE WHEN st = 'red' THEN initcap(cat) || ' missed plan (' || act_v || ' vs ' || plan_v || ')' END)
      ON CONFLICT (board_id, category, mark_date)
      DO UPDATE SET status = EXCLUDED.status, reason_code_id = EXCLUDED.reason_code_id, note = EXCLUDED.note;
    END LOOP;
  END LOOP;
END $$;