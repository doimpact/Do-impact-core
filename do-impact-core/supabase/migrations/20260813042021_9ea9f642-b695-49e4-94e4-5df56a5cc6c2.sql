DROP INDEX IF EXISTS public.consolidation_pnl_entries_unique_cell;
ALTER TABLE public.consolidation_pnl_entries
  ADD CONSTRAINT consolidation_pnl_entries_unique_cell
  UNIQUE NULLS NOT DISTINCT (project_id, scenario, site, month, line);