DO $$
DECLARE
  _cid uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
  _tid uuid := '11111111-2222-4333-8444-555555555555';
  _uid uuid;
BEGIN
  SELECT created_by INTO _uid FROM public.companies WHERE id = _cid;
  IF _uid IS NULL THEN RETURN; END IF;

  ALTER TABLE public.exec_room_threads DISABLE TRIGGER exec_room_threads_no_template_write;
  ALTER TABLE public.exec_room_messages DISABLE TRIGGER exec_room_messages_no_template_write;

  DELETE FROM public.exec_room_threads WHERE id = _tid;

  INSERT INTO public.exec_room_threads (id, company_id, created_by, title, created_at, updated_at)
  VALUES (_tid, _cid, _uid, 'Monthly leadership review — margin, OTD and manning', now() - interval '3 days', now() - interval '3 days');

  INSERT INTO public.exec_room_messages (thread_id, company_id, role, content, created_at) VALUES
  (_tid, _cid, 'user', 'We are behind on the EBIT bridge and OTD slipped again last month. Where should the leadership team focus in the next 30 days?', now() - interval '3 days'),
  (_tid, _cid, 'assistant',
'**CEO — framing**
We are carrying a gap to the bridge with two live root causes: schedule adherence on the machining cell and unrecovered cost of poor quality. Everything below is 30-day, owner-named work.

**Director of Operations**
- OTD is running below target, driven by the machining cell: kit completeness sits under the 95% threshold on three of five days.
- Short Interval Control shows the largest loss bucket is "waiting on info / RFI", not machine downtime — this is a process problem, not a capacity problem.
- Proposal: hold the daily SQDP escalation to a 24-hour contain / 5-day countermeasure loop and pull the top two repeat losses into A3s.

**Director of Quality**
- Cost of poor quality is concentrated in rework and concessions on a small number of part numbers; first-pass yield on those is the outlier.
- Recommend a focused MSA and control-plan review on those parts before we chase yield anywhere else.

**Finance Director**
- The efficiency lane of the waterfall is under-realised versus plan; the headwind lane is broadly as forecast, so the gap is delivery, not market.
- I need realisation percentages refreshed on the top initiatives so the bridge stops flattering us.

**Director of HR**
- Manning and skills coverage is the constraint behind the RFI aging: the cell is single-deep on two critical skills.
- Cross-training two operators closes that exposure inside the quarter; development plans already exist for both.

**Lean Director**
- Do not launch new initiatives this month. Finish the two open countermeasures first — we have more work-in-progress than closure capacity.

**Decisions & next actions**
1. Operations — stand up the 24h/5d escalation loop on the machining cell and open A3s on the top two loss codes. Within 5 days.
2. Quality — MSA plus control-plan review on the highest-COPQ part numbers. Within 15 days.
3. Finance — refresh realisation on the top initiatives and re-baseline the bridge. Within 10 days.
4. HR — start cross-training on the two single-deep skills. Kick off within 7 days.
5. Lean — freeze new initiative launches until the two open countermeasures are standardised. Immediate.

Caveat: this is grounded in the modules currently switched on for this workspace. Anything outside that scope is not visible to us.',
  now() - interval '3 days'),
  (_tid, _cid, 'user', 'What is the single biggest risk if we do nothing this month?', now() - interval '3 days'),
  (_tid, _cid, 'assistant',
'**CEO**
One risk, plainly: the delivery gap compounds into a commercial gap.

**Director of Operations**
- Unresolved RFI aging keeps pushing work right; the recovery cost per late unit rises the longer we wait.

**Commercial Director**
- Sustained OTD misses put renewal conversations at risk on the accounts where delivery is a scored KPI. That is a revenue exposure, not just an operational one.

**Finance Director**
- If realisation does not improve, the efficiency lane misses for the year and the bridge cannot be recovered inside the remaining months.

**Decisions & next actions**
1. Operations — treat RFI aging as the number one metric on the daily board this month.
2. Commercial — flag delivery risk to the two most exposed accounts before they raise it with us. Within 7 days.',
  now() - interval '3 days');

  ALTER TABLE public.exec_room_threads ENABLE TRIGGER exec_room_threads_no_template_write;
  ALTER TABLE public.exec_room_messages ENABLE TRIGGER exec_room_messages_no_template_write;
END $$;