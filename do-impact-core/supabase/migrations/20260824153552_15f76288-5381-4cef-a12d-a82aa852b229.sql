DO $$
DECLARE
  cid uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  own uuid := 'a4c631d7-0912-4404-89cf-e413df626aeb';
  w1 uuid; w2 uuid; w3 uuid; w4 uuid; w5 uuid;
BEGIN
  ALTER TABLE public.safety_walks DISABLE TRIGGER safety_walks_template_lock;
  ALTER TABLE public.safety_reports DISABLE TRIGGER safety_reports_template_lock;

  DELETE FROM public.safety_reports WHERE company_id = cid;
  DELETE FROM public.safety_walks WHERE company_id = cid;

  INSERT INTO public.safety_walks (company_id, walk_type, walk_date, area, department, led_by, participants, good_practices, notes)
  VALUES
    (cid, 'daily', current_date - 1, 'Machine shop — cell 4', 'Machining', 'R. Alvarez', 'Cell 4 operator', 'Operator verified zero energy state before changing the insert holder.', 'Housekeeping good; one coolant spill cleaned during the walk.'),
    (cid, 'weekly', current_date - 4, 'Assembly line B', 'Assembly', 'M. Chen', 'Supervisor + 2 operators', 'Team stopped the line themselves when a torque tool read out of tolerance.', 'Reviewed last week''s actions — two closed, one still open.'),
    (cid, 'monthly', current_date - 11, 'Full site', 'Operations', 'D. Orth (GM)', 'GM, EHS, Maintenance, Quality', 'Emergency exits clear across all bays; new LOTO board in use.', 'Cross-functional walk focused on system weaknesses, not individuals.'),
    (cid, 'daily', current_date - 18, 'Finishing & paint', 'Finishing', 'S. Patel', 'Finishing lead', 'Correct respirator fit-check observed before entering the booth.', 'Booth airflow gauge reading low end of range — logged.'),
    (cid, 'weekly', current_date - 26, 'Warehouse & shipping', 'Logistics', 'K. Novak', 'Warehouse supervisor', 'Forklift pre-use checklist fully completed for all three trucks.', 'Pedestrian walkway markings faded in two aisles.');

  SELECT id INTO w1 FROM public.safety_walks WHERE company_id=cid AND walk_date=current_date-1;
  SELECT id INTO w2 FROM public.safety_walks WHERE company_id=cid AND walk_date=current_date-4;
  SELECT id INTO w3 FROM public.safety_walks WHERE company_id=cid AND walk_date=current_date-11;
  SELECT id INTO w4 FROM public.safety_walks WHERE company_id=cid AND walk_date=current_date-18;
  SELECT id INTO w5 FROM public.safety_walks WHERE company_id=cid AND walk_date=current_date-26;

  INSERT INTO public.safety_reports
    (company_id, source, walk_id, report_type, occurred_at, location, department, reporter_name, anonymous,
     description, immediate_action, potential_consequence, severity, likelihood, immediate_control,
     permanent_action, control_level, owner_id, due_date, status, verified_by, effectiveness, closed_at, created_at)
  VALUES
    (cid,'safety_walk',w3,'unsafe_condition', now()-interval '11 days','Press shop — 200T press #2','Machining','D. Orth',false,
     'Exposed pinch point where the interlock guard on press #2 no longer closes fully.','Area barricaded and press tagged out of service.','Crush injury to hand or forearm.',
     4,4,'Press locked out and barricaded.','Install engineered guard with replacement interlock switch.','engineering',own,current_date+7,'in_progress',null,null,null, now()-interval '11 days'),

    (cid,'report',null,'near_miss', now()-interval '3 days','Assembly line B','Assembly','M. Chen',false,
     'Suspended fixture swung free when the lifting strap slipped; no one was underneath.','Lift stopped, strap removed from service.','Struck-by injury, potential fatality.',
     5,2,'Strap quarantined; lift halted.','Replace webbing slings with rated chain slings and add monthly inspection tags.','substitution',own,current_date+3,'open',null,null,null, now()-interval '3 days'),

    (cid,'report',null,'unsafe_behaviour', now()-interval '6 days','Warehouse aisle 3','Logistics',null,true,
     'Forklift operator repeatedly travelling with forks raised through the pedestrian crossing.','Operator coached on the spot by the supervisor.','Tip-over or pedestrian strike.',
     4,3,'Immediate coaching; traffic rules re-briefed at shift start.','Install convex mirrors and repaint pedestrian walkway lines.','engineering',own,current_date-2,'in_progress',null,null,null, now()-interval '6 days'),

    (cid,'safety_walk',w5,'unsafe_condition', now()-interval '26 days','Warehouse aisles 2 and 5','Logistics','K. Novak',false,
     'Pedestrian walkway markings faded to the point where the boundary is not visible.','Temporary cones placed along the route.','Pedestrian struck by a truck.',
     4,3,'Cones and temporary tape.','Re-paint walkways with anti-slip epoxy line marking.','engineering',own,current_date-9,'open',null,null,null, now()-interval '26 days'),

    (cid,'safety_walk',w4,'chemical', now()-interval '18 days','Paint booth 1','Finishing','S. Patel',false,
     'Booth extraction airflow reading at the low end of the acceptable range for two consecutive checks.','Booth usage limited to short runs pending check.','Solvent overexposure to operators.',
     3,3,'Reduced booth loading; respirators mandatory.','Replace extraction filters and rebalance the airflow; add weekly gauge log.','engineering',own,current_date+10,'verifying',null,null,null, now()-interval '18 days'),

    (cid,'report',null,'injury', now()-interval '34 days','Deburr bench','Machining','Team lead',false,
     'Operator sustained a laceration to the left index finger while deburring a bracket without cut-resistant gloves.','First aid administered; task stopped.','Deep laceration requiring sutures.',
     3,4,'Task stopped; gloves issued.','Cut-resistant gloves added to the standard PPE list and to the work instruction; deburr fixture introduced.','administrative',own,current_date-20,'closed','EHS Manager','Verified 4 weeks later: gloves in use on all shifts, no repeat cuts recorded.',current_date-18, now()-interval '34 days'),

    (cid,'report',null,'ergonomic', now()-interval '21 days','Kitting station 2','Assembly','A. Ruiz',false,
     'Operators lifting 18 kg kit trays from floor level up to bench height around 40 times per shift.','Two-person lift instructed as an interim measure.','Cumulative back injury.',
     3,3,'Two-person lift.','Install a scissor lift table and re-position tray delivery at waist height.','engineering',own,current_date+21,'open',null,null,null, now()-interval '21 days'),

    (cid,'safety_walk',w2,'equipment', now()-interval '4 days','Assembly line B — station 3','Assembly','M. Chen',false,
     'Torque tool reading out of tolerance; calibration sticker expired two months ago.','Tool removed from service.','Under-torqued safety-critical fasteners.',
     3,4,'Tool quarantined; spare issued.','Add torque tools to the calibration recall system with an automatic due alert.','administrative',own,current_date+5,'in_progress',null,null,null, now()-interval '4 days'),

    (cid,'report',null,'fire_life_safety', now()-interval '48 days','Rear of finishing bay','Finishing',null,true,
     'Emergency exit route partly blocked by stacked empty pallets.','Pallets moved immediately during the shift.','Delayed evacuation during a fire.',
     4,2,'Route cleared within minutes.','Floor-marked pallet staging zone away from all egress routes; added to daily walk checklist.','administrative',own,current_date-40,'closed','Site Leader','Verified across four subsequent walks: egress routes clear, staging zone in use.',current_date-38, now()-interval '48 days'),

    (cid,'safety_walk',w1,'unsafe_condition', now()-interval '1 day','Machine shop — cell 4','Machining','R. Alvarez',false,
     'Coolant leak from cell 4 creating a slip hazard at the operator position.','Spill cleaned and absorbent mat placed.','Slip and fall injury.',
     2,4,'Absorbent mat and clean-up.','Repair the coolant return seal on the machine and add to the PM schedule.','engineering',own,current_date+4,'open',null,null,null, now()-interval '1 day'),

    (cid,'report',null,'near_miss', now()-interval '15 days','Machine shop — cell 1','Machining','Operator',false,
     'Chuck key left in the lathe chuck; spotted before the operator started the spindle.','Key removed; shift briefing held.','Ejected projectile causing serious head injury.',
     5,2,'Key removed; briefing.','Fit spring-ejecting chuck keys on all lathes.','engineering',own,current_date+14,'in_progress',null,null,null, now()-interval '15 days'),

    (cid,'report',null,'environmental', now()-interval '29 days','Chemical store','Finishing','S. Patel',false,
     'Solvent drum stored outside secondary containment next to a floor drain.','Drum moved into the bunded area immediately.','Environmental release into the storm drain.',
     3,3,'Drum relocated.','Expand the bunded storage area and label all drum positions.','engineering',own,current_date-5,'verifying',null,null,null, now()-interval '29 days'),

    (cid,'report',null,'suggestion', now()-interval '9 days','Machine shop','Machining','R. Alvarez',false,
     'Suggestion: add a shadow board for lifting equipment so damaged slings are visible at a glance.',null,'Faster detection of damaged lifting gear.',
     1,3,null,'Build and install a lifting-equipment shadow board with monthly inspection colour coding.','administrative',own,current_date+30,'open',null,null,null, now()-interval '9 days'),

    (cid,'report',null,'unsafe_condition', now()-interval '60 days','Warehouse aisle 5','Logistics',null,true,
     'Damaged pallet racking upright at the corner of aisle 5, struck by a truck.','Bay off-loaded and cordoned off.','Rack collapse with a load overhead.',
     5,3,'Bay emptied and cordoned.','Replace the damaged upright and fit column protectors to all aisle-end uprights.','engineering',own,current_date-45,'closed','EHS Manager','Verified: upright replaced, protectors fitted, follow-up rack inspection found no further damage.',current_date-44, now()-interval '60 days');

  ALTER TABLE public.safety_walks ENABLE TRIGGER safety_walks_template_lock;
  ALTER TABLE public.safety_reports ENABLE TRIGGER safety_reports_template_lock;
END $$;