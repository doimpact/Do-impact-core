CREATE TABLE public.equipment_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  asset_name text NOT NULL,
  asset_tag text,
  vendor text,
  line_area text,
  po_number text,
  contract_value numeric,
  currency text NOT NULL DEFAULT 'USD',
  stage smallint NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'planning',
  health text,
  po_date date,
  fat_date date,
  delivery_date date,
  sat_date date,
  pq_date date,
  handover_date date,
  target_handover_date date,
  cpk_target numeric NOT NULL DEFAULT 1.67,
  oee_target numeric NOT NULL DEFAULT 85,
  sustain_shifts integer NOT NULL DEFAULT 30,
  owner_id uuid,
  maintenance_owner_id uuid,
  sponsor_id uuid,
  description text,
  notes text,
  archived_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_projects TO authenticated;
GRANT ALL ON public.equipment_projects TO service_role;
ALTER TABLE public.equipment_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_projects company read" ON public.equipment_projects FOR SELECT TO authenticated USING (company_id = current_company_id());
CREATE POLICY "equipment_projects company write" ON public.equipment_projects FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "equipment_projects_company_scope" ON public.equipment_projects AS RESTRICTIVE FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TABLE public.equipment_gate_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.equipment_projects(id) ON DELETE CASCADE,
  stage smallint NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid,
  evidence_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_gate_checklist TO authenticated;
GRANT ALL ON public.equipment_gate_checklist TO service_role;
ALTER TABLE public.equipment_gate_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_gate_checklist company read" ON public.equipment_gate_checklist FOR SELECT TO authenticated USING (company_id = current_company_id());
CREATE POLICY "equipment_gate_checklist company write" ON public.equipment_gate_checklist FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "equipment_gate_checklist_company_scope" ON public.equipment_gate_checklist AS RESTRICTIVE FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TABLE public.equipment_punch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.equipment_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  owner_id uuid,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_punch_items TO authenticated;
GRANT ALL ON public.equipment_punch_items TO service_role;
ALTER TABLE public.equipment_punch_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_punch_items company read" ON public.equipment_punch_items FOR SELECT TO authenticated USING (company_id = current_company_id());
CREATE POLICY "equipment_punch_items company write" ON public.equipment_punch_items FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "equipment_punch_items_company_scope" ON public.equipment_punch_items AS RESTRICTIVE FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TABLE public.equipment_payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.equipment_projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  gate smallint,
  percent numeric NOT NULL DEFAULT 0,
  amount numeric,
  released_at date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_payment_milestones TO authenticated;
GRANT ALL ON public.equipment_payment_milestones TO service_role;
ALTER TABLE public.equipment_payment_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_payment_milestones company read" ON public.equipment_payment_milestones FOR SELECT TO authenticated USING (company_id = current_company_id());
CREATE POLICY "equipment_payment_milestones company write" ON public.equipment_payment_milestones FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "equipment_payment_milestones_company_scope" ON public.equipment_payment_milestones AS RESTRICTIVE FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TABLE public.equipment_ramp_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.equipment_projects(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT current_date,
  planned_pct numeric,
  actual_pct numeric,
  availability numeric,
  performance numeric,
  quality numeric,
  mtbf_hours numeric,
  mttr_hours numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_ramp_log TO authenticated;
GRANT ALL ON public.equipment_ramp_log TO service_role;
ALTER TABLE public.equipment_ramp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_ramp_log company read" ON public.equipment_ramp_log FOR SELECT TO authenticated USING (company_id = current_company_id());
CREATE POLICY "equipment_ramp_log company write" ON public.equipment_ramp_log FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "equipment_ramp_log_company_scope" ON public.equipment_ramp_log AS RESTRICTIVE FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE INDEX idx_equipment_checklist_project ON public.equipment_gate_checklist(project_id);
CREATE INDEX idx_equipment_punch_project ON public.equipment_punch_items(project_id);
CREATE INDEX idx_equipment_pay_project ON public.equipment_payment_milestones(project_id);
CREATE INDEX idx_equipment_ramp_project ON public.equipment_ramp_log(project_id);

CREATE OR REPLACE FUNCTION public.tg_equipment_seed_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  items text[][] := ARRAY[
    ARRAY['1','Freeze 3D models, mechanical/electrical schematics and utility drops with OEM'],
    ARRAY['1','Safety and ergonomics review signed off'],
    ARRAY['1','Virtual commissioning: PLC code, robotics kinematics and control logic simulated'],
    ARRAY['1','Spare parts list with component criticality ratings agreed'],
    ARRAY['1','Preventive maintenance routines drafted'],
    ARRAY['1','Shop-floor maintenance technicians named and engaged'],
    ARRAY['2','URS/FDS verification matrix complete'],
    ARRAY['2','Runoff at rated cycle time on test or surrogate material'],
    ARRAY['2','Tolerances, safety interlocks, sensor feedback and fault recovery verified'],
    ARRAY['2','FAT punch list closed'],
    ARRAY['2','FAT sign-off releases shipment and FAT progress payment'],
    ARRAY['3','Foundation, electrical drops, pneumatic/chilled water, exhaust and enclosures complete'],
    ARRAY['3','Rigging, precision placement, levelling and optical alignment complete'],
    ARRAY['3','Installation Qualification (IQ) documented vs mechanical/electrical/environmental spec'],
    ARRAY['3','Local EHS standards verified'],
    ARRAY['4','Operational Qualification (OQ): subsystems, motion axes, light curtains, E-stops, sensors tested'],
    ARRAY['4','SAT run on production-grade material at standard operational speed'],
    ARRAY['4','SAT sign-off: conditional acceptance and installation milestone payment'],
    ARRAY['5','Performance Qualification (PQ) capability study meets Cpk target'],
    ARRAY['5','FAI (AS9102) or PPAP sign-off complete'],
    ARRAY['5','Digital work instructions published'],
    ARRAY['5','Operator and maintenance training certifications complete'],
    ARRAY['5','Asset registered in CMMS with PM plan active'],
    ARRAY['6','S-curve ramp plan agreed (20% / 50% / 80% / 100%)'],
    ARRAY['6','Daily OEE tracked by Availability, Performance and Quality'],
    ARRAY['6','MTBF and MTTR tracked and reviewed'],
    ARRAY['6','PLC/CNC data streaming to MES/SCADA via OPC UA or MTConnect'],
    ARRAY['7','Punch list at zero'],
    ARRAY['7','Target OEE sustained over the defined number of consecutive shifts'],
    ARRAY['7','Maintenance self-sufficient (training, spares, documentation)'],
    ARRAY['7','Formal asset transfer from Capital Engineering to Operations'],
    ARRAY['7','6-month post-investment review vs CAPEX business case scheduled']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(items, 1) LOOP
    INSERT INTO public.equipment_gate_checklist (company_id, project_id, stage, sort_order, label)
    VALUES (NEW.company_id, NEW.id, items[i][1]::smallint, i, items[i][2]);
  END LOOP;

  INSERT INTO public.equipment_payment_milestones (company_id, project_id, label, gate, percent, amount, sort_order)
  VALUES
    (NEW.company_id, NEW.id, 'PO placement', 1, 30, CASE WHEN NEW.contract_value IS NULL THEN NULL ELSE NEW.contract_value * 0.30 END, 1),
    (NEW.company_id, NEW.id, 'FAT sign-off', 2, 30, CASE WHEN NEW.contract_value IS NULL THEN NULL ELSE NEW.contract_value * 0.30 END, 2),
    (NEW.company_id, NEW.id, 'SAT sign-off', 4, 30, CASE WHEN NEW.contract_value IS NULL THEN NULL ELSE NEW.contract_value * 0.30 END, 3),
    (NEW.company_id, NEW.id, 'Final acceptance (post-PQ)', 5, 10, CASE WHEN NEW.contract_value IS NULL THEN NULL ELSE NEW.contract_value * 0.10 END, 4);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tg_equipment_seed_checklist() FROM PUBLIC, anon;

CREATE TRIGGER equipment_projects_seed AFTER INSERT ON public.equipment_projects FOR EACH ROW EXECUTE FUNCTION public.tg_equipment_seed_checklist();

CREATE TRIGGER set_company_id_equipment_projects BEFORE INSERT ON public.equipment_projects FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();
CREATE TRIGGER set_company_id_equipment_gate_checklist BEFORE INSERT ON public.equipment_gate_checklist FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();
CREATE TRIGGER set_company_id_equipment_punch_items BEFORE INSERT ON public.equipment_punch_items FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();
CREATE TRIGGER set_company_id_equipment_payment_milestones BEFORE INSERT ON public.equipment_payment_milestones FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();
CREATE TRIGGER set_company_id_equipment_ramp_log BEFORE INSERT ON public.equipment_ramp_log FOR EACH ROW EXECUTE FUNCTION tg_set_company_id();

CREATE TRIGGER equipment_projects_updated BEFORE UPDATE ON public.equipment_projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER equipment_gate_checklist_updated BEFORE UPDATE ON public.equipment_gate_checklist FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER equipment_punch_items_updated BEFORE UPDATE ON public.equipment_punch_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER equipment_payment_milestones_updated BEFORE UPDATE ON public.equipment_payment_milestones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER equipment_ramp_log_updated BEFORE UPDATE ON public.equipment_ramp_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_projects FOR EACH ROW EXECUTE FUNCTION enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_gate_checklist FOR EACH ROW EXECUTE FUNCTION enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_punch_items FOR EACH ROW EXECUTE FUNCTION enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_payment_milestones FOR EACH ROW EXECUTE FUNCTION enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_ramp_log FOR EACH ROW EXECUTE FUNCTION enforce_write_access();

CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_projects FOR EACH ROW EXECUTE FUNCTION prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_gate_checklist FOR EACH ROW EXECUTE FUNCTION prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_punch_items FOR EACH ROW EXECUTE FUNCTION prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_payment_milestones FOR EACH ROW EXECUTE FUNCTION prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.equipment_ramp_log FOR EACH ROW EXECUTE FUNCTION prevent_template_write();