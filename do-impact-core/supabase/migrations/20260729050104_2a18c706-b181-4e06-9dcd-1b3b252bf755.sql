-- SIC shifts
CREATE TABLE public.sic_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  line_id uuid REFERENCES public.shop_floor_lines(id) ON DELETE SET NULL,
  line_name text,
  shift_date date NOT NULL DEFAULT current_date,
  shift_label text NOT NULL DEFAULT 'Day',
  start_time time NOT NULL DEFAULT '06:00',
  interval_minutes int NOT NULL DEFAULT 60,
  interval_count int NOT NULL DEFAULT 8,
  target_per_interval numeric NOT NULL DEFAULT 10,
  sqdcp jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sic_intervals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.sic_shifts(id) ON DELETE CASCADE,
  seq int NOT NULL,
  start_at time NOT NULL,
  end_at time NOT NULL,
  planned_target numeric NOT NULL DEFAULT 0,
  actual_output numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shift_id, seq)
);

CREATE TABLE public.sic_loss_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE TABLE public.sic_loss_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.sic_shifts(id) ON DELETE CASCADE,
  interval_id uuid REFERENCES public.sic_intervals(id) ON DELETE CASCADE,
  loss_code_id uuid REFERENCES public.sic_loss_codes(id) ON DELETE SET NULL,
  minutes numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sic_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.sic_shifts(id) ON DELETE CASCADE,
  interval_id uuid REFERENCES public.sic_intervals(id) ON DELETE SET NULL,
  problem text NOT NULL,
  containment text,
  owner_id uuid,
  owner_name text,
  escalation_level int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sic_shifts TO authenticated;
GRANT ALL ON public.sic_shifts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sic_intervals TO authenticated;
GRANT ALL ON public.sic_intervals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sic_loss_codes TO authenticated;
GRANT ALL ON public.sic_loss_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sic_loss_entries TO authenticated;
GRANT ALL ON public.sic_loss_entries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sic_actions TO authenticated;
GRANT ALL ON public.sic_actions TO service_role;

ALTER TABLE public.sic_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sic_intervals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sic_loss_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sic_loss_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sic_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sic_shifts_company_all ON public.sic_shifts FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY sic_shifts_company_scope ON public.sic_shifts AS RESTRICTIVE FOR ALL
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY sic_intervals_company_all ON public.sic_intervals FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY sic_intervals_company_scope ON public.sic_intervals AS RESTRICTIVE FOR ALL
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY sic_loss_codes_company_all ON public.sic_loss_codes FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY sic_loss_codes_company_scope ON public.sic_loss_codes AS RESTRICTIVE FOR ALL
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY sic_loss_entries_company_all ON public.sic_loss_entries FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY sic_loss_entries_company_scope ON public.sic_loss_entries AS RESTRICTIVE FOR ALL
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY sic_actions_company_all ON public.sic_actions FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()));
CREATE POLICY sic_actions_company_scope ON public.sic_actions AS RESTRICTIVE FOR ALL
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

-- seed default loss codes for every existing company (before write-protection triggers exist)
INSERT INTO public.sic_loss_codes (company_id, code, label, category, sort_order)
SELECT c.id, v.code, v.label, v.category, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('M1','Material shortage','material',0),
  ('M2','Kit incomplete','material',1),
  ('E1','Equipment breakdown','equipment',2),
  ('E2','Tool breakage / missing tool','equipment',3),
  ('Q1','First-pass defect','quality',4),
  ('Q2','Rework / concession','quality',5),
  ('O1','Changeover overrun','operations',6),
  ('O2','Manning / skills gap','operations',7),
  ('O3','Waiting on info / RFI','operations',8),
  ('S1','Safety stand-down','safety',9)
) AS v(code,label,category,sort_order)
ON CONFLICT (company_id, code) DO NOTHING;

-- standard triggers
CREATE TRIGGER set_company_id_sic_shifts BEFORE INSERT ON public.sic_shifts FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER set_company_id_sic_intervals BEFORE INSERT ON public.sic_intervals FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER set_company_id_sic_loss_codes BEFORE INSERT ON public.sic_loss_codes FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER set_company_id_sic_loss_entries BEFORE INSERT ON public.sic_loss_entries FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER set_company_id_sic_actions BEFORE INSERT ON public.sic_actions FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE TRIGGER sic_shifts_updated BEFORE UPDATE ON public.sic_shifts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER sic_intervals_updated BEFORE UPDATE ON public.sic_intervals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER sic_loss_codes_updated BEFORE UPDATE ON public.sic_loss_codes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER sic_loss_entries_updated BEFORE UPDATE ON public.sic_loss_entries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER sic_actions_updated BEFORE UPDATE ON public.sic_actions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.sic_shifts FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.sic_intervals FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.sic_loss_codes FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.sic_loss_entries FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();
CREATE TRIGGER trg_enforce_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.sic_actions FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();

CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.sic_shifts FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.sic_intervals FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.sic_loss_codes FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.sic_loss_entries FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER trg_prevent_template_write BEFORE INSERT OR UPDATE OR DELETE ON public.sic_actions FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

-- seed default loss codes on new company creation
CREATE OR REPLACE FUNCTION public.tg_company_seed_sic_loss_codes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.sic_loss_codes (company_id, code, label, category, sort_order)
  VALUES
    (NEW.id, 'M1', 'Material shortage', 'material', 0),
    (NEW.id, 'M2', 'Kit incomplete', 'material', 1),
    (NEW.id, 'E1', 'Equipment breakdown', 'equipment', 2),
    (NEW.id, 'E2', 'Tool breakage / missing tool', 'equipment', 3),
    (NEW.id, 'Q1', 'First-pass defect', 'quality', 4),
    (NEW.id, 'Q2', 'Rework / concession', 'quality', 5),
    (NEW.id, 'O1', 'Changeover overrun', 'operations', 6),
    (NEW.id, 'O2', 'Manning / skills gap', 'operations', 7),
    (NEW.id, 'O3', 'Waiting on info / RFI', 'operations', 8),
    (NEW.id, 'S1', 'Safety stand-down', 'safety', 9)
  ON CONFLICT (company_id, code) DO NOTHING;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.tg_company_seed_sic_loss_codes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tg_company_seed_sic_loss_codes() FROM anon;
REVOKE ALL ON FUNCTION public.tg_company_seed_sic_loss_codes() FROM authenticated;

CREATE TRIGGER trg_company_seed_sic_loss_codes AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.tg_company_seed_sic_loss_codes();