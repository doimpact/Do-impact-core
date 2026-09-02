CREATE TABLE public.company_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  monthly_credit_cap numeric,
  activated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, addon_key)
);

GRANT SELECT ON public.company_addons TO authenticated;
GRANT ALL ON public.company_addons TO service_role;
ALTER TABLE public.company_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can see their company add-ons"
ON public.company_addons FOR SELECT TO authenticated
USING (public.is_company_member(company_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE TRIGGER company_addons_updated_at
BEFORE UPDATE ON public.company_addons
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.has_addon(_company uuid, _key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_addons
    WHERE company_id = _company AND addon_key = _key AND status = 'active'
  )
$$;

CREATE TABLE public.exec_room_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'New session',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exec_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.exec_room_threads(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL,
  persona text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX exec_room_threads_company_idx ON public.exec_room_threads (company_id, updated_at DESC);
CREATE INDEX exec_room_messages_thread_idx ON public.exec_room_messages (thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exec_room_threads TO authenticated;
GRANT ALL ON public.exec_room_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exec_room_messages TO authenticated;
GRANT ALL ON public.exec_room_messages TO service_role;

ALTER TABLE public.exec_room_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exec_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read exec room threads"
ON public.exec_room_threads FOR SELECT TO authenticated
USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Writers create exec room threads"
ON public.exec_room_threads FOR INSERT TO authenticated
WITH CHECK (public.has_write_access(company_id) AND public.has_addon(company_id, 'exec_team_room'));

CREATE POLICY "Writers update exec room threads"
ON public.exec_room_threads FOR UPDATE TO authenticated
USING (public.has_write_access(company_id))
WITH CHECK (public.has_write_access(company_id));

CREATE POLICY "Writers delete exec room threads"
ON public.exec_room_threads FOR DELETE TO authenticated
USING (public.has_write_access(company_id));

CREATE POLICY "Members read exec room messages"
ON public.exec_room_messages FOR SELECT TO authenticated
USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Writers create exec room messages"
ON public.exec_room_messages FOR INSERT TO authenticated
WITH CHECK (public.has_write_access(company_id) AND public.has_addon(company_id, 'exec_team_room'));

CREATE POLICY "Writers delete exec room messages"
ON public.exec_room_messages FOR DELETE TO authenticated
USING (public.has_write_access(company_id));

CREATE TRIGGER exec_room_threads_updated_at
BEFORE UPDATE ON public.exec_room_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER exec_room_threads_no_template_write
BEFORE INSERT OR UPDATE OR DELETE ON public.exec_room_threads
FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TRIGGER exec_room_messages_no_template_write
BEFORE INSERT OR UPDATE OR DELETE ON public.exec_room_messages
FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

INSERT INTO public.company_addons (company_id, addon_key)
VALUES ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5', 'exec_team_room')
ON CONFLICT (company_id, addon_key) DO NOTHING;