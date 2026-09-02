-- calendar_events UPDATE
DROP POLICY IF EXISTS "cal update" ON public.calendar_events;
CREATE POLICY "cal update" ON public.calendar_events FOR UPDATE TO authenticated
USING (company_id = public.current_company_id() AND (auth.uid() = created_by OR auth.uid() = assignee_id OR public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')))
WITH CHECK (company_id = public.current_company_id() AND (auth.uid() = created_by OR auth.uid() = assignee_id OR public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')));

-- initiatives write
DROP POLICY IF EXISTS "initiatives write" ON public.initiatives;
CREATE POLICY "initiatives write" ON public.initiatives FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR owner_id = auth.uid()))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR owner_id = auth.uid()));

-- kpi_values
DROP POLICY IF EXISTS "manage kpi_values" ON public.kpi_values;
CREATE POLICY "manage kpi_values" ON public.kpi_values FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')));

-- meeting_notes
DROP POLICY IF EXISTS "mn write" ON public.meeting_notes;
CREATE POLICY "mn write" ON public.meeting_notes FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')));

-- pillar_notes
DROP POLICY IF EXISTS "pn insert" ON public.pillar_notes;
CREATE POLICY "pn insert" ON public.pillar_notes FOR INSERT TO authenticated
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR auth.uid() = created_by));

DROP POLICY IF EXISTS "pn update" ON public.pillar_notes;
CREATE POLICY "pn update" ON public.pillar_notes FOR UPDATE TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR auth.uid() = created_by))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR auth.uid() = created_by));

DROP POLICY IF EXISTS "pn delete" ON public.pillar_notes;
CREATE POLICY "pn delete" ON public.pillar_notes FOR DELETE TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR auth.uid() = created_by));

-- review_notes
DROP POLICY IF EXISTS "manage review_notes" ON public.review_notes;
CREATE POLICY "manage review_notes" ON public.review_notes FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader')));

-- reviews
DROP POLICY IF EXISTS "manage reviews" ON public.reviews;
CREATE POLICY "manage reviews" ON public.reviews FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR created_by = auth.uid()))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR created_by = auth.uid()));

-- sub_pillars
DROP POLICY IF EXISTS "admins manage sub_pillars" ON public.sub_pillars;
CREATE POLICY "admins manage sub_pillars" ON public.sub_pillars FOR ALL TO authenticated
USING (company_id = public.current_company_id() AND public.has_role(auth.uid(), company_id, 'admin'))
WITH CHECK (company_id = public.current_company_id() AND public.has_role(auth.uid(), company_id, 'admin'));

-- tasks update
DROP POLICY IF EXISTS "update tasks" ON public.tasks;
CREATE POLICY "update tasks" ON public.tasks FOR UPDATE TO authenticated
USING (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR assignee_id = auth.uid() OR created_by = auth.uid()))
WITH CHECK (company_id = public.current_company_id() AND (public.has_role(auth.uid(), company_id, 'admin') OR public.has_role(auth.uid(), company_id, 'leader') OR assignee_id = auth.uid() OR created_by = auth.uid()));