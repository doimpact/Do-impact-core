SET LOCAL session_replication_role = 'replica';

INSERT INTO public.hoshin_reviews (id, company_id, title, review_date, owner_id, notes, findings, catchball)
VALUES (
 '6f1a2b30-0000-4000-8000-000000000001',
 '9d12cf46-98e4-40ca-aed4-bcc95257d8b5',
 '2026 Hoshin cascade review — Q1',
 '2026-03-12',
 '61000000-0000-0000-0000-000000000001',
 'Cascade is sound at the top: the breakthroughs are measurable and each has annual objectives with named owners. Two real gaps: several improvement priorities still carry no agreed baseline, and catchball with the value streams was top-down only. Countermeasure: Priya Nair to publish baseline + target for every priority metric before the April review; Marcus Chen to run a two-way catchball session per value stream in week 15 and bring negotiated targets back to the SLT.',
 '[
  {"key":"breakthrough","state":"ok","note":"Breakthroughs stated as outcomes with dates: 12% EBIT margin by 2029, 95% OTD sustained, AS9100 zero majors."},
  {"key":"annual","state":"ok","note":"Each breakthrough has 2026 annual objectives underneath it — no orphans in the X-Matrix."},
  {"key":"priority","state":"ok","note":"Priorities are concrete projects: setup reduction on the 5-axis cell, titanium bracket scrap, quoting accuracy."},
  {"key":"metric","state":"gap","note":"Several priorities have a target but no agreed baseline, so movement cannot be proven. Owner: Priya Nair, due before the April review."},
  {"key":"owner","state":"ok","note":"Single named owner on every row after the February clean-up."},
  {"key":"floor","state":"gap","note":"Margin breakthrough traces to scrap % and first-pass yield, but the OTD breakthrough has no daily shop-floor measure on the finishing cell yet."},
  {"key":"catchball","state":"gap","note":"Targets were set corporate-to-plant and cascaded down. Value stream leads were informed, not consulted. Two-way session scheduled week 15."},
  {"key":"cadence","state":"ok","note":"Monthly Hoshin review on the first Thursday; countermeasure required for any metric red two months running."}
 ]'::jsonb,
 '[
  {"id":"cb-1","date":"2026-01-22","level":"Corporate → Site leadership","note":"Group asked for 12% EBIT by 2029. Site pushed back on the 2026 slice: 8.4% accepted instead of 9.1% given the titanium price outlook."},
  {"id":"cb-2","date":"2026-02-05","level":"Site leadership → Value streams","note":"OTD target of 95% cascaded to machining and assembly. Streams flagged tooling availability as the binding constraint; capex request raised, target held."},
  {"id":"cb-3","date":"2026-02-19","level":"Value streams → Cells (planned)","note":"Cell-level scrap and setup targets not yet negotiated with team leaders — scheduled for week 15, facilitated by Marcus Chen."}
 ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
