
DROP POLICY IF EXISTS "themes leaders write" ON public.strategic_themes;
CREATE POLICY "themes authenticated write" ON public.strategic_themes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "objectives leaders write" ON public.strategic_objectives;
CREATE POLICY "objectives authenticated write" ON public.strategic_objectives
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
