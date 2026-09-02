-- Standard work templates
DROP POLICY IF EXISTS "members read sw templates" ON public.oms_standard_work_templates;
DROP POLICY IF EXISTS "own write sw templates" ON public.oms_standard_work_templates;
CREATE POLICY "own write sw templates" ON public.oms_standard_work_templates
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());

-- Daily management reason codes
DROP POLICY IF EXISTS "reason codes readable by company members" ON public.dm_reason_codes;
CREATE POLICY "reason codes readable in active company" ON public.dm_reason_codes
  FOR SELECT TO authenticated
  USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

-- Add-ons
DROP POLICY IF EXISTS "Members can see their company add-ons" ON public.company_addons;
CREATE POLICY "Members can see active company add-ons" ON public.company_addons
  FOR SELECT TO authenticated
  USING ((company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid())) OR public.is_super_admin(auth.uid()));

-- Subscriptions
DROP POLICY IF EXISTS "Members can see their company subscription" ON public.company_subscriptions;
CREATE POLICY "Members can see active company subscription" ON public.company_subscriptions
  FOR SELECT TO authenticated
  USING ((company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid())) OR public.is_super_admin(auth.uid()));

-- Add-on requests
DROP POLICY IF EXISTS "Users read their own add-on requests" ON public.addon_requests;
CREATE POLICY "Users read own add-on requests in active company" ON public.addon_requests
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid() AND company_id = public.current_company_id()) OR public.is_super_admin());

-- Audit logs
DROP POLICY IF EXISTS "Members can read own company audit logs" ON public.audit_logs;
CREATE POLICY "Members read active company audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid())) OR public.is_super_admin());

-- AI usage
DROP POLICY IF EXISTS "read own or admin usage" ON public.ai_usage_events;
CREATE POLICY "read own or active company admin usage" ON public.ai_usage_events
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid() AND (company_id IS NULL OR company_id = public.current_company_id()))
    OR public.is_super_admin()
    OR (company_id IS NOT NULL AND company_id = public.current_company_id() AND public.is_company_admin(company_id, auth.uid()))
  );

DROP POLICY IF EXISTS "read limits" ON public.ai_usage_limits;
CREATE POLICY "read limits" ON public.ai_usage_limits
  FOR SELECT TO authenticated
  USING (
    (user_id = auth.uid() AND (company_id IS NULL OR company_id = public.current_company_id()))
    OR public.is_super_admin()
    OR (company_id IS NOT NULL AND company_id = public.current_company_id() AND public.is_company_admin(company_id, auth.uid()))
  );