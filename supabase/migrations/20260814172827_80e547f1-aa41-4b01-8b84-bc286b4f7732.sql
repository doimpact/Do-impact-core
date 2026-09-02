ALTER TABLE public.eol_programs DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_programs DISABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_programs DISABLE TRIGGER set_company_id_eol_programs;
ALTER TABLE public.eol_gate_checklist DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_gate_checklist DISABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_gate_checklist DISABLE TRIGGER set_company_id_eol_gate_checklist;
ALTER TABLE public.eol_readiness DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_readiness DISABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_readiness DISABLE TRIGGER set_company_id_eol_readiness;
ALTER TABLE public.eol_ltb_items DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_ltb_items DISABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_ltb_items DISABLE TRIGGER set_company_id_eol_ltb_items;
ALTER TABLE public.eol_asset_disposition DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_asset_disposition DISABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_asset_disposition DISABLE TRIGGER set_company_id_eol_asset_disposition;
ALTER TABLE public.eol_customer_migration DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_customer_migration DISABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_customer_migration DISABLE TRIGGER set_company_id_eol_customer_migration;

DELETE FROM public.eol_programs WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';

INSERT INTO public.eol_programs
  (id, company_id, product_name, platform, family, description, phase, status, health,
   eos_announce_date, ltb_cutoff_date, fts_date, line_clear_date, closeout_date,
   reserve_budget, lifetime_revenue, currency, notes)
VALUES
  ('5b1c0a10-1111-4a10-9f01-e01a00000001', '9d12cf46-98e4-40ca-aed4-bcc95257d8b5',
   'TS-400 Legacy Fastener Family', 'Regional turboprop', 'Fasteners',
   'Legacy titanium collar fastener family. Margin eroded to 4% after alloy cost inflation and two obsolete surface-treatment sources. Superseded by the TS-600 family.',
   3, 'active', 'yellow', '2025-11-14', '2026-05-29', '2026-11-27', '2027-01-15', NULL,
   680000, 42500000, 'USD', 'LTB demand model signed by Aftermarket; final component POs being placed.'),
  ('5b1c0a10-1111-4a10-9f01-e01a00000002', '9d12cf46-98e4-40ca-aed4-bcc95257d8b5',
   'HX-12 Machined Bracket (low volume)', 'Business jet', 'Structures',
   'Low-volume machined bracket running at negative contribution on a dedicated cell. Two customers remain; both offered a migration to the HX-18 common bracket.',
   4, 'active', 'green', '2025-03-06', '2025-09-30', '2026-03-31', '2026-05-08', NULL,
   240000, 9800000, 'USD', 'Final ship complete. Cell decommissioned; tooling audit and USM harvesting under way.');

UPDATE public.eol_gate_checklist SET completed = true, completed_at = now() - interval '120 days'
 WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
   AND program_id = '5b1c0a10-1111-4a10-9f01-e01a00000001' AND phase <= 2;
UPDATE public.eol_gate_checklist SET completed = true, completed_at = now() - interval '30 days'
 WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
   AND program_id = '5b1c0a10-1111-4a10-9f01-e01a00000001' AND phase = 3 AND sort_order <= 2;
UPDATE public.eol_gate_checklist SET completed = true, completed_at = now() - interval '200 days'
 WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
   AND program_id = '5b1c0a10-1111-4a10-9f01-e01a00000002' AND phase <= 3;
UPDATE public.eol_gate_checklist SET completed = true, completed_at = now() - interval '25 days'
 WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
   AND program_id = '5b1c0a10-1111-4a10-9f01-e01a00000002' AND phase = 4 AND sort_order <= 2;

INSERT INTO public.eol_readiness (company_id, program_id, domain, deliverable, rag, complete, sort_order, notes) VALUES
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Commercial','End-of-Sale notice issued to all 6 contracted customers','green',true,1,'Notices acknowledged; two LTSA amendments signed.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Supply chain','Final component POs placed with all sole-source suppliers','yellow',false,2,'Two heat-treat sources still to confirm the last lot.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Engineering','Build records, FAI reports and CAD archived to controlled vault','yellow',false,3,'CAD migrated; test software pending.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Operations','Cell phase-out plan with operator re-skilling agreed','green',true,4,'12 operators mapped to the TS-600 cell.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Finance','EOL reserve approved and phased across FY26/FY27','green',true,5,'$680k reserve; $310k drawn to date.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Aftermarket','Spares coverage modelled to 2036 support horizon','red',false,6,'Gap of ~14 months on two collar variants.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','Commercial','Both customers migrated to HX-18 with price agreed','green',true,1,NULL),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','Operations','Cell cleared, floor space re-allocated to HX-18','green',true,2,'420 sq ft released.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','Asset recovery','Tooling and fixture audit complete with disposition decisions','yellow',false,3,'Two fixtures awaiting scrap approval.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','EHS','Coolant and chemical decommissioning signed off','green',true,4,NULL),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','Finance','Scrap write-down reconciled against reserve','yellow',false,5,'Reconciliation booked at month-end.');

INSERT INTO public.eol_ltb_items (company_id, program_id, part_number, description, risk_tier, supplier, forecast_qty, ordered_qty, consumed_qty, unit_cost, holding_strategy, notes) VALUES
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','TS-400-COL-A','Titanium collar, 6-32','high','Alpine Alloys',18400,18400,4120,14.80,'stock','Sole source; last heat lot reserved.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','TS-400-PIN-B','Shear pin, cadmium-free finish','high','Northline Plating',12600,9800,2100,9.35,'stock','Finish line closing Q3; shortfall of 2,800 to resolve.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','TS-400-WSH-C','Locking washer','medium','Ferro Components',31000,31000,11400,1.15,'stock',NULL),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','TS-400-SEAL-D','Elastomer seal (shelf-life limited)','medium','Polymer Craft',7400,5200,1800,3.60,'buy_ahead','24-month shelf life; staged buy agreed.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','HX-12-BLK-01','7075-T6 billet blank','low','Cascade Metals',900,900,900,42.00,'stock','Fully consumed at final time ship.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','HX-12-INS-02','Threaded insert','low','Ferro Components',3600,3600,3180,2.40,'stock','420 remaining held for warranty.');

INSERT INTO public.eol_asset_disposition (company_id, program_id, asset_name, asset_tag, disposition, book_value, realized_value, status, location, notes) VALUES
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Cold-heading die set (TS-400)','TL-2214','retain', 86000, NULL,'planned','Tool crib A','Retained for spares production to 2030.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Thread-roll fixture bank','TL-2231','transfer', 24000, NULL,'in_progress','Cell 4','Transfers to the TS-600 cell.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Inspection gauge set','TL-2240','sell', 12500, 8200,'in_progress','Metrology lab','Two bids received.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','HX-12 dedicated workholding','TL-1808','scrap', 9800, 1200,'complete','Cell 2','Scrap value recovered.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','5-axis machine (freed capacity)','EQ-0442','transfer', 310000, NULL,'complete','Cell 2','Re-tasked to HX-18; 1,100 hrs/yr capacity released.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','USM core stock (returned brackets)','—','harvest', 0, 34000,'complete','Aftermarket store','62 cores harvested for aftermarket support.');

INSERT INTO public.eol_customer_migration (company_id, program_id, customer, current_product, target_product, notice_date, status, revenue_at_risk, notes) VALUES
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Meridian Aerospace','TS-400 collar kit','TS-600 collar kit','2025-11-14','migrated', 1250000,'Qualification complete on the TS-600.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Northstar Turbines','TS-400 pin set','TS-600 pin set','2025-11-14','in_progress', 890000,'First article in test; LTB placed as bridge.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Cobalt MRO','TS-400 spares','TS-400 LTB stock','2025-11-20','in_progress', 430000,'Spares-only agreement to 2036.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000001','Vector Defense','TS-400 collar kit','TS-600 collar kit','2025-11-14','notified', 610000,'Awaiting customer qualification slot.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','Halcyon Jets','HX-12 bracket','HX-18 bracket','2025-03-06','migrated', 520000,'Migrated ahead of final time ship.'),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','5b1c0a10-1111-4a10-9f01-e01a00000002','Sierra Charter','HX-12 bracket','HX-18 bracket','2025-03-06','migrated', 180000,'Warranty stock retained to 2028.');

ALTER TABLE public.eol_programs ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_programs ENABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_programs ENABLE TRIGGER set_company_id_eol_programs;
ALTER TABLE public.eol_gate_checklist ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_gate_checklist ENABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_gate_checklist ENABLE TRIGGER set_company_id_eol_gate_checklist;
ALTER TABLE public.eol_readiness ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_readiness ENABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_readiness ENABLE TRIGGER set_company_id_eol_readiness;
ALTER TABLE public.eol_ltb_items ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_ltb_items ENABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_ltb_items ENABLE TRIGGER set_company_id_eol_ltb_items;
ALTER TABLE public.eol_asset_disposition ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_asset_disposition ENABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_asset_disposition ENABLE TRIGGER set_company_id_eol_asset_disposition;
ALTER TABLE public.eol_customer_migration ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_customer_migration ENABLE TRIGGER trg_enforce_write_access;
ALTER TABLE public.eol_customer_migration ENABLE TRIGGER set_company_id_eol_customer_migration;