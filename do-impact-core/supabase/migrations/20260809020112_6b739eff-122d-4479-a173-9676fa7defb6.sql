DO $seed$
DECLARE
  c uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  i int;
  d date;
  rev numeric; budget numeric; py numeric; cogs numeric; opex numeric; ebitda numeric;
  seas numeric;
BEGIN
  ALTER TABLE public.owner_financials DISABLE TRIGGER owner_financials_no_template;
  ALTER TABLE public.owner_dashboard_templates DISABLE TRIGGER owner_dashboard_templates_no_template;

  DELETE FROM public.owner_financials WHERE company_id = c;
  FOR i IN 0..23 LOOP
    d := date_trunc('month', now())::date - make_interval(months => 23 - i);
    seas := 1 + 0.06 * sin(2 * pi() * extract(month from d) / 12);
    rev := round(1250000 * (1 + 0.008 * i) * seas);
    budget := round(rev * (0.97 + 0.008 * (i % 5)));
    py := round(rev / 1.09);
    cogs := round(rev * (0.655 - 0.0012 * i));
    opex := round(rev * 0.215);
    ebitda := rev - cogs - opex;
    INSERT INTO public.owner_financials (
      company_id, month, revenue, revenue_budget, revenue_py, cogs, opex, ebitda,
      ebitda_budget, ebitda_py, cash, debt, operating_cash_flow, free_cash_flow,
      ar_total, ar_over_60, ap_total, inventory, headcount, labor_cost,
      overtime_pct, turnover_pct, safety_incidents, valuation_multiple, extras
    ) VALUES (
      c, d, rev, budget, py, cogs, opex, ebitda,
      round(budget * 0.115), round(py * 0.105),
      round(900000 + 18000 * i + CASE WHEN i % 4 = 0 THEN -120000 ELSE 60000 END),
      round(4200000 - 45000 * i),
      round(ebitda * 0.82), round(ebitda * 0.82 - rev * 0.035),
      round(rev * 1.55), round(rev * 1.55 * greatest(0.04, 0.12 - 0.002 * i)),
      round(cogs * 1.35), round(cogs * 2.1),
      round(112 + i * 0.4), round(rev * 0.19),
      round((9.5 - 0.12 * i)::numeric, 1), round((14 - 0.15 * i)::numeric, 1),
      CASE WHEN i % 7 = 0 THEN 1 ELSE 0 END, 6.5,
      jsonb_build_object(
        'com.nps', 42 + round(i * 0.4),
        'com.complaints', greatest(1, 7 - round(i * 0.2)),
        'com.quote_turnaround', round((6.5 - 0.08 * i)::numeric, 1),
        'ppl.engagement', 70 + round(i * 0.3),
        'risk.supplier_concentration', 31 - round(i * 0.2),
        'risk.covenant_headroom', 18 + round(i * 0.6),
        'risk.insurance_days', 365 - ((i * 13) % 300),
        'risk.audit_findings', greatest(0, 4 - round(i / 6.0)),
        'custom.aerospace-programme-mix', 52 + round(i * 0.7)
      )
    );
  END LOOP;

  DELETE FROM public.owner_dashboard_templates WHERE company_id = c;
  INSERT INTO public.owner_dashboard_templates (company_id, name, is_default, config) VALUES
  (c, 'Monthly owner pack', true, jsonb_build_object(
    'sections', jsonb_build_array('financial','commercial','operations','working_capital','people','risk','shareholder'),
    'selected', jsonb_build_array('fin.revenue_ytd','fin.gross_margin','fin.ebitda','fin.ebitda_margin','fin.cash','fin.fcf','com.backlog','com.pipeline','com.coverage','com.concentration','com.nps','custom.aerospace-programme-mix','ops.otd','ops.oee','ops.scrap','ops.attainment','wc.dso','wc.dio','wc.ccc','wc.ar60','ppl.headcount','ppl.rev_per_head','ppl.labour_pct','ppl.overtime','ppl.turnover','ppl.safety','risk.escalations','risk.overdue','risk.certs','risk.initiatives','shv.ebitda_ltm','shv.leverage','shv.ev','shv.equity'),
    'custom', jsonb_build_array(jsonb_build_object('id','custom.aerospace-programme-mix','label','Aerospace programme mix %','section','commercial','unit','pct','higherIsBetter', true,'target', 60,'definition','Share of revenue from long-term aerospace programmes versus spot work.')),
    'hiddenTiles', '[]'::jsonb, 'tileOrder', '{}'::jsonb, 'renames', '{}'::jsonb,
    'targets', jsonb_build_object('fin.ebitda_margin', 14, 'ops.otd', 95, 'wc.dso', 45, 'shv.leverage', 2.5)
  )),
  (c, 'Bank / lender pack', false, jsonb_build_object(
    'sections', jsonb_build_array('financial','commercial','working_capital','people','risk','shareholder'),
    'selected', jsonb_build_array('fin.revenue_ytd','fin.gross_margin','fin.ebitda','fin.ebitda_ytd','fin.cash','fin.ocf','fin.fcf','fin.fcf_ltm','com.backlog','com.concentration','wc.dso','wc.ccc','wc.ar60','wc.net_wc','wc.wc_pct_revenue','ppl.rev_per_head','risk.covenant_headroom','shv.ebitda_ltm','shv.ebitda_margin_ltm','shv.net_debt','shv.leverage'),
    'custom', '[]'::jsonb, 'hiddenTiles', '[]'::jsonb, 'tileOrder', '{}'::jsonb, 'renames', '{}'::jsonb,
    'targets', jsonb_build_object('shv.leverage', 2.5, 'wc.dso', 45)
  ));

  ALTER TABLE public.owner_financials ENABLE TRIGGER owner_financials_no_template;
  ALTER TABLE public.owner_dashboard_templates ENABLE TRIGGER owner_dashboard_templates_no_template;
END
$seed$;