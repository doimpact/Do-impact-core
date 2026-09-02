
CREATE TABLE public.vsm_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_family text,
  customer text,
  demand_per_period numeric,
  period_label text DEFAULT 'per day',
  available_time_sec integer,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vsm_maps TO authenticated;
GRANT ALL ON public.vsm_maps TO service_role;
ALTER TABLE public.vsm_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vsm_maps members all" ON public.vsm_maps FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_vsm_maps_updated BEFORE UPDATE ON public.vsm_maps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.vsm_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  map_id uuid NOT NULL REFERENCES public.vsm_maps(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  cycle_time_sec numeric,
  changeover_sec numeric,
  uptime_pct numeric,
  operators integer,
  shifts integer,
  batch_size integer,
  scrap_pct numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vsm_steps TO authenticated;
GRANT ALL ON public.vsm_steps TO service_role;
ALTER TABLE public.vsm_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vsm_steps members all" ON public.vsm_steps FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE INDEX vsm_steps_map_idx ON public.vsm_steps(map_id, position);
CREATE TRIGGER trg_vsm_steps_updated BEFORE UPDATE ON public.vsm_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.vsm_inventories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  map_id uuid NOT NULL REFERENCES public.vsm_maps(id) ON DELETE CASCADE,
  after_step_position integer NOT NULL DEFAULT 0,
  quantity numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vsm_inventories TO authenticated;
GRANT ALL ON public.vsm_inventories TO service_role;
ALTER TABLE public.vsm_inventories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vsm_inventories members all" ON public.vsm_inventories FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE INDEX vsm_inv_map_idx ON public.vsm_inventories(map_id, after_step_position);
CREATE TRIGGER trg_vsm_inv_updated BEFORE UPDATE ON public.vsm_inventories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.vsm_info_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  map_id uuid NOT NULL REFERENCES public.vsm_maps(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('supplier','customer','control','signal')),
  label text NOT NULL,
  frequency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vsm_info_flows TO authenticated;
GRANT ALL ON public.vsm_info_flows TO service_role;
ALTER TABLE public.vsm_info_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vsm_info_flows members all" ON public.vsm_info_flows FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE INDEX vsm_flows_map_idx ON public.vsm_info_flows(map_id);
CREATE TRIGGER trg_vsm_flows_updated BEFORE UPDATE ON public.vsm_info_flows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
