DROP POLICY "proficiency_levels read" ON public.proficiency_levels;
CREATE POLICY "proficiency_levels read" ON public.proficiency_levels
FOR SELECT TO authenticated
USING (public.is_company_member(public.current_company_id(), auth.uid()));