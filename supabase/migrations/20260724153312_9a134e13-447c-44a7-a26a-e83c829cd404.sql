DO $seed$
DECLARE
  c uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  b uuid := '75b147a6-5109-4d22-805e-6834967d33fa';
  pS uuid := '33333333-0000-0000-0000-000000000001';
  pQ uuid := '33333333-0000-0000-0000-000000000002';
  pD uuid := '33333333-0000-0000-0000-000000000003';
  pP uuid := '33333333-0000-0000-0000-000000000004';
  m int;
BEGIN
  SET LOCAL session_replication_role = 'replica';

  INSERT INTO public.pillars (id, company_id, key, name, tagline, variant, health, sort_order) VALUES
    (pS, c, 'safety-titan',   'Safety',   'Everyone home, every day.', 'red', 'yellow', 0),
    (pQ, c, 'quality-titan',  'Quality',  'Right first time — zero escapes.', 'blue', 'green', 1),
    (pD, c, 'delivery-titan', 'Delivery', 'On-time, in-full, every promise.', 'green', 'yellow', 2),
    (pP, c, 'people-titan',   'People',   'Skilled, safe, engaged, growing.', 'purple', 'green', 3);

  INSERT INTO public.sub_pillars (pillar_id, company_id, name, sort_order) VALUES
    (pS, c, 'Behavior-based safety', 0),
    (pS, c, 'Ergonomics', 1),
    (pQ, c, 'FOD elimination', 0),
    (pQ, c, 'Cpk on CTQs', 1),
    (pD, c, 'OTD to customer', 0),
    (pD, c, 'Lead time', 1),
    (pP, c, 'Skills matrix', 0),
    (pP, c, 'Retention', 1);

  INSERT INTO public.kpis (pillar_id, company_id, name, unit, target, higher_is_better, frequency, is_key) VALUES
    (pS, c, 'Lost-time injuries', 'count', 0,   false,'monthly', true),
    (pS, c, 'TRIR', 'rate', 0.5, false,'monthly', true),
    (pS, c, 'Near-miss reports', 'count', 25,  true, 'monthly', false),
    (pQ, c, 'First pass yield', '%', 98,  true, 'monthly', true),
    (pQ, c, 'External PPM', 'ppm', 150, false,'monthly', true),
    (pQ, c, 'Audit findings (major)', 'count', 0,   false,'monthly', false),
    (pD, c, 'On-time-in-full', '%', 95,  true, 'monthly', true),
    (pD, c, 'End-to-end lead time', 'days', 29,  false,'monthly', true),
    (pP, c, 'Voluntary attrition', '%', 6,   false,'monthly', true),
    (pP, c, 'Skills matrix coverage', '%', 90,  true, 'monthly', false);

  FOR m IN 1..25 LOOP
    INSERT INTO public.dm_marks (company_id, board_id, category, mark_date, status, note) VALUES
      (c, b, 'safety',   date_trunc('month', now())::date + (m-1),
        (CASE WHEN m IN (7,18) THEN 'red' ELSE 'green' END)::public.dm_status,
        CASE WHEN m IN (7,18) THEN 'Near-miss — hand injury' ELSE NULL END),
      (c, b, 'quality',  date_trunc('month', now())::date + (m-1),
        (CASE WHEN m = 12 THEN 'red' ELSE 'green' END)::public.dm_status,
        CASE WHEN m=12 THEN 'FOD escape on final inspect' ELSE NULL END),
      (c, b, 'delivery', date_trunc('month', now())::date + (m-1),
        (CASE WHEN m IN (5,20) THEN 'red' ELSE 'green' END)::public.dm_status,
        CASE WHEN m=5 THEN 'OTD 88%' WHEN m=20 THEN 'Cell 3 late — 2 shipments' ELSE NULL END),
      (c, b, 'people',   date_trunc('month', now())::date + (m-1),
        'green'::public.dm_status, NULL);
  END LOOP;

  INSERT INTO public.dm_escalations (company_id, board_id, category, occurred_on, concern, cause, countermeasure, status) VALUES
    (c, b, 'safety',   date_trunc('month', now())::date + 6, 'Near-miss hand injury Cell 4', 'Guard interlock bypassed during changeover', 'Retrain crew; add interlock verification to changeover SOP','in_progress'),
    (c, b, 'delivery', date_trunc('month', now())::date + 4, 'OTD 88% — 3 shipments late', 'Long-lead titanium billet slipped 2 wks', 'Pull-in from alt supplier; add safety stock','open');

  INSERT INTO public.calendar_events (company_id, title, event_type, event_date, notes, pillar_id) VALUES
    (c, 'EASA Part 145 surveillance audit', 'audit', current_date + 21, '2-day surveillance', pQ),
    (c, 'Customer visit — Airbus procurement', 'visit', current_date + 30, 'Sophie Laurent + team', NULL),
    (c, 'Weekly SLT meeting', 'meeting', current_date + 3, 'Standing SLT', NULL),
    (c, 'AS9100 internal audit', 'audit', current_date + 45, 'Full site', pQ);

  SET LOCAL session_replication_role = 'origin';
END $seed$;