-- 1. Company-scope the broad SELECT policies -------------------------------
DROP POLICY IF EXISTS "read kpis" ON public.kpis;
CREATE POLICY "kpis company read" ON public.kpis FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "kpis auth write" ON public.kpis;
CREATE POLICY "kpis company insert" ON public.kpis FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS "kpis auth update" ON public.kpis;
CREATE POLICY "kpis company update" ON public.kpis FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS "kpis auth delete" ON public.kpis;
CREATE POLICY "kpis company delete" ON public.kpis FOR DELETE TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "os read" ON public.org_settings;
CREATE POLICY "org_settings company read" ON public.org_settings FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS "os write" ON public.org_settings;
CREATE POLICY "org_settings admin write" ON public.org_settings FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "read tasks" ON public.tasks;
CREATE POLICY "tasks company read" ON public.tasks FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "cal read" ON public.calendar_events;
CREATE POLICY "calendar_events company read" ON public.calendar_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "read reviews" ON public.reviews;
CREATE POLICY "reviews company read" ON public.reviews FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "read review_notes" ON public.review_notes;
CREATE POLICY "review_notes company read" ON public.review_notes FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "mn read" ON public.meeting_notes;
CREATE POLICY "meeting_notes company read" ON public.meeting_notes FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "pn read" ON public.pillar_notes;
CREATE POLICY "pillar_notes company read" ON public.pillar_notes FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "read sub_pillars" ON public.sub_pillars;
CREATE POLICY "sub_pillars company read" ON public.sub_pillars FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "a3 readable" ON public.a3_reports;
CREATE POLICY "a3_reports company read" ON public.a3_reports FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "npi_projects auth read" ON public.npi_projects;
CREATE POLICY "npi_projects company read" ON public.npi_projects FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "npi_risks auth read" ON public.npi_risks;
CREATE POLICY "npi_risks company read" ON public.npi_risks FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "npi_checklist auth read" ON public.npi_gate_checklist;
CREATE POLICY "npi_gate_checklist company read" ON public.npi_gate_checklist FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "auth read projects" ON public.restructuring_projects;
CREATE POLICY "restructuring_projects company read" ON public.restructuring_projects FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS "auth read members" ON public.restructuring_members;
CREATE POLICY "restructuring_members company read" ON public.restructuring_members FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

-- 2. restructuring_items: company scope in the permissive policies ---------
DROP POLICY IF EXISTS "restructuring_items auth read" ON public.restructuring_items;
DROP POLICY IF EXISTS "restructuring_items auth write" ON public.restructuring_items;
DROP POLICY IF EXISTS "restructuring_items auth update" ON public.restructuring_items;
DROP POLICY IF EXISTS "restructuring_items auth delete" ON public.restructuring_items;
CREATE POLICY "restructuring_items company all" ON public.restructuring_items FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- 3. CRM tables: replace auth.uid() IS NOT NULL with company scope ---------
DROP POLICY IF EXISTS "team opportunities all" ON public.opportunities;
CREATE POLICY "opportunities company all" ON public.opportunities FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "team touchpoints all" ON public.stakeholder_touchpoints;
CREATE POLICY "stakeholder_touchpoints company all" ON public.stakeholder_touchpoints FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "team interactions all" ON public.interactions;
CREATE POLICY "interactions company all" ON public.interactions FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "team contracts all" ON public.contracts;
CREATE POLICY "contracts company all" ON public.contracts FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "team quotes all" ON public.quotes;
CREATE POLICY "quotes company all" ON public.quotes FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "team targets all" ON public.growth_targets;
CREATE POLICY "growth_targets company all" ON public.growth_targets FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "team backlog all" ON public.booked_backlog;
CREATE POLICY "booked_backlog company all" ON public.booked_backlog FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

-- 4. Remove anonymous EXECUTE on the SECURITY DEFINER role check -----------
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO service_role;