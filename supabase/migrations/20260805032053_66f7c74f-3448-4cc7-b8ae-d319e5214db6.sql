
DO $$
DECLARE
  c uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  t text;
  sup record;
  m record;
  card uuid;
  per date;
  base numeric;
  cand uuid;
  tbls text[] := ARRAY[
    'sc_categories','sc_segments','sc_suppliers','sc_scorecards','sc_scorecard_scores','sc_risks',
    'sc_capacity','sc_contracts','sc_onboarding_items','sc_development_plans','sc_reviews',
    'sc_selection_candidates','sc_selection_gates','sc_escalations','sc_actions'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM public.sc_suppliers WHERE company_id = c) THEN RETURN; END IF;

  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER %I', t, t || '_no_template');
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER %I', t, t || '_write_access');
  END LOOP;

  -- Category strategy detail
  UPDATE public.sc_categories SET annual_spend = 4200000, supplier_count = 6, strategy_status = 'approved',
    market_assessment = 'Fragmented regional machine shops; capacity tight on 5-axis titanium.',
    spend_analysis = '62% with two suppliers; 18% single sourced.',
    current_state = 'Long lead times (14 weeks), OTIF 82%.',
    future_state = 'Dual-source all flight-critical parts, lead time 8 weeks, OTIF 96%.',
    kpis = 'OTIF, PPM, lead time, cost per part', refresh_date = DATE '2026-09-30'
  WHERE company_id = c AND name = 'Machined Components';

  UPDATE public.sc_categories SET annual_spend = 1850000, supplier_count = 4, strategy_status = 'in_delivery',
    market_assessment = 'Ample capacity, price-driven market.',
    current_state = 'Four suppliers, inconsistent quality.',
    future_state = 'Consolidate to two, 6% cost out.',
    kpis = 'PPM, cost variance', refresh_date = DATE '2026-10-31'
  WHERE company_id = c AND name = 'Sheet Metal';

  UPDATE public.sc_categories SET annual_spend = 2600000, supplier_count = 2, strategy_status = 'review',
    market_assessment = 'Two qualified foundries globally; NADCAP constrained.',
    current_state = 'Sole source on two part families.',
    future_state = 'Qualify a second foundry by Q2 2027.',
    kpis = 'Yield, first-article pass rate', refresh_date = DATE '2026-08-31'
  WHERE company_id = c AND name = 'Castings';

  -- Suppliers
  INSERT INTO public.sc_suppliers (company_id, name, code, category_id, segment_id, site, country, annual_spend, sole_source, as9100, nadcap, export_controlled, status, notes) VALUES
    (c,'Meridian Precision Works','MPW',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Machined Components'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Strategic'),'Hartford, CT','USA',1850000,false,true,true,true,'active','Largest machining partner; 5-axis titanium.'),
    (c,'Northgate Alloys','NGA',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Raw Material'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Strategic'),'Sheffield','UK',1320000,true,true,false,false,'active','Sole source on Ti-6Al-4V bar.'),
    (c,'Calder Sheetworks','CSW',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Sheet Metal'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Preferred'),'Leeds','UK',740000,false,true,false,false,'active',NULL),
    (c,'Verano Castings','VRC',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Castings'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='High Risk'),'Bilbao','Spain',1400000,true,true,true,false,'probation','Yield issues since March.'),
    (c,'Halcyon Electronics','HCE',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Electronics'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Preferred'),'Penang','Malaysia',620000,false,true,false,true,'active',NULL),
    (c,'Ravenwood Composites','RWC',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Composite Parts'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Strategic'),'Toulouse','France',980000,false,true,true,false,'active',NULL),
    (c,'Solent Surface Treatments','SST',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Surface Treatments'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Preferred'),'Southampton','UK',310000,false,true,true,false,'active','NADCAP chem-processing.'),
    (c,'Brightlane Logistics','BLL',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Logistics'),(SELECT id FROM public.sc_segments WHERE company_id=c AND name='Transactional'),'Rotterdam','Netherlands',260000,false,false,false,false,'active',NULL);

  -- Three months of scorecards
  FOR sup IN SELECT id, name FROM public.sc_suppliers WHERE company_id = c LOOP
    base := CASE sup.name
      WHEN 'Meridian Precision Works' THEN 88
      WHEN 'Northgate Alloys' THEN 79
      WHEN 'Calder Sheetworks' THEN 83
      WHEN 'Verano Castings' THEN 54
      WHEN 'Halcyon Electronics' THEN 86
      WHEN 'Ravenwood Composites' THEN 91
      WHEN 'Solent Surface Treatments' THEN 76
      ELSE 81 END;
    FOREACH per IN ARRAY ARRAY[DATE '2026-05-01', DATE '2026-06-01', DATE '2026-07-01'] LOOP
      INSERT INTO public.sc_scorecards (company_id, supplier_id, period_month, notes)
      VALUES (c, sup.id, per, NULL) RETURNING id INTO card;
      FOR m IN SELECT id, sort_order FROM public.sc_score_metrics WHERE company_id = c LOOP
        INSERT INTO public.sc_scorecard_scores (company_id, scorecard_id, metric_id, score)
        VALUES (c, card, m.id,
          LEAST(100, GREATEST(20, base + ((m.sort_order * 7 + EXTRACT(MONTH FROM per)::int * 5) % 13) - 6
            + (EXTRACT(MONTH FROM per)::int - 5) * 2)));
      END LOOP;
    END LOOP;
  END LOOP;

  -- Risks
  INSERT INTO public.sc_risks (company_id, supplier_id, risk_type_id, title, likelihood, impact, mitigation, review_date, status) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='NGA'),(SELECT id FROM public.sc_risk_types WHERE company_id=c AND name='Single source'),'Sole source on titanium bar stock',4,5,'Qualify second mill; hold 8 weeks buffer stock.',DATE '2026-09-15','mitigating'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),(SELECT id FROM public.sc_risk_types WHERE company_id=c AND name='Financial'),'Deteriorating credit rating',4,4,'Monthly financial review; payment terms shortened.',DATE '2026-08-30','open'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),(SELECT id FROM public.sc_risk_types WHERE company_id=c AND name='Capacity'),'Foundry capacity constrained to 70% of demand',3,4,'Dual-source qualification underway.',DATE '2026-08-15','mitigating'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='HCE'),(SELECT id FROM public.sc_risk_types WHERE company_id=c AND name='Geography'),'Long ocean lead time from South-East Asia',3,3,'Air-freight contingency and 6-week safety stock.',DATE '2026-10-01','accepted'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='SST'),(SELECT id FROM public.sc_risk_types WHERE company_id=c AND name='Special process'),'Single NADCAP chem-process line',3,5,'Approve alternate processor by Q4.',DATE '2026-09-01','open');

  -- Capacity
  INSERT INTO public.sc_capacity (company_id, supplier_id, period, demand_units, available_units, max_units, unit, bottleneck, tooling_constraints, labour_constraints, investment_plan) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='MPW'),DATE '2026-07-01',1200,1300,1500,'parts/month','5-axis cell utilisation 92%','2 fixtures shared across families','3 machinists short on nights','Second 5-axis cell Q1 2027'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),DATE '2026-07-01',900,640,700,'castings/month','Pour capacity + rework loop','Die refurbishment overdue','Shift pattern limited to 2 shifts','Die replacement approved, Q4 2026'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='RWC'),DATE '2026-07-01',400,470,520,'panels/month','Autoclave slots',NULL,NULL,'Autoclave upgrade under review');

  -- Contracts
  INSERT INTO public.sc_contracts (company_id, supplier_id, title, contract_type, start_date, end_date, review_date, status, pricing_model, capacity_reservation, escalation_mechanism) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='MPW'),'Machining LTA 2025–2028','ltA',DATE '2025-01-01',DATE '2028-12-31',DATE '2026-11-01','active','Fixed price with annual indexation','1,500 parts/month reserved','L0–L4 per escalation ladder'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='NGA'),'Titanium bar supply agreement','msa',DATE '2024-06-01',DATE '2026-12-31',DATE '2026-09-01','renewal','Index-linked to LME + conversion','Quarterly tonnage commitment','48h response on shortage'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),'Castings supply agreement','ltA',DATE '2024-01-01',DATE '2026-09-30',DATE '2026-08-01','renewal','Fixed price per casting','700 castings/month','Recovery plan obligations included'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='BLL'),'Freight terms 2026','spot',DATE '2026-01-01',DATE '2026-12-31',NULL,'active','Rate card per lane',NULL,NULL);

  -- Onboarding for the newest supplier
  INSERT INTO public.sc_onboarding_items (company_id, supplier_id, label, status, due_date, sort_order)
  SELECT c, (SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='SST'), tpl.label,
         CASE WHEN tpl.sort_order <= 5 THEN 'done' WHEN tpl.sort_order <= 7 THEN 'in_progress' ELSE 'todo' END,
         DATE '2026-08-01' + (tpl.sort_order * 7), tpl.sort_order
  FROM public.sc_onboarding_templates tpl WHERE tpl.company_id = c;

  -- Development plans
  INSERT INTO public.sc_development_plans (company_id, supplier_id, year, objective, activities, target_date, status, benefit) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),2026,'Lift casting yield from 71% to 88%','Weekly yield reviews, die refurbishment, process capability study',DATE '2026-12-15','in_progress','$310k scrap avoidance'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='MPW'),2026,'Cut lead time 14 → 8 weeks','Kanban on raw material, setup reduction on 5-axis cell',DATE '2026-11-30','in_progress','6 weeks working capital release'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='CSW'),2026,'Reduce PPM below 500','SPC on press line, operator certification',DATE '2027-02-28','not_started','Quality cost reduction $95k');

  -- Reviews
  INSERT INTO public.sc_reviews (company_id, supplier_id, review_type_id, title, review_date, status, attendees, notes, decisions) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),(SELECT id FROM public.sc_review_types WHERE company_id=c AND name='Operational review'),'Verano recovery review — July',DATE '2026-07-09','held','Supply chain, quality, operations','Yield 71%, 14 late lots in June.','Weekly recovery calls until yield > 85%.'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='MPW'),(SELECT id FROM public.sc_review_types WHERE company_id=c AND name='Supplier business review'),'Meridian QBR Q2 2026',DATE '2026-07-02','held','Both leadership teams','Score 88. Capacity approved for 2027 ramp.','Fund second 5-axis cell jointly.'),
    (c,NULL,(SELECT id FROM public.sc_review_types WHERE company_id=c AND name='Supply chain risk review'),'Monthly supply risk review — July',DATE '2026-07-14','held','Supply chain, SIOP, finance','Two high risks open; titanium buffer at 6 weeks.','Escalate second-mill qualification to L2.'),
    (c,NULL,(SELECT id FROM public.sc_review_types WHERE company_id=c AND name='Commodity review'),'Machined components commodity review',DATE '2026-07-21','planned','Category team',NULL,NULL);

  -- Selection pipeline
  INSERT INTO public.sc_selection_candidates (company_id, name, category_id, need, country, stage, score)
  VALUES (c,'Arden Foundry Group',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Castings'),'Second source for flight-critical castings','Poland','audit',82)
  RETURNING id INTO cand;
  INSERT INTO public.sc_selection_gates (company_id, candidate_id, seq, name, status, score, notes) VALUES
    (c,cand,1,'Need & specification','passed',NULL,'Two part families defined.'),
    (c,cand,2,'Market scan','passed',NULL,'Four foundries screened.'),
    (c,cand,3,'RFI / RFQ','passed',88,'Price 4% above incumbent.'),
    (c,cand,4,'Capability & risk assessment','passed',82,'NADCAP current; financials solid.'),
    (c,cand,5,'Audit / site visit','pending',NULL,'Scheduled 12 Aug 2026.'),
    (c,cand,6,'Award & contract','pending',NULL,NULL),
    (c,cand,7,'Onboarding','pending',NULL,NULL);

  INSERT INTO public.sc_selection_candidates (company_id, name, category_id, need, country, stage, score) VALUES
    (c,'Kestrel Metals',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Raw Material'),'Second titanium mill','Germany','rfi',NULL),
    (c,'Pinehurst Machining',(SELECT id FROM public.sc_categories WHERE company_id=c AND name='Machined Components'),'Overflow capacity for 2027 ramp','USA','market',NULL);

  -- Escalations
  INSERT INTO public.sc_escalations (company_id, supplier_id, level_no, title, description, opened_at, due_date, actions, closure_criteria, status) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),2,'Casting shortages threaten August build','14 late lots in June; yield at 71%.',DATE '2026-06-24',DATE '2026-08-15','Formal recovery plan, executive supplier meeting, dual-source acceleration.','Recovery plan on track for 4 weeks','recovering'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='NGA'),1,'Bar stock deliveries slipping 2 weeks','Mill rescheduling has pushed three releases.',DATE '2026-07-06',DATE '2026-07-31','Root cause on repeated lateness, written recovery commitment.','Two consecutive on-time deliveries','open'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='HCE'),0,'Two late shipments on connector kits','Ocean delay at transhipment.',DATE '2026-07-13',DATE '2026-07-20','Chase order and confirm new date.','Delivery confirmed','closed');

  -- Actions
  INSERT INTO public.sc_actions (company_id, supplier_id, source_type, title, due_date, status, notes) VALUES
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),'escalation','Complete die refurbishment at Verano',DATE '2026-09-30','in_progress','Capex approved by supplier.'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='VRC'),'development','Run process capability study on pour line',DATE '2026-08-22','open',NULL),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='NGA'),'risk','Complete second titanium mill qualification',DATE '2026-11-30','in_progress','Kestrel Metals at RFI stage.'),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='MPW'),'review','Agree joint funding for second 5-axis cell',DATE '2026-09-15','open',NULL),
    (c,(SELECT id FROM public.sc_suppliers WHERE company_id=c AND code='SST'),'audit','Approve alternate chem-processing source',DATE '2026-12-01','open',NULL);

  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER %I', t, t || '_no_template');
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER %I', t, t || '_write_access');
  END LOOP;
END $$;
