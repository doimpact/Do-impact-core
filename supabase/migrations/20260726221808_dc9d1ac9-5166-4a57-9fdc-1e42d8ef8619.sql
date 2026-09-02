ALTER TABLE public.growth_targets DROP CONSTRAINT IF EXISTS growth_targets_year_month_key;
ALTER TABLE public.growth_targets ADD CONSTRAINT growth_targets_company_year_month_key UNIQUE (company_id, year, month);

ALTER TABLE public.booked_backlog DROP CONSTRAINT IF EXISTS booked_backlog_year_month_stream_key;
ALTER TABLE public.booked_backlog ADD CONSTRAINT booked_backlog_company_year_month_stream_key UNIQUE (company_id, year, month, stream);

ALTER TABLE public.skill_categories DROP CONSTRAINT IF EXISTS skill_categories_name_key;
ALTER TABLE public.skill_categories ADD CONSTRAINT skill_categories_company_name_key UNIQUE (company_id, name);