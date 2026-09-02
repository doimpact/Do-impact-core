ALTER TABLE public.dm_metric_defs ADD COLUMN IF NOT EXISTS archived_at timestamptz;

DROP TRIGGER IF EXISTS set_company_id_dm_metric_defs ON public.dm_metric_defs;
CREATE TRIGGER set_company_id_dm_metric_defs
BEFORE INSERT ON public.dm_metric_defs
FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

DROP TRIGGER IF EXISTS set_company_id_dm_metric_values ON public.dm_metric_values;
CREATE TRIGGER set_company_id_dm_metric_values
BEFORE INSERT ON public.dm_metric_values
FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();