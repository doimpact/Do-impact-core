
-- Restructuring items table
CREATE TABLE public.restructuring_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('governance','objectives','roadmap','risks','scope_control')),
  kind text NOT NULL CHECK (kind IN ('governance_entity','value_driver','kpi','phase','milestone','risk','change_request','note','objective')),
  parent_id uuid REFERENCES public.restructuring_items(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','at_risk','blocked','done')),
  health text CHECK (health IN ('green','yellow','red')),
  progress int NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date date,
  due_date date,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restructuring_items TO authenticated;
GRANT ALL ON public.restructuring_items TO service_role;

ALTER TABLE public.restructuring_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated manage restructuring_items"
  ON public.restructuring_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_restructuring_items_updated
  BEFORE UPDATE ON public.restructuring_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_restructuring_section ON public.restructuring_items(section);
CREATE INDEX idx_restructuring_parent ON public.restructuring_items(parent_id);

-- Seed template
DO $$
DECLARE
  obj_root uuid; d_labor uuid; d_ovhd uuid; d_foot uuid; d_scrap uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid;
BEGIN
  -- 1. Governance
  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, meta) VALUES
    ('governance','governance_entity','Steering Committee (SteerCo)',
     'Final sign-off on capital expenditures & scope changes. Strategic alignment & resource allocation. Unblocking inter-departmental roadblocks.',
     1,'green',
     '{"composition":"Executive Sponsor, COO, CFO, VP HR, Transformation Director","cadence":"Bi-weekly / Monthly"}'::jsonb),
    ('governance','governance_entity','Program Management Office (PMO)',
     'Single source of truth for metrics & progress. Enforces change log & baseline control. Audits value realization directly to the P&L.',
     2,'green',
     '{"composition":"PMO Lead, Industrial Engineering Lead, Finance Analyst, Change Lead","cadence":"Daily standups / Weekly tracking"}'::jsonb),
    ('governance','governance_entity','Workstream Execution Teams',
     'Site-level execution of workpackages. Line-level risk identification & mitigation. Daily shop-floor huddles.',
     3,'green',
     '{"composition":"Plant Managers, Value Stream Mapping Leads, Quality, Supply Chain","cadence":"Continuous / Daily"}'::jsonb);

  -- 2. Objectives & Value Drivers
  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health)
    VALUES ('objectives','objective','Reduce Conversion Cost by 20% & Free Up 25% Floor Space',
            'Top strategic objective for the restructuring program.',0,'green')
    RETURNING id INTO obj_root;

  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health, meta)
    VALUES ('objectives','value_driver',obj_root,'Direct Labor Optimization','Lever: Standardized Work & Automation',1,'green','{"lever":"Standardized Work & Automation"}'::jsonb)
    RETURNING id INTO d_labor;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health, meta)
    VALUES ('objectives','value_driver',obj_root,'Indirect Overhead Rationalization','Lever: Span-of-Control & Shared Services',2,'green','{"lever":"Span-of-Control & Shared Services"}'::jsonb)
    RETURNING id INTO d_ovhd;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health, meta)
    VALUES ('objectives','value_driver',obj_root,'Footprint Consolidation','Lever: Line Relocation & Cell Redesign',3,'green','{"lever":"Line Relocation & Cell Redesign"}'::jsonb)
    RETURNING id INTO d_foot;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health, meta)
    VALUES ('objectives','value_driver',obj_root,'Material & Scrap Reduction','Lever: Yield Improvement & First-Pass Yield',4,'green','{"lever":"Yield Improvement & First-Pass Yield"}'::jsonb)
    RETURNING id INTO d_scrap;

  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health, meta) VALUES
    ('objectives','kpi',d_labor,'Labor hours per unit','Reduction in labor hours per unit',1,'green','{"target":"-20%"}'::jsonb),
    ('objectives','kpi',d_ovhd,'Span-of-control ratio','Target 1:12 supervisor-to-operator',1,'green','{"target":"1:12"}'::jsonb),
    ('objectives','kpi',d_foot,'Floor space released','Floor space released (sq ft), line balancing efficiency, OEE improvement',1,'green','{"target":"25% released"}'::jsonb),
    ('objectives','kpi',d_foot,'Working Capital / WIP','Reduction in Work-in-Progress inventory, lead-time compression',2,'green','{"target":"-30% WIP"}'::jsonb),
    ('objectives','kpi',d_scrap,'First-Pass Yield (FPY)','FPY targets, reduction in rework hours',1,'green','{"target":"+5pp FPY"}'::jsonb);

  -- 3. Roadmap
  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, start_date, due_date)
    VALUES ('roadmap','phase','Phase 1: Diagnostic & Baseline Setting','Weeks 1–4',1,'green', CURRENT_DATE, CURRENT_DATE + 28)
    RETURNING id INTO p1;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health) VALUES
    ('roadmap','milestone',p1,'M1.1 Baseline frozen','Baseline cost, headcount, and capacity frozen across all targeted facilities.',1,'green'),
    ('roadmap','milestone',p1,'M1.2 Value-stream mapping complete','Value-stream mapping complete for core manufacturing lines.',2,'green'),
    ('roadmap','milestone',p1,'Gate 1 Approval','SteerCo signs off on target operating model (TOM) and preliminary business case.',3,'green');

  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, start_date, due_date)
    VALUES ('roadmap','phase','Phase 2: Detailed Engineering & Transfer Planning','Weeks 5–12',2,'green', CURRENT_DATE + 28, CURRENT_DATE + 84)
    RETURNING id INTO p2;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health) VALUES
    ('roadmap','milestone',p2,'M2.1 Buffer inventory strategy','Buffer inventory strategy finalized to cover line shutdown windows.',1,'green'),
    ('roadmap','milestone',p2,'M2.2 Layout & CapEx finalized','Equipment relocation, footprint layout, and CapEx requests finalized.',2,'green'),
    ('roadmap','milestone',p2,'Gate 2 Approval','SteerCo approves execution budget, capital release, and risk mitigation plan.',3,'green');

  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, start_date, due_date)
    VALUES ('roadmap','phase','Phase 3: Execution & Line Relocation','Weeks 13–36',3,'green', CURRENT_DATE + 84, CURRENT_DATE + 252)
    RETURNING id INTO p3;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health) VALUES
    ('roadmap','milestone',p3,'M3.1 Buffer stock complete','Pre-building safety stock / buffer inventory complete.',1,'green'),
    ('roadmap','milestone',p3,'M3.2 Asset transfer complete','Physical asset transfer and installation completed at target facilities.',2,'green'),
    ('roadmap','milestone',p3,'M3.3 Qualification runs passed','Qualification runs and customer audits passed.',3,'green'),
    ('roadmap','milestone',p3,'Gate 3 Approval','Production line handoff from PMO to local operations.',4,'green');

  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, start_date, due_date)
    VALUES ('roadmap','phase','Phase 4: Stabilization & Ramp-Up','Weeks 37–52',4,'green', CURRENT_DATE + 252, CURRENT_DATE + 364)
    RETURNING id INTO p4;
  INSERT INTO public.restructuring_items (section, kind, parent_id, title, description, sort_order, health) VALUES
    ('roadmap','milestone',p4,'M4.1 OEE & yield benchmarks','Target OEE and yield benchmarks achieved on relocated/restructured lines.',1,'green'),
    ('roadmap','milestone',p4,'M4.2 Legacy decommissioning','Legacy facility decommissioning and lease exit / footprint sell-off complete.',2,'green'),
    ('roadmap','milestone',p4,'Gate 4 Approval','Final financial audit confirming run-rate P&L savings realization.',3,'green');

  -- 4. Risks
  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, meta) VALUES
    ('risks','risk','Supply Chain / Customer Delivery','Line transition causes customer stockouts or delivery delays.',1,'yellow',
     '{"category":"Supply Chain / Customer Delivery","likelihood":3,"impact":4,"mitigation":"Build a dedicated buffer inventory (weeks of demand + transition duration)."}'::jsonb),
    ('risks','risk','Quality & Regulatory','Relocated line fails customer re-qualification or ISO/AS9100 audit.',2,'yellow',
     '{"category":"Quality & Regulatory","likelihood":2,"impact":5,"mitigation":"Dual-run lines during transition; secure customer approval early with formal APQP/PPAP plan."}'::jsonb),
    ('risks','risk','Labor & Talent Loss','Key operational/engineering talent resigns before transition completes.',3,'yellow',
     '{"category":"Labor & Talent Loss","likelihood":3,"impact":3,"mitigation":"Targeted retention bonuses and structured knowledge transfer schedules."}'::jsonb),
    ('risks','risk','Capital & Cost Overruns','Rigging, freight, or utility installation costs exceed budget.',4,'yellow',
     '{"category":"Capital & Cost Overruns","likelihood":3,"impact":4,"mitigation":"Mandatory contingency buffers (15–20%) tied directly to line transfer workpackages."}'::jsonb);

  -- 5. Scope control
  INSERT INTO public.restructuring_items (section, kind, title, description, sort_order, health, meta) VALUES
    ('scope_control','note','Change Governance Process',
     'Initiation: any scope/timeline/budget variance exceeding tolerances (>$25k or >1 week milestone slip) requires a formal Change Request. Assessment by PMO. Tier 1 (<$50k, <2 weeks): PMO Lead approval. Tier 2 (>$50k or >2 weeks): mandatory SteerCo approval.',
     0,'green','{}'::jsonb),
    ('scope_control','change_request','CR-01 Add 2-axis robot','Add 2-axis robot',1,'green',
     '{"date_raised":"2026-08-10","cost_impact":"+$45,000","schedule_impact":"+1 Week","value_impact":"-0.5 FTE","cr_status":"Approved","approver":"PMO / 08-12"}'::jsonb),
    ('scope_control','change_request','CR-02 Extend lease 30d','Extend lease 30 days',2,'yellow',
     '{"date_raised":"2026-09-02","cost_impact":"+$120,000","schedule_impact":"+4 Weeks","value_impact":"Buffer protect","cr_status":"Pending","approver":"SteerCo"}'::jsonb);
END $$;
