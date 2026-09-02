DO $$
DECLARE c uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  a1 uuid := '30000000-0000-0000-0000-000000000001'; -- NorthStar Aero Systems
  a2 uuid := '30000000-0000-0000-0000-000000000002'; -- Aurora MRO Group
  a3 uuid := '30000000-0000-0000-0000-000000000003'; -- Helios Defense Aviation
  m date := date_trunc('month', now())::date;
BEGIN
  ALTER TABLE public.voc_notes DISABLE TRIGGER trg_prevent_template_voc_notes;
  ALTER TABLE public.voc_notes DISABLE TRIGGER trg_prevent_template_write;
  ALTER TABLE public.voc_notes DISABLE TRIGGER trg_enforce_write_access;
  BEGIN ALTER TABLE public.voc_tasks DISABLE TRIGGER USER; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.voc_metrics DISABLE TRIGGER USER; EXCEPTION WHEN others THEN NULL; END;

  INSERT INTO public.voc_metrics (company_id, account_id, period, nps, csat, note) VALUES
    (c, NULL, m - INTERVAL '5 month', 18, 78, 'Post-escalation low point after the Q1 delivery misses.'),
    (c, NULL, m - INTERVAL '4 month', 24, 80, 'Recovery plan communicated to all key accounts.'),
    (c, NULL, m - INTERVAL '3 month', 31, 83, 'On-time delivery back above 92%.'),
    (c, NULL, m - INTERVAL '2 month', 36, 85, 'FAI documentation rework down sharply.'),
    (c, NULL, m - INTERVAL '1 month', 41, 87, 'First month with no customer escapes.'),
    (c, NULL, m, 44, 88, 'Quote turnaround still the main detractor theme.'),
    (c, a1, m - INTERVAL '2 month', 52, 90, 'Strongest relationship; values the engineering support.'),
    (c, a1, m, 58, 92, 'Named us preferred supplier for two new part families.'),
    (c, a2, m - INTERVAL '2 month', 5, 71, 'AOG turnaround expectations not consistently met.'),
    (c, a2, m, 12, 74, 'Improving, but weekend escalation cover still an issue.'),
    (c, a3, m - INTERVAL '2 month', 30, 82, 'Programme paperwork burden is the recurring theme.'),
    (c, a3, m, 34, 84, 'PPAP submissions now tracked on the gate checklist.');

  INSERT INTO public.voc_notes (company_id, account_id, kind, position, content) VALUES
    (c, NULL, 'works_well', 0, 'Single named point of contact per account — customers say they always know who to call.'),
    (c, NULL, 'works_well', 1, 'Engineering change turnaround averaging 4 days against a 10-day industry expectation.'),
    (c, NULL, 'works_well', 2, 'Monthly delivery performance pack sent unprompted; customers use it in their own reviews.'),
    (c, a1, 'works_well', 3, 'NorthStar: praised our concurrent engineering input on the titanium bracket redesign.'),
    (c, a1, 'works_well', 4, 'NorthStar: zero quality escapes over the last 12 months on flight-critical parts.'),
    (c, a2, 'works_well', 5, 'Aurora MRO: responsive AOG support when we do have parts on the shelf.'),
    (c, a3, 'works_well', 6, 'Helios: FAI packs accepted first time on the last five submissions.'),
    (c, a3, 'works_well', 7, 'Helios: traceability and certification records rated best-in-class at the last audit.'),
    (c, NULL, 'can_improve', 0, 'Quote turnaround averages 11 days — customers expect 5 and go elsewhere while they wait.'),
    (c, NULL, 'can_improve', 1, 'First-article lead time on new part numbers is quoted conservatively and loses winnable work.'),
    (c, NULL, 'can_improve', 2, 'Price transparency on repeat orders — customers cannot see what drives the increases.'),
    (c, NULL, 'can_improve', 3, 'Escalation response outside core hours depends on individuals, not a defined rota.'),
    (c, a1, 'can_improve', 4, 'NorthStar: wants earlier visibility of capacity constraints before they place the schedule.'),
    (c, a2, 'can_improve', 5, 'Aurora MRO: packaging and labelling nonconformances on two shipments this quarter.'),
    (c, a2, 'can_improve', 6, 'Aurora MRO: expedite requests are acknowledged but rarely given a committed date.'),
    (c, a3, 'can_improve', 7, 'Helios: PPAP paperwork submitted late twice — held up their production release.');

  INSERT INTO public.voc_tasks (company_id, account_id, title, due_date, status, position) VALUES
    (c, NULL, 'Map the quote-to-response process and cut turnaround to 5 days', (now() + INTERVAL '21 day')::date, 'open', 0),
    (c, NULL, 'Define a weekend and out-of-hours escalation rota with named cover', (now() + INTERVAL '10 day')::date, 'in_progress', 1),
    (c, NULL, 'Publish a price-change explainer sheet for repeat orders', (now() + INTERVAL '35 day')::date, 'open', 2),
    (c, NULL, 'Run the quarterly VoC survey across all three key accounts', (now() - INTERVAL '12 day')::date, 'done', 3),
    (c, a1, 'Share the rolling 12-week capacity view with NorthStar planning', (now() + INTERVAL '7 day')::date, 'in_progress', 4),
    (c, a2, 'Close out the packaging and labelling nonconformances with Aurora MRO', (now() + INTERVAL '5 day')::date, 'open', 5),
    (c, a2, 'Agree committed response times for Aurora AOG expedite requests', (now() + INTERVAL '18 day')::date, 'open', 6),
    (c, a3, 'Add PPAP submission dates to the Helios programme gate checklist', (now() - INTERVAL '4 day')::date, 'done', 7);

  ALTER TABLE public.voc_notes ENABLE TRIGGER trg_prevent_template_voc_notes;
  ALTER TABLE public.voc_notes ENABLE TRIGGER trg_prevent_template_write;
  ALTER TABLE public.voc_notes ENABLE TRIGGER trg_enforce_write_access;
  BEGIN ALTER TABLE public.voc_tasks ENABLE TRIGGER USER; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.voc_metrics ENABLE TRIGGER USER; EXCEPTION WHEN others THEN NULL; END;
END $$;