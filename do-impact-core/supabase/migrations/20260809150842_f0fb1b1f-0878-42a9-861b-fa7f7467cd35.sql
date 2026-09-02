CREATE TABLE public.business_health_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id(),
  name text NOT NULL DEFAULT 'Business health review',
  is_default boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_health_templates TO authenticated;
GRANT ALL ON public.business_health_templates TO service_role;
ALTER TABLE public.business_health_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_health_templates company scope" ON public.business_health_templates FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER business_health_templates_set_updated_at BEFORE UPDATE ON public.business_health_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER business_health_templates_no_template BEFORE INSERT OR UPDATE OR DELETE ON public.business_health_templates
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TABLE public.business_health_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id(),
  period_label text NOT NULL,
  headline text,
  narratives jsonb NOT NULL DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_health_reviews TO authenticated;
GRANT ALL ON public.business_health_reviews TO service_role;
ALTER TABLE public.business_health_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_health_reviews company scope" ON public.business_health_reviews FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE TRIGGER business_health_reviews_set_updated_at BEFORE UPDATE ON public.business_health_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER business_health_reviews_no_template BEFORE INSERT OR UPDATE OR DELETE ON public.business_health_reviews
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();