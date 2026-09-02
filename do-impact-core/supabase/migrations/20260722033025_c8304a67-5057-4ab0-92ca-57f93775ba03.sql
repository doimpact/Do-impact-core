
CREATE TABLE public.oms_standard_work (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oms_standard_work TO authenticated;
GRANT ALL ON public.oms_standard_work TO service_role;
ALTER TABLE public.oms_standard_work ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read std work" ON public.oms_standard_work FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "own write std work" ON public.oms_standard_work FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_sw_updated BEFORE UPDATE ON public.oms_standard_work FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.oms_standard_work_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oms_standard_work_templates TO authenticated;
GRANT ALL ON public.oms_standard_work_templates TO service_role;
ALTER TABLE public.oms_standard_work_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read sw templates" ON public.oms_standard_work_templates FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "own write sw templates" ON public.oms_standard_work_templates FOR ALL TO authenticated
  USING (user_id = auth.uid() AND public.is_company_member(company_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_company_member(company_id, auth.uid()));
CREATE TRIGGER trg_sw_tpl_updated BEFORE UPDATE ON public.oms_standard_work_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
