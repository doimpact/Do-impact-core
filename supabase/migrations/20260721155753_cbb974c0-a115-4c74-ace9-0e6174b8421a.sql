
CREATE TABLE public.siop_long_lead_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  material text NOT NULL,
  form text,
  spec text,
  heat_lot text,
  supplier text,
  po_number text,
  part_numbers text,
  program text,
  qty_ordered numeric,
  uom text,
  unit_cost numeric,
  order_date date,
  promised_date date,
  expected_date date,
  need_by_date date,
  received_date date,
  status text NOT NULL DEFAULT 'ordered' CHECK (status IN ('quoted','ordered','in_transit','received','partial','late','cancelled')),
  risk text CHECK (risk IN ('green','yellow','red')),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_long_lead_materials TO authenticated;
GRANT ALL ON public.siop_long_lead_materials TO service_role;
ALTER TABLE public.siop_long_lead_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_ll read" ON public.siop_long_lead_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "siop_ll insert" ON public.siop_long_lead_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "siop_ll update" ON public.siop_long_lead_materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "siop_ll delete" ON public.siop_long_lead_materials FOR DELETE TO authenticated USING (true);
CREATE INDEX siop_ll_cycle_idx ON public.siop_long_lead_materials(cycle_id);
CREATE TRIGGER siop_ll_updated BEFORE UPDATE ON public.siop_long_lead_materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.siop_osp_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.siop_cycles(id) ON DELETE CASCADE,
  process text NOT NULL,
  spec text,
  supplier text,
  nadcap_approved boolean NOT NULL DEFAULT false,
  part_number text,
  program text,
  lot_qty numeric,
  ship_date date,
  promised_return_date date,
  expected_return_date date,
  actual_return_date date,
  tat_days_target integer,
  status text NOT NULL DEFAULT 'at_supplier' CHECK (status IN ('at_supplier','shipping_back','returned','late','hold','scrap')),
  risk text CHECK (risk IN ('green','yellow','red')),
  hold_reason text,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cost numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siop_osp_jobs TO authenticated;
GRANT ALL ON public.siop_osp_jobs TO service_role;
ALTER TABLE public.siop_osp_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siop_osp read" ON public.siop_osp_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "siop_osp insert" ON public.siop_osp_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "siop_osp update" ON public.siop_osp_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "siop_osp delete" ON public.siop_osp_jobs FOR DELETE TO authenticated USING (true);
CREATE INDEX siop_osp_cycle_idx ON public.siop_osp_jobs(cycle_id);
CREATE TRIGGER siop_osp_updated BEFORE UPDATE ON public.siop_osp_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
