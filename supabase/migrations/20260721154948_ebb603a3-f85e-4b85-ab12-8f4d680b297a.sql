
-- NPI (New Product Introduction) module — AS9145 5-gate framework

CREATE TABLE public.npi_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text NOT NULL,
  part_name text,
  customer text,
  program text,
  platform text,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sponsor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_gate smallint NOT NULL DEFAULT 1 CHECK (current_gate BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','on_track','at_risk','delayed','on_hold','complete')),
  health text CHECK (health IN ('green','yellow','red')),
  contract_award_date date,
  pdr_cdr_date date,
  prr_date date,
  fai_date date,
  eis_date date,
  target_eis_date date,
  bid_unit_hours numeric,
  bid_unit_cost numeric,
  material_class text,
  description text,
  notes text,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.npi_projects TO authenticated;
GRANT ALL ON public.npi_projects TO service_role;
ALTER TABLE public.npi_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npi_projects auth read" ON public.npi_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "npi_projects auth insert" ON public.npi_projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "npi_projects auth update" ON public.npi_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "npi_projects auth delete" ON public.npi_projects FOR DELETE TO authenticated USING (true);
CREATE TRIGGER npi_projects_updated BEFORE UPDATE ON public.npi_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.npi_gate_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.npi_projects(id) ON DELETE CASCADE,
  gate smallint NOT NULL CHECK (gate BETWEEN 1 AND 5),
  sort_order smallint NOT NULL DEFAULT 0,
  label text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  evidence_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.npi_gate_checklist TO authenticated;
GRANT ALL ON public.npi_gate_checklist TO service_role;
ALTER TABLE public.npi_gate_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npi_checklist auth read" ON public.npi_gate_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "npi_checklist auth insert" ON public.npi_gate_checklist FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "npi_checklist auth update" ON public.npi_gate_checklist FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "npi_checklist auth delete" ON public.npi_gate_checklist FOR DELETE TO authenticated USING (true);
CREATE INDEX npi_checklist_project_idx ON public.npi_gate_checklist(project_id, gate, sort_order);
CREATE TRIGGER npi_checklist_updated BEFORE UPDATE ON public.npi_gate_checklist FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.npi_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.npi_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text CHECK (category IN ('technical','schedule','supply_chain','quality','cost')),
  likelihood smallint CHECK (likelihood BETWEEN 1 AND 5),
  impact smallint CHECK (impact BETWEEN 1 AND 5),
  mitigation text,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','closed')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.npi_risks TO authenticated;
GRANT ALL ON public.npi_risks TO service_role;
ALTER TABLE public.npi_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npi_risks auth read" ON public.npi_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "npi_risks auth insert" ON public.npi_risks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "npi_risks auth update" ON public.npi_risks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "npi_risks auth delete" ON public.npi_risks FOR DELETE TO authenticated USING (true);
CREATE INDEX npi_risks_project_idx ON public.npi_risks(project_id);
CREATE TRIGGER npi_risks_updated BEFORE UPDATE ON public.npi_risks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed checklist on project insert
CREATE OR REPLACE FUNCTION public.tg_npi_seed_checklist()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  items text[][] := ARRAY[
    ARRAY['1','Customer SOW and specs fully flowed down into internal routing/drawings'],
    ARRAY['1','Initial Program Schedule baselined (integrated with customer master schedule)'],
    ARRAY['1','Feasibility sign-off completed by Engineering, Quality, and Operations'],
    ARRAY['1','Preliminary Bill of Materials (BOM) created and long-lead raw materials identified'],
    ARRAY['1','Initial Risk Register established (technical, schedule, supply chain)'],
    ARRAY['2','Design Freeze achieved and official drawing package released'],
    ARRAY['2','Design FMEA (DFMEA) completed with high-RPN mitigations'],
    ARRAY['2','Key Characteristics (KCs) and CTQs jointly agreed with customer'],
    ARRAY['2','Engineering prototype or "First Off" manufactured and dimensionally evaluated'],
    ARRAY['2','Make vs. Buy decisions and supplier sourcing approvals finalized'],
    ARRAY['3','Process Flow Diagram and shop floor layout finalized'],
    ARRAY['3','Process FMEA (PFMEA) completed; all KCs/CTQs linked to process controls'],
    ARRAY['3','Control Plan drafted (Pre-launch & Production: receiving, in-process, final inspection)'],
    ARRAY['3','Work Instructions (SOPs), CNC programs, and tooling/fixtures designed and verified'],
    ARRAY['3','Measurement System Analysis (MSA / Gage R&R) planned for all inspection gages'],
    ARRAY['4','Significant Production Run (Run-at-Rate) completed under production conditions'],
    ARRAY['4','MSA executed (Gage R&R < 10% on critical characteristics)'],
    ARRAY['4','First Article Inspection Report (FAIR per AS9102) completed and internally approved'],
    ARRAY['4','Customer PPAP / Aerospace Part Approval submission accepted by customer'],
    ARRAY['4','Packaging, labeling, and shipping verification completed'],
    ARRAY['5','SPC demonstrating process capability (Cpk >= 1.33) on CTQs'],
    ARRAY['5','Actual unit hours, cycle times, and scrap rates validated against target bid model'],
    ARRAY['5','Lessons Learned workshop conducted and incorporated into standard guidelines'],
    ARRAY['5','Formal program handoff sign-off from NPI Engineering to Operations/Quality'],
    ARRAY['5','Steady-state ownership transferred and NPI closure documented']
  ];
  i int;
  gate_num smallint;
  gate_prev smallint := 0;
  sort_within smallint := 0;
BEGIN
  FOR i IN 1 .. array_length(items, 1) LOOP
    gate_num := items[i][1]::smallint;
    IF gate_num <> gate_prev THEN
      sort_within := 0;
      gate_prev := gate_num;
    END IF;
    INSERT INTO public.npi_gate_checklist (project_id, gate, sort_order, label)
    VALUES (NEW.id, gate_num, sort_within, items[i][2]);
    sort_within := sort_within + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER npi_projects_seed_checklist
AFTER INSERT ON public.npi_projects
FOR EACH ROW EXECUTE FUNCTION public.tg_npi_seed_checklist();
