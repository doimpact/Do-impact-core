CREATE TABLE public.pfmea_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  npi_project_id uuid REFERENCES public.npi_projects(id) ON DELETE SET NULL,
  title text,
  part_number text NOT NULL,
  part_name text,
  customer text,
  program text,
  process_family text NOT NULL DEFAULT 'machining',
  revision text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','approved','archived')),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','import','drawing','ai')),
  drawing_path text,
  notes text,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pfmea_studies TO authenticated;
GRANT ALL ON public.pfmea_studies TO service_role;
ALTER TABLE public.pfmea_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pfmea_studies_company_scope" ON public.pfmea_studies FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER pfmea_studies_set_company BEFORE INSERT ON public.pfmea_studies FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER pfmea_studies_updated_at BEFORE UPDATE ON public.pfmea_studies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pfmea_studies_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.pfmea_studies FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE INDEX pfmea_studies_company_idx ON public.pfmea_studies(company_id);

CREATE TABLE public.pfmea_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.pfmea_studies(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  step_no text,
  step_name text NOT NULL,
  function_req text,
  failure_mode text,
  effect text,
  severity smallint CHECK (severity BETWEEN 1 AND 10),
  classification text,
  cause text,
  occurrence smallint CHECK (occurrence BETWEEN 1 AND 10),
  prevention_control text,
  detection_control text,
  detection smallint CHECK (detection BETWEEN 1 AND 10),
  action text,
  action_owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  action_status text NOT NULL DEFAULT 'open' CHECK (action_status IN ('open','in_progress','done','not_required')),
  post_severity smallint CHECK (post_severity BETWEEN 1 AND 10),
  post_occurrence smallint CHECK (post_occurrence BETWEEN 1 AND 10),
  post_detection smallint CHECK (post_detection BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pfmea_rows TO authenticated;
GRANT ALL ON public.pfmea_rows TO service_role;
ALTER TABLE public.pfmea_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pfmea_rows_company_scope" ON public.pfmea_rows FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER pfmea_rows_set_company BEFORE INSERT ON public.pfmea_rows FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER pfmea_rows_updated_at BEFORE UPDATE ON public.pfmea_rows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pfmea_rows_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.pfmea_rows FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE INDEX pfmea_rows_study_idx ON public.pfmea_rows(study_id, sort_order);

CREATE POLICY "Authenticated can read pfmea drawings" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pfmea-drawings');
CREATE POLICY "Authenticated can upload pfmea drawings" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pfmea-drawings');
CREATE POLICY "Authenticated can update pfmea drawings" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'pfmea-drawings') WITH CHECK (bucket_id = 'pfmea-drawings');
CREATE POLICY "Authenticated can delete pfmea drawings" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pfmea-drawings');

DO $$
DECLARE
  v_company uuid;
  v_project uuid;
  v_study uuid;
BEGIN
  SELECT id INTO v_company FROM public.companies WHERE is_template = true ORDER BY created_at LIMIT 1;
  IF v_company IS NULL THEN RETURN; END IF;
  SELECT id INTO v_project FROM public.npi_projects WHERE company_id = v_company ORDER BY created_at LIMIT 1;

  INSERT INTO public.pfmea_studies (company_id, npi_project_id, title, part_number, part_name, customer, program, process_family, revision, status, source, notes)
  VALUES (v_company, v_project, 'PFMEA — Titanium bracket machining', 'TS-4471-01', 'Ti-6Al-4V structural bracket', 'Airframe OEM', 'Narrowbody', 'machining', 'A', 'active', 'manual',
    'Baseline PFMEA created at PRR. Reviewed with quality, manufacturing engineering and the cell lead.')
  RETURNING id INTO v_study;

  INSERT INTO public.pfmea_rows (company_id, study_id, sort_order, step_no, step_name, function_req, failure_mode, effect, severity, classification, cause, occurrence, prevention_control, detection_control, detection, action, action_status)
  VALUES
    (v_company, v_study, 1, '10', 'Receive and verify raw bar', 'Correct Ti-6Al-4V bar, certified to AMS 4928', 'Wrong alloy or uncertified material used', 'Non-conforming part reaches customer; scrap of finished assembly', 9, 'CC', 'Mixed storage location; cert not checked at issue', 3, 'Segregated bonded store; cert check at goods-in', 'Material cert cross-check at kit issue', 4, 'Add PMI spot check on every new heat lot', 'open'),
    (v_company, v_study, 2, '20', 'CNC rough mill datum face', 'Face flat within 0.10 mm, stock left 1.0 mm', 'Excess stock removed — undersize', 'Part scrapped, schedule slip', 7, NULL, 'Wrong offset applied after tool change', 4, 'Tool offset stored in program; tool life counter', 'First-off inspection on CMM', 3, NULL, 'not_required'),
    (v_company, v_study, 3, '30', 'CNC finish mill pocket profile', 'Profile within 0.05 mm; surface finish Ra 1.6', 'Profile out of tolerance', 'Rework or scrap; FAI failure', 8, 'SC', 'Tool wear not detected between parts', 5, 'Tool life management, cutter change every 12 parts', 'In-process probing every 5th part', 4, 'Move to 100% in-process probing until Cpk > 1.33', 'in_progress'),
    (v_company, v_study, 4, '40', 'Drill and ream fastener holes', 'Hole dia 6.35 +0.03/-0.00, perpendicularity 0.05', 'Oversize or bell-mouthed hole', 'Fastener joint strength reduced; customer concession', 8, 'CC', 'Reamer wear; incorrect speed/feed', 4, 'Standard work with locked speed/feed; reamer life card', 'Plug gauge check every part', 3, 'Add reamer force monitoring to the machine', 'open'),
    (v_company, v_study, 5, '50', 'Deburr and edge break', 'All edges broken 0.2-0.4 mm, no burrs', 'Burr left in pocket radius', 'FOD risk in assembly; customer escape', 7, NULL, 'Manual deburr, hard-to-see internal radius', 5, 'Deburr standard work with photo aid', 'Visual inspection under magnification', 5, 'Introduce borescope check on internal radii', 'open'),
    (v_company, v_study, 6, '60', 'Chemical conversion coating', 'Coating per MIL-DTL-5541 Type II', 'Incomplete coating coverage', 'Corrosion in service; warranty claim', 8, 'SC', 'Contaminated surface before dip; bath out of range', 3, 'Bath titration twice per shift; degrease step', 'Coating adhesion and water-break test per batch', 4, NULL, 'not_required'),
    (v_company, v_study, 7, '70', 'Final inspection and FAI', 'All AS9102 characteristics verified and recorded', 'Characteristic missed on the FAI report', 'Delivery hold; customer audit finding', 6, NULL, 'Manual ballooning of the drawing', 4, 'Ballooned drawing controlled by quality', 'Independent second-check of the FAI pack', 3, 'Move ballooning to the CAM system', 'open'),
    (v_company, v_study, 8, '80', 'Pack and despatch', 'Part protected, correct labels and paperwork', 'Damage in transit', 'Late delivery, rework of surface finish', 5, NULL, 'Insufficient foam protection for thin web', 3, 'Packing standard with foam insert', 'Pack audit on 1 in 10 shipments', 5, NULL, 'not_required');
END $$;