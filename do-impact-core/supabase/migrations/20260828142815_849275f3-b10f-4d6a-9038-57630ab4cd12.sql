-- 1) Make the shorthand role check fail closed when no active workspace is set
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.current_company_id() IS NOT NULL
     AND public.has_role(_user_id, public.current_company_id(), _role)
$function$;

-- 2) Rewrite policies to the explicit company-scoped role check
DROP POLICY IF EXISTS "org_settings admin write" ON public.org_settings;
CREATE POLICY "org_settings admin write" ON public.org_settings
  FOR ALL TO authenticated
  USING (company_id = current_company_id() AND has_role(auth.uid(), company_id, 'admin'::app_role))
  WITH CHECK (company_id = current_company_id() AND has_role(auth.uid(), company_id, 'admin'::app_role));

DROP POLICY IF EXISTS "dm_esc insert" ON public.dm_escalations;
CREATE POLICY "dm_esc insert" ON public.dm_escalations
  FOR INSERT TO authenticated
  WITH CHECK (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())));

DROP POLICY IF EXISTS "dm_esc update" ON public.dm_escalations;
CREATE POLICY "dm_esc update" ON public.dm_escalations
  FOR UPDATE TO authenticated
  USING (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())))
  WITH CHECK (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())));

DROP POLICY IF EXISTS "dm_esc delete" ON public.dm_escalations;
CREATE POLICY "dm_esc delete" ON public.dm_escalations
  FOR DELETE TO authenticated
  USING (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())));

DROP POLICY IF EXISTS "strategies elevated insert" ON public.strategies;
CREATE POLICY "strategies elevated insert" ON public.strategies
  FOR INSERT TO authenticated
  WITH CHECK (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())));

DROP POLICY IF EXISTS "strategies elevated update" ON public.strategies;
CREATE POLICY "strategies elevated update" ON public.strategies
  FOR UPDATE TO authenticated
  USING (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())))
  WITH CHECK (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())));

DROP POLICY IF EXISTS "strategies elevated delete" ON public.strategies;
CREATE POLICY "strategies elevated delete" ON public.strategies
  FOR DELETE TO authenticated
  USING (company_id = current_company_id() AND (has_role(auth.uid(), company_id, 'admin'::app_role) OR has_role(auth.uid(), company_id, 'leader'::app_role) OR is_company_admin(company_id, auth.uid())));

-- 3) user_active_company: split policies + cleanup of stale rows
DROP POLICY IF EXISTS "self manage active" ON public.user_active_company;

CREATE POLICY "self read active" ON public.user_active_company
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "self insert active" ON public.user_active_company
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_company_member(company_id, auth.uid()));

CREATE POLICY "self update active" ON public.user_active_company
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND is_company_member(company_id, auth.uid()));

CREATE POLICY "self delete active" ON public.user_active_company
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- remove existing stale selections
DELETE FROM public.user_active_company uac
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_members cm
  WHERE cm.company_id = uac.company_id AND cm.user_id = uac.user_id
);

CREATE OR REPLACE FUNCTION public.tg_clear_active_company_on_member_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.user_active_company
  WHERE user_id = OLD.user_id AND company_id = OLD.company_id;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_clear_active_company_on_member_removal() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS clear_active_company_on_member_removal ON public.company_members;
CREATE TRIGGER clear_active_company_on_member_removal
AFTER DELETE ON public.company_members
FOR EACH ROW EXECUTE FUNCTION public.tg_clear_active_company_on_member_removal();