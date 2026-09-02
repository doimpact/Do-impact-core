CREATE TABLE public.dm_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  accent text NOT NULL DEFAULT 'text-slate-600',
  icon text NOT NULL DEFAULT 'Circle',
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_categories TO authenticated;
GRANT ALL ON public.dm_categories TO service_role;

ALTER TABLE public.dm_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read dm categories" ON public.dm_categories
  FOR SELECT TO authenticated USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "dm_categories_company_scope" ON public.dm_categories
  FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE TRIGGER dm_categories_set_updated_at
  BEFORE UPDATE ON public.dm_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER dm_categories_set_company
  BEFORE INSERT ON public.dm_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

-- Seed defaults for existing companies
INSERT INTO public.dm_categories (company_id, key, label, accent, icon, sort_order)
SELECT c.id, v.key, v.label, v.accent, v.icon, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('safety','Safety','text-red-600','ShieldCheck',0),
  ('people','People','text-sky-600','Users',1),
  ('quality','Quality','text-violet-600','BadgeCheck',2),
  ('delivery','Delivery','text-amber-600','Truck',3)
) AS v(key,label,accent,icon,sort_order)
ON CONFLICT (company_id, key) DO NOTHING;

CREATE TRIGGER dm_categories_no_template_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.dm_categories
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TRIGGER dm_categories_write_access
  BEFORE INSERT OR UPDATE OR DELETE ON public.dm_categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();

-- Seed defaults for new companies
CREATE OR REPLACE FUNCTION public.tg_company_seed_dm_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.dm_categories (company_id, key, label, accent, icon, sort_order)
  VALUES
    (NEW.id, 'safety', 'Safety', 'text-red-600', 'ShieldCheck', 0),
    (NEW.id, 'people', 'People', 'text-sky-600', 'Users', 1),
    (NEW.id, 'quality', 'Quality', 'text-violet-600', 'BadgeCheck', 2),
    (NEW.id, 'delivery', 'Delivery', 'text-amber-600', 'Truck', 3)
  ON CONFLICT (company_id, key) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER companies_seed_dm_categories
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.tg_company_seed_dm_categories();

-- Free the category columns from the fixed enum
ALTER TABLE public.dm_marks ALTER COLUMN category TYPE text USING category::text;
ALTER TABLE public.dm_escalations ALTER COLUMN category TYPE text USING category::text;

CREATE INDEX IF NOT EXISTS dm_marks_company_category_idx ON public.dm_marks (company_id, category);
CREATE INDEX IF NOT EXISTS dm_escalations_company_category_idx ON public.dm_escalations (company_id, category);