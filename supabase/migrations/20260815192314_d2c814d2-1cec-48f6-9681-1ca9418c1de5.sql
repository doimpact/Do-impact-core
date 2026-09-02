
UPDATE public.companies SET is_template = false WHERE id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';

DELETE FROM public.industrial_strategy_rows
WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
  AND section_key IN ('mfg-model','capacity','footprint','technology','cost','quality','org-talent','capital');

INSERT INTO public.industrial_strategy_rows (company_id, section_key, label, data, position) VALUES
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','mfg-model','5-axis structural machining','{"scope":"5-axis structural machining","decision":"make","reason":"Core differentiator, tight tolerances and AS9100 traceability","action":"Add 2 spindles by Q3 — Ops Director"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','mfg-model','Heat treatment','{"scope":"Heat treatment","decision":"partner","reason":"NADCAP-approved partner has better economics and certification","action":"Dual-source second approved house — Supply Chain"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','mfg-model','Standard fasteners & hardware','{"scope":"Standard fasteners & hardware","decision":"buy","reason":"Commodity, no differentiation, distributor economics win","action":"Consolidate to 2 distributors — Procurement"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','mfg-model','Final assembly & test','{"scope":"Final assembly & test","decision":"make","reason":"Customer interface, quality-critical, protects delivery promise","action":"Cell re-layout, week 14 — CI Lead"}',4),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capacity','Current','{"case":"current","demand":"48000","required":"41000","available":"46000","bottleneck":"5-axis cell 2","response":"Setup reduction (SMED) on cell 2"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capacity','Base','{"case":"base","demand":"56000","required":"47500","available":"46000","bottleneck":"5-axis cell 2","response":"Debottleneck: fixture pool + 3rd shift Mon–Thu"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capacity','High','{"case":"high","demand":"68000","required":"58000","available":"46000","bottleneck":"5-axis + inspection","response":"Add machine (FY+1) and outsource overflow roughing"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capacity','Downside','{"case":"downside","demand":"39000","required":"33000","available":"46000","bottleneck":"None — absorption risk","response":"Flex shifts, insource treated parts, protect skills"}',4),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','footprint','Expand current site','{"option":"Expand current site (Wichita)","labour":"7200000","material":"18400000","overhead":"3100000","risk":"450000","landed":"29150000","call":"recommend"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','footprint','Second site — Monterrey','{"option":"Second site — Monterrey","labour":"4100000","material":"19600000","overhead":"3600000","risk":"2100000","landed":"29400000","call":"hold"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','footprint','Outsource machining','{"option":"Outsource structural machining","labour":"900000","material":"26800000","overhead":"1400000","risk":"3200000","landed":"32300000","call":"reject"}',3),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','technology','Automated in-process gauging','{"problem":"Inspection queue drives 6 days of lead time","solution":"Automated in-process gauging on cells 1–3","value":"620000","investment":"340000","readiness":"partial","call":"now"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','technology','Finite scheduling (APS)','{"problem":"Schedule instability, 78% adherence","solution":"Finite scheduling tied to the 0–12 week plan","value":"480000","investment":"120000","readiness":"none","call":"now"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','technology','Robotic deburr cell','{"problem":"Manual deburr is a labour and ergonomics constraint","solution":"Robotic deburr cell","value":"310000","investment":"420000","readiness":"none","call":"next"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','technology','Digital traceability','{"problem":"Certification packs are assembled manually","solution":"Digital traceability and e-cert packs","value":"180000","investment":"95000","readiness":"partial","call":"next"}',4),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','cost','Should-cost on forgings','{"area":"material","lever":"Should-cost renegotiation on forgings","baseline":"9600000","target":"8900000","saving":"700000","owner":"Procurement Lead"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','cost','Line balancing & standard work','{"area":"labour","lever":"Line balancing and standard work in assembly","baseline":"5200000","target":"4750000","saving":"450000","owner":"Ops Director"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','cost','OEE on the 5-axis cells','{"area":"equipment","lever":"OEE improvement on 5-axis cells (setup + minor stops)","baseline":"3800000","target":"3420000","saving":"380000","owner":"CI Lead"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','cost','SKU and routing rationalisation','{"area":"complexity","lever":"SKU and routing rationalisation (legacy TS-400 family)","baseline":"1500000","target":"1180000","saving":"320000","owner":"Programme Manager"}',4),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','cost','Scrap and rework reduction','{"area":"quality","lever":"Scrap and rework reduction on treated parts","baseline":"1250000","target":"960000","saving":"290000","owner":"Quality Manager"}',5),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','quality','Customer PPM','{"metric":"Customer PPM","current":"1850","target":"600","driver":"Escapes on treated parts","action":"Source inspection at treatment partner + control plan","owner":"Quality Manager"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','quality','First pass yield','{"metric":"First pass yield %","current":"88","target":"95","driver":"Setup-related first-article failures","action":"Standard setups, poka-yoke fixtures","owner":"CI Lead"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','quality','Cost of poor quality','{"metric":"COPQ","current":"1250000","target":"780000","driver":"Scrap, rework, expedited freight","action":"Weekly COPQ review in the daily management system","owner":"Finance Manager"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','quality','Supplier defect rate','{"metric":"Supplier defect rate %","current":"3.1","target":"1.0","driver":"Single-source forging variation","action":"Supplier development plan + second source","owner":"Procurement Lead"}',4),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','org-talent','Operations','{"function":"Operations","capability":"Daily management and flow leadership","maturity":"partial","action":"develop","owner":"Ops Director"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','org-talent','Planning','{"function":"Planning","capability":"Finite scheduling and SIOP ownership","maturity":"none","action":"hire","owner":"COO"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','org-talent','Quality','{"function":"Quality","capability":"Process capability and prevention engineering","maturity":"partial","action":"develop","owner":"Quality Manager"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','org-talent','Engineering','{"function":"Engineering","capability":"NPI / AS9145 gate discipline","maturity":"have","action":"leverage","owner":"Engineering Manager"}',4),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','org-talent','Commercial','{"function":"Commercial","capability":"Programme pricing and should-cost negotiation","maturity":"none","action":"partner","owner":"Commercial Director"}',5),

('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capital','Third 5-axis machining centre','{"request":"Third 5-axis machining centre","amount":"1450000","fit":"5","return":"4","risk":"4","timing":"FY+1 H1","decision":"fund"}',1),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capital','In-process gauging','{"request":"In-process gauging (cells 1–3)","amount":"340000","fit":"5","return":"5","risk":"4","timing":"This year Q3","decision":"fund"}',2),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capital','Robotic deburr cell','{"request":"Robotic deburr cell","amount":"420000","fit":"3","return":"3","risk":"3","timing":"FY+1 H2","decision":"phase"}',3),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capital','Second site feasibility','{"request":"Second site feasibility (Monterrey)","amount":"150000","fit":"3","return":"2","risk":"2","timing":"FY+2","decision":"hold"}',4),
('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','capital','Paint line refurbishment','{"request":"Paint line refurbishment","amount":"280000","fit":"2","return":"2","risk":"3","timing":"Not scheduled","decision":"reject"}',5);

DELETE FROM public.industrial_strategy_entries
WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
  AND section_key = 'mfg-model' AND item_key = 'operating-model';

INSERT INTO public.industrial_strategy_entries (company_id, section_key, item_key, content)
VALUES ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','mfg-model','operating-model',
 'Flow: product-family cells with a fixed pacemaker at final assembly; WIP capped at two days between operations. Planning: SIOP monthly, finite schedule frozen two weeks. Quality: control plans on critical characteristics, source inspection at the treatment partner. Maintenance: PM compliance above 95% on the 5-axis cells. Daily management: SQDP boards at 07:15, escalation to SIC at 11:00.');

UPDATE public.companies SET is_template = true WHERE id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
