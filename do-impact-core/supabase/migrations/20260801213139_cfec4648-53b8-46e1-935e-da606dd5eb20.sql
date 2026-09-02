ALTER TABLE public.waterfall_item_kpi_values ADD COLUMN note text;
ALTER TABLE public.waterfall_item_kpis ADD COLUMN archived_at timestamptz;