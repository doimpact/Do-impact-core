-- Value streams / shop areas
CREATE TABLE public.aps_value_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  description text,
  owner_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_value_streams TO authenticated;
GRANT ALL ON public.aps_value_streams TO service_role;
ALTER TABLE public.aps_value_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_value_streams_company_all ON public.aps_value_streams FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_work_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  value_stream_id uuid NOT NULL REFERENCES public.aps_value_streams(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  capacity_hours_per_shift numeric NOT NULL DEFAULT 8,
  shifts_per_day integer NOT NULL DEFAULT 2,
  days_per_week integer NOT NULL DEFAULT 5,
  efficiency_pct numeric NOT NULL DEFAULT 85,
  staging_slots integer NOT NULL DEFAULT 6,
  notes text,
  archived_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_work_centers TO authenticated;
GRANT ALL ON public.aps_work_centers TO service_role;
ALTER TABLE public.aps_work_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_work_centers_company_all ON public.aps_work_centers FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_downtime (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_center_id uuid NOT NULL REFERENCES public.aps_work_centers(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  hours numeric,
  planned boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_downtime TO authenticated;
GRANT ALL ON public.aps_downtime TO service_role;
ALTER TABLE public.aps_downtime ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_downtime_company_all ON public.aps_downtime FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_tooling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  value_stream_id uuid REFERENCES public.aps_value_streams(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  qty_available integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'available',
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_tooling TO authenticated;
GRANT ALL ON public.aps_tooling TO service_role;
ALTER TABLE public.aps_tooling ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_tooling_company_all ON public.aps_tooling FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  value_stream_id uuid NOT NULL REFERENCES public.aps_value_streams(id) ON DELETE CASCADE,
  name text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_scenarios TO authenticated;
GRANT ALL ON public.aps_scenarios TO service_role;
ALTER TABLE public.aps_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_scenarios_company_all ON public.aps_scenarios FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  value_stream_id uuid NOT NULL REFERENCES public.aps_value_streams(id) ON DELETE CASCADE,
  work_center_id uuid REFERENCES public.aps_work_centers(id) ON DELETE SET NULL,
  wo_number text NOT NULL,
  part_number text NOT NULL,
  description text,
  qty numeric NOT NULL DEFAULT 1,
  due_date date NOT NULL,
  scheduled_start date NOT NULL,
  setup_minutes numeric NOT NULL DEFAULT 0,
  run_minutes_per_unit numeric NOT NULL DEFAULT 0,
  family text,
  required_skill text,
  tooling_id uuid REFERENCES public.aps_tooling(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 3,
  expedite boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'planned',
  sequence integer NOT NULL DEFAULT 0,
  source text,
  kit_ready boolean NOT NULL DEFAULT false,
  released_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_work_orders TO authenticated;
GRANT ALL ON public.aps_work_orders TO service_role;
ALTER TABLE public.aps_work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_work_orders_company_all ON public.aps_work_orders FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id uuid NOT NULL REFERENCES public.aps_work_orders(id) ON DELETE CASCADE,
  work_center_id uuid REFERENCES public.aps_work_centers(id) ON DELETE SET NULL,
  seq integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  setup_minutes numeric NOT NULL DEFAULT 0,
  run_minutes numeric NOT NULL DEFAULT 0,
  queue_minutes numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  completed_on_time boolean,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_operations TO authenticated;
GRANT ALL ON public.aps_operations TO service_role;
ALTER TABLE public.aps_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_operations_company_all ON public.aps_operations FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id uuid NOT NULL REFERENCES public.aps_work_orders(id) ON DELETE CASCADE,
  part_number text NOT NULL,
  description text,
  qty_required numeric NOT NULL DEFAULT 1,
  qty_on_hand numeric NOT NULL DEFAULT 0,
  qty_allocated numeric NOT NULL DEFAULT 0,
  lot_serial text,
  inbound_po text,
  inbound_date date,
  long_lead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_components TO authenticated;
GRANT ALL ON public.aps_components TO service_role;
ALTER TABLE public.aps_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_components_company_all ON public.aps_components FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_scenario_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.aps_scenarios(id) ON DELETE CASCADE,
  work_order_id uuid REFERENCES public.aps_work_orders(id) ON DELETE CASCADE,
  work_center_id uuid REFERENCES public.aps_work_centers(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_scenario_changes TO authenticated;
GRANT ALL ON public.aps_scenario_changes TO service_role;
ALTER TABLE public.aps_scenario_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_scenario_changes_company_all ON public.aps_scenario_changes FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TABLE public.aps_schedule_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  work_order_id uuid REFERENCES public.aps_work_orders(id) ON DELETE CASCADE,
  zone text,
  action text NOT NULL,
  from_value text,
  to_value text,
  reason text,
  override boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_schedule_log TO authenticated;
GRANT ALL ON public.aps_schedule_log TO service_role;
ALTER TABLE public.aps_schedule_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY aps_schedule_log_company_all ON public.aps_schedule_log FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

-- Shared triggers on every new table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['aps_value_streams','aps_work_centers','aps_downtime','aps_tooling',
                           'aps_scenarios','aps_work_orders','aps_operations','aps_components',
                           'aps_scenario_changes','aps_schedule_log']
  LOOP
    EXECUTE format('CREATE TRIGGER %1$s_set_company BEFORE INSERT ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id()', t);
    EXECUTE format('CREATE TRIGGER %1$s_set_updated BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
    EXECUTE format('CREATE TRIGGER %1$s_no_template BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()', t);
    EXECUTE format('CREATE TRIGGER %1$s_write_access BEFORE INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()', t);
  END LOOP;
END $$;

CREATE INDEX aps_work_orders_stream_idx ON public.aps_work_orders(company_id, value_stream_id, scheduled_start);
CREATE INDEX aps_work_centers_stream_idx ON public.aps_work_centers(company_id, value_stream_id);
CREATE INDEX aps_components_wo_idx ON public.aps_components(work_order_id);
CREATE INDEX aps_operations_wo_idx ON public.aps_operations(work_order_id);