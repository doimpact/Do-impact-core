ALTER TABLE public.consolidation_projects ADD COLUMN IF NOT EXISTS discount_rate_pct numeric NOT NULL DEFAULT 10;
ALTER TABLE public.capex_projects ADD COLUMN IF NOT EXISTS discount_rate_pct numeric NOT NULL DEFAULT 10;
ALTER TABLE public.waterfall_bridges ADD COLUMN IF NOT EXISTS discount_rate_pct numeric NOT NULL DEFAULT 10;