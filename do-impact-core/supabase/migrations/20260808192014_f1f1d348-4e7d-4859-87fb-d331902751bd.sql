ALTER TABLE public.kpis
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS library_key text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS hierarchy_level smallint,
  ADD COLUMN IF NOT EXISTS indicator_type text,
  ADD COLUMN IF NOT EXISTS formula text,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS data_source text,
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS exclusions text,
  ADD COLUMN IF NOT EXISTS reporting_level text;

CREATE INDEX IF NOT EXISTS kpis_company_library_key_idx ON public.kpis (company_id, library_key);
CREATE INDEX IF NOT EXISTS kpis_company_category_idx ON public.kpis (company_id, category);