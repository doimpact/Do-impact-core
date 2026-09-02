do $$
declare c uuid := '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';
begin
  alter table public.industrial_strategy_entries disable trigger user;
  alter table public.industrial_strategy_rows disable trigger user;

  delete from public.industrial_strategy_entries where company_id = c;
  delete from public.industrial_strategy_rows where company_id = c;

  insert into public.industrial_strategy_entries (company_id, section_key, item_key, content, status, position) values
  (c,'cascade','ambition','Become the preferred North American supplier of flight-critical machined fasteners and brackets for Tier 1 aerostructures and engine customers, differentiated by engineering-led problem solving and 2-week responsiveness, reaching $78M revenue at 18% EBITDA and 15% ROIC by FY2029.','open',0),
  (c,'cascade','where-to-play','PLAY: aerospace structural fasteners (AS9100/NADCAP), engine bracketry, low-volume/high-mix defence spares. DO NOT PLAY: commodity catalogue fasteners, automotive volume work, distribution-led private label.','open',1),
  (c,'cascade','how-to-win','Engineering (design-for-manufacture on difficult geometries), Delivery (14-day standard lead time), Risk reduction (domestic, fully traceable, NADCAP special processes in house).','open',2),
  (c,'cascade','capabilities','Short-setup flexible machining cells, in-house special processes, PPAP/FAI velocity, cost-to-quote engineering, digital traceability from bar stock to certificate.','open',3),
  (c,'cascade','industrial-model','Make all flight-critical machining and special processes; buy raw bar, standard hardware and non-critical secondary ops; partner on additive prototypes and heat treat overflow. Two cells: high-mix (Plant 1) and repeat-runner (Plant 2 expansion).','open',4),
  (c,'cascade','economics','FY26 $47M / 11.4% EBITDA. FY29 target $78M / 18% EBITDA, gross margin 34%, working capital 21% of sales, capex $9.6M over three years, ROIC 15%.','open',5),
  (c,'cascade','transformation','0-90 days: exit the 42 loss-making legacy SKUs, launch quote-to-cost engineering, stand up the setup-reduction programme on the bottleneck cells, fund the 5-axis cell and the traceability platform.','open',6),

  (c,'components','c-ambition','$78M revenue, $14M EBITDA (18%), 34% gross margin, North America + UK aftermarket, three segments (Tier 1 aerostructures, engine, defence spares), top-3 position in flight-critical machined fasteners, 15% ROIC, moderate risk appetite, two-plant footprint, engineering + special processes as owned capabilities.','open',0),
  (c,'components','c-market','Addressable NA market $2.1B growing 6.4% with build-rate cyclicality; industry EBIT 9-14%; top 5 customers = 61% of our revenue (too concentrated); pricing +3.1% on long-term agreements; titanium and Inconel supply still constrained; NADCAP approvals are the practical barrier to entry.','open',1),
  (c,'components','c-competitive','Customers pick competitors on price for repeat runners and on capacity for surges. Economic profit sits in engineering-intensive, certification-heavy parts — not in machining hours. Our 2-3 advantages: engineering, delivery, risk reduction.','open',2),
  (c,'components','c-product','GROW engine bracketry and flight-critical fasteners; FIX the HX series margin through setup reduction; SIMPLIFY the 180-variant legacy catalogue to 60; HARVEST defence spares; EXIT the TS-400 legacy family (already in LCG 8).','open',3),
  (c,'components','c-manufacturing','Cellular flow by process family, pull between cells with 3-day WIP cap; SIOP monthly with 12-week APS scheduling; quality shifted to design-prevent-control with SPC on 22 critical characteristics; planned maintenance on the four bottleneck machines; SQDP daily management at 07:15.','open',4),
  (c,'components','c-supply','Make: machining, special processes, final inspection. Buy: bar stock, standard hardware, plating overflow. Partner: additive prototyping, metallurgical lab. 7 single-source exposures, 3 of them critical with >26-week switching time.','open',5),
  (c,'components','c-footprint','Plant 1 at 87% effective capacity, bottleneck at 5-axis; Plant 2 has 14k sq ft of expansion. Sequence: setup reduction -> debottleneck -> second 5-axis cell -> third shift -> only then new floor space. Total landed cost favours domestic over offshore for certified work.','open',6),
  (c,'components','c-technology','Problem-first roadmap: setup time -> quick-change fixturing (ROI 14 months); traceability cost -> MES with certificate automation (ROI 22 months); quoting accuracy -> should-cost model; inspection bottleneck -> automated CMM cell. No technology without a named economic problem.','open',7),
  (c,'components','c-transformation','11 funded initiatives, each with a single accountable owner, monthly Industrial Strategy Review on the first Tuesday, benefits tracked in the Waterfall against the FY26 baseline.','open',8),

  (c,'how-to-win','engineering',null,'selected',0),
  (c,'how-to-win','delivery',null,'selected',1),
  (c,'how-to-win','risk',null,'selected',2),
  (c,'how-to-win','rationale','Customers who buy on price alone are not our customers. Our win rate is 61% where a print change or a producibility issue exists, and 18% on drop-in repeat work. Trade-off accepted: we will not be the cheapest on standard runners and we will decline pure-price RFQs below 26% contribution.','open',3),

  (c,'guardrails','twelve-questions','Owner answers: growth must not come from more variants; the family will not fund a third plant before FY29; the business is being built to keep, not to sell; the biggest single risk is customer concentration at 61%; the capability we most lack is cost-to-quote engineering.','open',0),
  (c,'guardrails','moat','The moat is certification plus engineering: NADCAP special processes in house, 22 qualified critical characteristics, and an engineering team that can re-spec a customer print in 5 days. A larger competitor can buy the machines but cannot economically replicate the approvals and the response time on our part mix.','open',1);

  insert into public.industrial_strategy_entries (company_id, section_key, item_key, content, status, position) values
  (c,'steps','s1','Ambition agreed with ownership 12 Mar. $78M / 18% / 15% ROIC by FY29.','done',0),
  (c,'steps','s2','Fact base built from FY24-FY26 actuals; economic waterfall shows 6.2pts lost to scrap and expedite freight.','done',1),
  (c,'steps','s3','Three segments scored; defence spares kept on maintain, distribution private label marked exit.','done',2),
  (c,'steps','s4','Engineering, delivery and risk reduction selected. Cost explicitly not a chosen advantage.','done',3),
  (c,'steps','s5','Capability map complete; two gaps (should-cost engineering, automated inspection) have owners.','done',4),
  (c,'steps','s6','Product review complete; 42 SKUs flagged for exit, TS-400 already in LCG 8.','done',5),
  (c,'steps','s7','Make/buy logic agreed. Cellular layout for Plant 1 drafted, pending industrial engineering sign-off.','open',6),
  (c,'steps','s8','Capacity model built to FY29 base and high case; bottleneck confirmed as 5-axis and CMM.','done',7),
  (c,'steps','s9','Plant 2 expansion costed at $4.1M total landed; offshore option rejected on certification risk.','open',8),
  (c,'steps','s10','Supplier segmentation done; 3 critical single sources need dual-qualification plans.','open',9),
  (c,'steps','s11','Technology roadmap tied to four named economic problems; MES business case in draft.','open',10),
  (c,'steps','s12','Clean-sheet cost model built for the top 12 products; complexity cost quantified at $1.9M/yr.','open',11),
  (c,'steps','s13','Quality strategy drafted: shift 60% of inspection effort to prevention by FY28.','open',12),
  (c,'steps','s14','Org design pending — needs a VP Operations and a cost engineer.','open',13),
  (c,'steps','s15','Capital allocation framework agreed; all requests scored on the same sheet from Q3.','open',14),
  (c,'steps','s16','11 initiatives funded and loaded into Progress with monthly benefit tracking.','done',15),

  (c,'phases','p1','Charter signed 4 Mar; steering group is CEO, CFO, VP Ops, VP Commercial.','done',0),
  (c,'phases','p2','Fact base pack issued 22 Mar (78 slides of data, no recommendations).','done',1),
  (c,'phases','p3','14 customer interviews, 4 lost-customer interviews completed.','done',2),
  (c,'phases','p4','Value stream walks on 3 streams; capability gaps documented.','done',3),
  (c,'phases','p5','Choices ratified by ownership 6 May.','done',4),
  (c,'phases','p6','Target operating model in design; layout and planning model outstanding.','open',5),
  (c,'phases','p7','Business case at draft 2; ROIC bridge under review with CFO.','open',6),
  (c,'phases','p8','Roadmap drafted for 0-90 days and 3-12 months.','open',7),
  (c,'phases','p9','Board session scheduled for 9 Sep — decision, not presentation.','open',8),

  (c,'cockpit','revenue','$47.2M FY26 run rate (+8.1% YoY)','open',0),
  (c,'cockpit','ebitda','11.4% vs 13.0% plan','open',1),
  (c,'cockpit','roic','9.2% (target 15%)','open',2),
  (c,'cockpit','cash','$3.6M net cash; DSO 54 days','open',3),
  (c,'cockpit','growth','Segment growth 6.4%; our bookings +11%','open',4),
  (c,'cockpit','win-rate','34% overall; 61% on engineering-led RFQs','open',5),
  (c,'cockpit','price','+3.1% realised on LTAs','open',6),
  (c,'cockpit','concentration','Top 5 = 61% of revenue (risk)','open',7),
  (c,'cockpit','p-margin','Contribution 31.4% (target 34%)','open',8),
  (c,'cockpit','p-complexity','180 active variants -> 60 by FY28','open',9),
  (c,'cockpit','npi','6 programmes in gate 3+','open',10),
  (c,'cockpit','supplier-risk','3 critical single sources','open',11),
  (c,'cockpit','material-cost','Titanium +7.8% YoY','open',12),
  (c,'cockpit','benefits','$2.4M realised of $6.1M FY26 target','open',13),
  (c,'cockpit','capex','$3.1M committed of $9.6M programme','open',14),
  (c,'cockpit','milestones','18 of 24 on track','open',15),
  (c,'cockpit','risks','2 red: single-source forging, CMM capacity','open',16),

  (c,'monthly-review','financial','Reviewed 4 Aug. EBITDA 1.6pts behind plan, driven by scrap on the HX series.','open',0),
  (c,'monthly-review','commercial','Pipeline healthy; concentration action plan required by Sep.','open',1),
  (c,'monthly-review','manufacturing','OEE 62% on bottleneck cells; setup reduction pilot delivering.','open',2),
  (c,'monthly-review','quality','Customer PPM 480, FPY 91.2%, COPQ 3.1% of sales.','open',3),
  (c,'monthly-review','supply','OTIF from suppliers 87%; 11 expedites in month.','open',4),
  (c,'monthly-review','transformation','9 of 11 initiatives on track; MES business case slipping.','open',5);

  insert into public.industrial_strategy_rows (company_id, section_key, label, data, position) values
  (c,'segments','', '{"segment":"Tier 1 aerostructures - flight-critical fasteners","attractiveness":5,"rightToWin":4,"notes":"Certification barrier, engineering-led, 34% contribution"}', 0),
  (c,'segments','', '{"segment":"Engine bracketry & hot-section hardware","attractiveness":5,"rightToWin":4,"notes":"Growing build rates, Inconel capability already proven"}', 1),
  (c,'segments','', '{"segment":"Defence spares & low-volume repair","attractiveness":3,"rightToWin":4,"notes":"Steady, high margin, low growth - maintain"}', 2),
  (c,'segments','', '{"segment":"Commercial catalogue fasteners","attractiveness":3,"rightToWin":2,"notes":"Price-led, offshore cost base - build only via distribution partner"}', 3),
  (c,'segments','', '{"segment":"Automotive tier 2 machining","attractiveness":2,"rightToWin":1,"notes":"Volume economics we cannot serve - exit"}', 4),

  (c,'capabilities','', '{"requirement":"14-day standard lead time","capability":"Flexible cells with sub-15-minute setups","maturity":"partial","action":"Setup reduction on 5-axis - VP Ops, Q3"}', 0),
  (c,'capabilities','', '{"requirement":"Solve producibility problems on customer prints","capability":"Cost-to-quote / DFM engineering","maturity":"none","action":"Hire cost engineer - CEO, Q3"}', 1),
  (c,'capabilities','', '{"requirement":"Full traceability and certification","capability":"MES with automated cert packs","maturity":"partial","action":"MES business case - CFO, Q4"}', 2),
  (c,'capabilities','', '{"requirement":"Domestic supply security","capability":"In-house NADCAP special processes","maturity":"have","action":"Maintain approvals - Quality Manager"}', 3),
  (c,'capabilities','', '{"requirement":"First-article velocity","capability":"Automated CMM + PPAP workflow","maturity":"none","action":"CMM cell capex - VP Ops, FY27"}', 4),
  (c,'capabilities','', '{"requirement":"Surge capacity for build-rate spikes","capability":"Cross-trained operators + third shift plan","maturity":"partial","action":"Skills matrix build-out - HR, Q4"}', 5),

  (c,'products','', '{"product":"AF-900 flight-critical fastener family","revenue":14200000,"margin":38,"complexity":"high","bucket":"grow"}', 0),
  (c,'products','', '{"product":"EB-200 engine bracketry","revenue":9800000,"margin":35,"complexity":"high","bucket":"grow"}', 1),
  (c,'products','', '{"product":"HX-12 machined bracket","revenue":6400000,"margin":19,"complexity":"med","bucket":"fix"}', 2),
  (c,'products','', '{"product":"Legacy catalogue variants (180 SKUs)","revenue":7100000,"margin":14,"complexity":"high","bucket":"simplify"}', 3),
  (c,'products','', '{"product":"Defence spares","revenue":5300000,"margin":31,"complexity":"low","bucket":"harvest"}', 4),
  (c,'products','', '{"product":"TS-400 legacy fastener family","revenue":4400000,"margin":6,"complexity":"high","bucket":"exit"}', 5),

  (c,'suppliers','', '{"supplier":"Titanium bar - Meridian Metals","spend":6100000,"leadTime":26,"class":"strategic","risk":"high","mitigation":"Dual-qualify second mill by Q1 FY27"}', 0),
  (c,'suppliers','', '{"supplier":"Inconel forgings - Castell Forge","spend":3400000,"leadTime":32,"class":"bottleneck","risk":"high","mitigation":"Safety stock + alternate forge trial"}', 1),
  (c,'suppliers','', '{"supplier":"Heat treat overflow - ThermTech","spend":880000,"leadTime":3,"class":"bottleneck","risk":"med","mitigation":"Bring critical loads in house FY27"}', 2),
  (c,'suppliers','', '{"supplier":"Standard hardware - NorthFast Distribution","spend":1200000,"leadTime":4,"class":"leverage","risk":"low","mitigation":"Re-tender annually"}', 3),
  (c,'suppliers','', '{"supplier":"Cutting tools & consumables","spend":740000,"leadTime":2,"class":"transactional","risk":"low","mitigation":"Vendor-managed inventory"}', 4),

  (c,'initiatives','', '{"objective":"Lift EBITDA to 18%","initiative":"Exit 42 loss-making legacy SKUs (LCG 8)","owner":"VP Commercial","baseline":"6% contribution","target":"Portfolio +1.4pts","impact":1150000,"investment":120000,"timing":"Q3 FY26 - Q2 FY27","kpi":"Contribution margin %","risk":"Customer pushback on last-time-buy"}', 0),
  (c,'initiatives','', '{"objective":"14-day lead time","initiative":"Setup reduction on 5-axis and mill-turn cells","owner":"VP Operations","baseline":"47 min avg setup","target":"<15 min","impact":840000,"investment":310000,"timing":"Q3 FY26 - Q1 FY27","kpi":"Avg setup time / OEE","risk":"Fixturing lead time"}', 1),
  (c,'initiatives','', '{"objective":"Win engineering-led work","initiative":"Stand up cost-to-quote engineering","owner":"CEO","baseline":"34% win rate","target":"45% win rate","impact":1600000,"investment":180000,"timing":"Q3 FY26 - Q4 FY26","kpi":"Win rate on engineered RFQs","risk":"Hiring market"}', 2),
  (c,'initiatives','', '{"objective":"Debottleneck capacity","initiative":"Second 5-axis machining cell","owner":"VP Operations","baseline":"87% utilisation","target":"+22% throughput","impact":2100000,"investment":2400000,"timing":"Q1 FY27 - Q3 FY27","kpi":"Throughput hours","risk":"Capex phasing vs cash"}', 3),
  (c,'initiatives','', '{"objective":"Reduce COPQ","initiative":"SPC on 22 critical characteristics","owner":"Quality Manager","baseline":"COPQ 3.1% of sales","target":"<1.8%","impact":610000,"investment":95000,"timing":"Q3 FY26 - Q2 FY27","kpi":"COPQ, FPY","risk":"Operator adoption"}', 4),
  (c,'initiatives','', '{"objective":"De-risk supply","initiative":"Dual-source titanium and forgings","owner":"Supply Chain Manager","baseline":"3 critical single sources","target":"0 critical single sources","impact":400000,"investment":140000,"timing":"Q4 FY26 - Q2 FY27","kpi":"Single-source exposure","risk":"Qualification time"}', 5),
  (c,'initiatives','', '{"objective":"Traceability at lower cost","initiative":"MES + automated certificate packs","owner":"CFO","baseline":"9 hrs/order admin","target":"<2 hrs/order","impact":520000,"investment":680000,"timing":"Q1 FY27 - Q4 FY27","kpi":"Cert admin hours","risk":"Business case not yet approved"}', 6),
  (c,'initiatives','', '{"objective":"Reduce concentration","initiative":"Win 3 new Tier 1 accounts","owner":"VP Commercial","baseline":"Top 5 = 61%","target":"Top 5 < 50%","impact":3200000,"investment":220000,"timing":"Q3 FY26 - Q4 FY27","kpi":"Revenue concentration","risk":"Long qualification cycles"}', 7);

  alter table public.industrial_strategy_entries enable trigger user;
  alter table public.industrial_strategy_rows enable trigger user;
end $$;