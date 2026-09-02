CREATE TABLE public.voc_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  period date NOT NULL,
  nps numeric,
  csat numeric,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX voc_metrics_scope_period_idx
  ON public.voc_metrics(company_id, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid), period);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voc_metrics TO authenticated;
GRANT ALL ON public.voc_metrics TO service_role;

ALTER TABLE public.voc_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voc_metrics read" ON public.voc_metrics FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "voc_metrics insert" ON public.voc_metrics FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "voc_metrics update" ON public.voc_metrics FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "voc_metrics delete" ON public.voc_metrics FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER voc_metrics_set_company BEFORE INSERT ON public.voc_metrics
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER voc_metrics_updated_at BEFORE UPDATE ON public.voc_metrics
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER voc_metrics_template_lock BEFORE INSERT OR UPDATE OR DELETE ON public.voc_metrics
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE INDEX idx_voc_metrics_company ON public.voc_metrics(company_id, period DESC);