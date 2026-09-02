CREATE TABLE public.ampm_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_code text,
  name text NOT NULL,
  department text,
  location text,
  manufacturer text,
  model text,
  serial_number text,
  process text,
  criticality text NOT NULL DEFAULT 'B',
  installation_date date,
  primary_operator text,
  maintenance_owner text,
  failure_modes text,
  am_level integer NOT NULL DEFAULT 1,
  am_program text,
  pm_program text,
  critical_spares text,
  service_provider text,
  backup_equipment text,
  last_pm date,
  next_pm date,
  condition_rating text NOT NULL DEFAULT 'green',
  availability_pct numeric,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_equipment_crit_chk CHECK (criticality IN ('A','B','C','D')),
  CONSTRAINT ampm_equipment_cond_chk CHECK (condition_rating IN ('green','yellow','red')),
  CONSTRAINT ampm_equipment_amlevel_chk CHECK (am_level BETWEEN 1 AND 5)
);

CREATE TABLE public.ampm_am_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  check_date date NOT NULL DEFAULT current_date,
  shift text,
  operator_name text,
  items jsonb NOT NULL DEFAULT '{}'::jsonb,
  items_passed integer,
  items_total integer,
  abnormality_found boolean NOT NULL DEFAULT false,
  abnormality text,
  action_taken text,
  notification_ref text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ampm_abnormalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  found_on date NOT NULL DEFAULT current_date,
  tag_colour text NOT NULL DEFAULT 'yellow',
  description text NOT NULL,
  found_by text,
  can_run_safely boolean NOT NULL DEFAULT true,
  maintenance_assessment text,
  corrective_action text,
  owner_name text,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  verified_by text,
  closed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_abn_tag_chk CHECK (tag_colour IN ('red','yellow','green')),
  CONSTRAINT ampm_abn_status_chk CHECK (status IN ('open','in_progress','repaired','verified','closed'))
);

CREATE TABLE public.ampm_pm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  task text NOT NULL,
  pm_type text NOT NULL DEFAULT 'inspection',
  frequency text NOT NULL DEFAULT 'monthly',
  last_completed date,
  next_due date,
  owner_name text,
  estimated_hours numeric,
  required_parts text,
  downtime_required boolean NOT NULL DEFAULT false,
  safety_requirements text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_pm_freq_chk CHECK (frequency IN ('shift','daily','weekly','monthly','quarterly','semiannual','annual')),
  CONSTRAINT ampm_pm_type_chk CHECK (pm_type IN ('inspection','cleaning','lubrication','adjustment','replacement','calibration','testing','predictive')),
  CONSTRAINT ampm_pm_status_chk CHECK (status IN ('active','paused','retired'))
);

CREATE TABLE public.ampm_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  pm_task_id uuid REFERENCES public.ampm_pm_tasks(id) ON DELETE SET NULL,
  wo_ref text,
  work_kind text NOT NULL DEFAULT 'planned',
  scheduled_date date,
  actual_date date,
  technician text,
  labour_hours numeric,
  parts_replaced text,
  findings text,
  additional_repairs text,
  result text NOT NULL DEFAULT 'pass',
  next_pm_due date,
  supervisor_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_wo_kind_chk CHECK (work_kind IN ('planned','emergency','improvement')),
  CONSTRAINT ampm_wo_result_chk CHECK (result IN ('pass','conditional','fail')),
  CONSTRAINT ampm_wo_status_chk CHECK (status IN ('open','in_progress','complete','overdue'))
);

CREATE TABLE public.ampm_breakdowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reported_by text,
  failure_mode text,
  immediate_cause text,
  classification text NOT NULL DEFAULT 'functional',
  downtime_hours numeric,
  response_hours numeric,
  repair_hours numeric,
  parts_used text,
  temporary_fix boolean NOT NULL DEFAULT false,
  permanent_fix boolean NOT NULL DEFAULT false,
  repeat_failure boolean NOT NULL DEFAULT false,
  root_cause_required boolean NOT NULL DEFAULT false,
  root_cause text,
  corrective_action text,
  owner_name text,
  due_date date,
  verification text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_bd_class_chk CHECK (classification IN ('safety','quality','functional','minor','repeat','chronic')),
  CONSTRAINT ampm_bd_status_chk CHECK (status IN ('open','repaired','closed'))
);

CREATE TABLE public.ampm_spares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE SET NULL,
  part_name text NOT NULL,
  part_number text,
  description text,
  criticality text NOT NULL DEFAULT 'high',
  min_quantity numeric,
  current_quantity numeric,
  supplier text,
  lead_time_days numeric,
  storage_location text,
  alternate_part text,
  last_used date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_spares_crit_chk CHECK (criticality IN ('critical','high','medium','low'))
);

CREATE TABLE public.ampm_lubrication (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  point_location text NOT NULL,
  lubricant text,
  grade text,
  quantity text,
  frequency text NOT NULL DEFAULT 'monthly',
  application_method text,
  responsible text,
  last_done date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_lub_freq_chk CHECK (frequency IN ('shift','daily','weekly','monthly','quarterly','semiannual','annual'))
);

CREATE TABLE public.ampm_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  source_kind text NOT NULL DEFAULT 'breakdown',
  equipment_id uuid REFERENCES public.ampm_equipment(id) ON DELETE CASCADE,
  breakdown_id uuid REFERENCES public.ampm_breakdowns(id) ON DELETE CASCADE,
  abnormality_id uuid REFERENCES public.ampm_abnormalities(id) ON DELETE CASCADE,
  action text NOT NULL,
  owner_name text,
  due_date date,
  priority integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ampm_actions_src_chk CHECK (source_kind IN ('breakdown','abnormality','equipment','audit')),
  CONSTRAINT ampm_actions_status_chk CHECK (status IN ('open','in_progress','done')),
  CONSTRAINT ampm_actions_prio_chk CHECK (priority BETWEEN 1 AND 4)
);

CREATE INDEX idx_ampm_equipment_company ON public.ampm_equipment(company_id);
CREATE INDEX idx_ampm_am_checks_company ON public.ampm_am_checks(company_id, check_date DESC);
CREATE INDEX idx_ampm_abn_company ON public.ampm_abnormalities(company_id, status);
CREATE INDEX idx_ampm_pm_tasks_company ON public.ampm_pm_tasks(company_id, next_due);
CREATE INDEX idx_ampm_wo_company ON public.ampm_work_orders(company_id, scheduled_date DESC);
CREATE INDEX idx_ampm_bd_company ON public.ampm_breakdowns(company_id, occurred_at DESC);
CREATE INDEX idx_ampm_spares_company ON public.ampm_spares(company_id);
CREATE INDEX idx_ampm_lub_company ON public.ampm_lubrication(company_id);
CREATE INDEX idx_ampm_actions_company ON public.ampm_actions(company_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_equipment TO authenticated;
GRANT ALL ON public.ampm_equipment TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_am_checks TO authenticated;
GRANT ALL ON public.ampm_am_checks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_abnormalities TO authenticated;
GRANT ALL ON public.ampm_abnormalities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_pm_tasks TO authenticated;
GRANT ALL ON public.ampm_pm_tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_work_orders TO authenticated;
GRANT ALL ON public.ampm_work_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_breakdowns TO authenticated;
GRANT ALL ON public.ampm_breakdowns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_spares TO authenticated;
GRANT ALL ON public.ampm_spares TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_lubrication TO authenticated;
GRANT ALL ON public.ampm_lubrication TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ampm_actions TO authenticated;
GRANT ALL ON public.ampm_actions TO service_role;

ALTER TABLE public.ampm_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_am_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_abnormalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_pm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_spares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_lubrication ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ampm_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ampm_equipment','ampm_am_checks','ampm_abnormalities','ampm_pm_tasks','ampm_work_orders','ampm_breakdowns','ampm_spares','ampm_lubrication','ampm_actions'] LOOP
    EXECUTE format('CREATE POLICY "Company members can view %1$s" ON public.%1$I FOR SELECT TO authenticated USING (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Company members can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Company members can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (is_company_member(company_id, auth.uid())) WITH CHECK (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Company members can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (is_company_member(company_id, auth.uid()))', t);
    EXECUTE format('CREATE POLICY "%1$s_company_scope" ON public.%1$I AS RESTRICTIVE TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())', t);
    EXECUTE format('CREATE TRIGGER %1$s_set_company BEFORE INSERT ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id()', t);
    EXECUTE format('CREATE TRIGGER %1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
    EXECUTE format('CREATE TRIGGER %1$s_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()', t);
    EXECUTE format('CREATE TRIGGER %1$s_template_lock BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()', t);
  END LOOP;
END $$;