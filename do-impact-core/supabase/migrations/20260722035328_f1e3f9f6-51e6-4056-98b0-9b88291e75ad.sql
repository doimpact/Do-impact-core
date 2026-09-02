
CREATE TABLE public.compliance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  label text,
  total_items int NOT NULL DEFAULT 0,
  checked_items int NOT NULL DEFAULT 0,
  percent int NOT NULL DEFAULT 0,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_snapshots TO authenticated;
GRANT ALL ON public.compliance_snapshots TO service_role;

ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view snapshots in their company"
  ON public.compliance_snapshots FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can create snapshots in their company"
  ON public.compliance_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Creator or admin can delete snapshots"
  ON public.compliance_snapshots FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_company_admin(company_id, auth.uid()));

CREATE INDEX compliance_snapshots_company_created_idx
  ON public.compliance_snapshots (company_id, created_at DESC);
