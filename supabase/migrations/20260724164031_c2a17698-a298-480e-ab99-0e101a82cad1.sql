
CREATE TABLE public.voc_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  title text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voc_tasks TO authenticated;
GRANT ALL ON public.voc_tasks TO service_role;

ALTER TABLE public.voc_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view voc_tasks"
  ON public.voc_tasks FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Company members can insert voc_tasks"
  ON public.voc_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Company members can update voc_tasks"
  ON public.voc_tasks FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Company members can delete voc_tasks"
  ON public.voc_tasks FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER voc_tasks_set_company BEFORE INSERT ON public.voc_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE TRIGGER voc_tasks_updated_at BEFORE UPDATE ON public.voc_tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER voc_tasks_template_lock BEFORE INSERT OR UPDATE OR DELETE ON public.voc_tasks
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE INDEX idx_voc_tasks_company ON public.voc_tasks(company_id);
CREATE INDEX idx_voc_tasks_account ON public.voc_tasks(account_id);
