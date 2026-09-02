ALTER TABLE public.capex_projects
  ADD COLUMN IF NOT EXISTS linked_theme_id uuid REFERENCES public.strategic_themes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_objective_id uuid REFERENCES public.strategic_objectives(id) ON DELETE SET NULL,
  ALTER COLUMN strategic_objective DROP NOT NULL;