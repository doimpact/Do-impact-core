CREATE TABLE public.addon_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  plan_key text,
  contact_email text,
  note text,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addon_requests TO authenticated;
GRANT ALL ON public.addon_requests TO service_role;

ALTER TABLE public.addon_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own add-on requests"
  ON public.addon_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users create their own add-on requests"
  ON public.addon_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Platform admins update add-on requests"
  ON public.addon_requests FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "Platform admins delete add-on requests"
  ON public.addon_requests FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE TRIGGER update_addon_requests_updated_at
  BEFORE UPDATE ON public.addon_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX addon_requests_status_idx ON public.addon_requests (status, created_at DESC);