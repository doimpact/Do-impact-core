
ALTER TABLE public.consolidation_pnl_entries
  ADD COLUMN IF NOT EXISTS site text;

ALTER TABLE public.consolidation_pnl_entries
  DROP CONSTRAINT IF EXISTS consolidation_pnl_entries_line_check;
ALTER TABLE public.consolidation_pnl_entries
  ADD CONSTRAINT consolidation_pnl_entries_line_check
  CHECK (line IN ('revenue','variable_cost','transition_cost','fixed_cost'));

ALTER TABLE public.consolidation_pnl_entries
  DROP CONSTRAINT IF EXISTS consolidation_pnl_entries_site_check;
ALTER TABLE public.consolidation_pnl_entries
  ADD CONSTRAINT consolidation_pnl_entries_site_check
  CHECK (site IS NULL OR site IN ('site_a','site_b'));

ALTER TABLE public.consolidation_pnl_entries
  DROP CONSTRAINT IF EXISTS consolidation_pnl_entries_project_id_scenario_month_line_key;

DROP INDEX IF EXISTS public.consolidation_pnl_entries_unique_cell;
CREATE UNIQUE INDEX consolidation_pnl_entries_unique_cell
  ON public.consolidation_pnl_entries
  (project_id, scenario, COALESCE(site, ''), month, line);
