ALTER TABLE public.five_whys_reports ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.fishbone_reports ALTER COLUMN company_id SET DEFAULT current_company_id();
ALTER TABLE public.dmaic_projects ALTER COLUMN company_id SET DEFAULT current_company_id();