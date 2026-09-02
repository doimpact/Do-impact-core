-- Seed TitanScale Template demo commercial data: quotes + interactions
alter table public.quotes disable trigger user;
alter table public.interactions disable trigger user;

do $$
declare cid uuid; a1 uuid := '30000000-0000-0000-0000-000000000001';
        a2 uuid := '30000000-0000-0000-0000-000000000002';
        a3 uuid := '30000000-0000-0000-0000-000000000003';
begin
  select id into cid from public.companies where name = 'TitanScale Template' limit 1;
  if cid is null then return; end if;

  delete from public.quotes where company_id = cid;
  delete from public.interactions where company_id = cid;

  insert into public.quotes (company_id, number, account_id, title, amount, currency, status, expected_close_date, delivery_date, notes) values
    (cid,'Q-2401',a1,'Titanium bracket family — rate 8 uplift',1850000,'USD','negotiating',current_date + 34, current_date + 120,'Price held at 3% below target margin; tooling amortised over 24 months.'),
    (cid,'Q-2402',a1,'Landing gear pin machining — 3yr LTA',2400000,'USD','sent',current_date + 61, current_date + 210,'LTA renewal; escalation clause under review.'),
    (cid,'Q-2403',a2,'Engine mount overhaul kits',720000,'USD','approved',current_date + 12, current_date + 75,'Approved pending PO release.'),
    (cid,'Q-2404',a2,'AOG rapid-response machining slot',185000,'USD','draft',current_date + 45, current_date + 90,'Premium slot pricing, capacity check with APS.'),
    (cid,'Q-2405',a3,'Defence actuator housings — Lot 4',1320000,'USD','negotiating',current_date + 27, current_date + 150,'Customer pushing 6% down; margin floor 24%.'),
    (cid,'Q-2406',a3,'Structural fittings retrofit programme',960000,'USD','closed_won',current_date - 20, current_date + 60,'Won on lead time, not price.'),
    (cid,'Q-2407',a1,'Hydraulic manifold spares package',430000,'USD','closed_won',current_date - 48, current_date + 40,'Repeat spares business, 31% margin.'),
    (cid,'Q-2408',a2,'Nacelle detail parts — dual source',540000,'USD','closed_lost',current_date - 33, null,'Lost on price to offshore competitor.'),
    (cid,'Q-2409',a3,'Test rig fixtures',145000,'USD','closed_lost',current_date - 61, null,'No capacity in window; declined to bid aggressively.');

  insert into public.interactions (company_id, account_id, type, subject, body_text, occurred_at) values
    (cid,a1,'meeting','Quarterly business review — NorthStar Aero','Rate 8 ramp confirmed. Agreed recovery plan on two late part numbers.', now() - interval '2 day'),
    (cid,a3,'call','Lot 4 pricing call with Helios procurement','They want 6% down; we offered 2% with a 24-month volume commitment.', now() - interval '4 day'),
    (cid,a2,'email','Aurora MRO — engine mount kit PO timing','PO expected next week once their board signs the maintenance budget.', now() - interval '6 day'),
    (cid,a1,'meeting','On-site quality escape review','Closed out containment; 8D moves to root cause this week.', now() - interval '9 day'),
    (cid,a2,'note','AOG slot demand rising','Third AOG request this month — worth a standing premium slot.', now() - interval '12 day'),
    (cid,a3,'update','Structural fittings retrofit awarded','Won on lead time. Kick-off gate scheduled with NPI.', now() - interval '15 day'),
    (cid,a1,'call','LTA renewal escalation clause','Legal reviewing index-linked escalation before we resubmit.', now() - interval '19 day'),
    (cid,a2,'email','Nacelle details — debrief after loss','Feedback: price 11% high. Reviewing make-vs-buy on details.', now() - interval '24 day');
end $$;

alter table public.quotes enable trigger user;
alter table public.interactions enable trigger user;