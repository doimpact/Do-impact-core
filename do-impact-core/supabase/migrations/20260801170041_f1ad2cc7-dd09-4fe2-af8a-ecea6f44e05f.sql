CREATE TABLE public.dm_reason_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id(),
  label text NOT NULL,
  category_key text,
  color text NOT NULL DEFAULT 'text-slate-600',
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_reason_codes TO authenticated;
GRANT ALL ON public.dm_reason_codes TO service_role;

ALTER TABLE public.dm_reason_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reason codes readable by company members"
ON public.dm_reason_codes FOR SELECT TO authenticated
USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "reason codes insert in active company"
ON public.dm_reason_codes FOR INSERT TO authenticated
WITH CHECK (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE POLICY "reason codes update in active company"
ON public.dm_reason_codes FOR UPDATE TO authenticated
USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()))
WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "reason codes delete in active company"
ON public.dm_reason_codes FOR DELETE TO authenticated
USING (company_id = public.current_company_id() AND public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER dm_reason_codes_set_updated_at
BEFORE UPDATE ON public.dm_reason_codes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER dm_reason_codes_set_company
BEFORE INSERT ON public.dm_reason_codes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

CREATE TRIGGER dm_reason_codes_no_template_write
BEFORE INSERT OR UPDATE OR DELETE ON public.dm_reason_codes
FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE TRIGGER dm_reason_codes_write_access
BEFORE INSERT OR UPDATE OR DELETE ON public.dm_reason_codes
FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access();

CREATE INDEX dm_reason_codes_company_idx ON public.dm_reason_codes(company_id, sort_order);

ALTER TABLE public.dm_marks
  ADD COLUMN reason_code_id uuid REFERENCES public.dm_reason_codes(id) ON DELETE SET NULL;

ALTER TABLE public.dm_metric_values
  ADD COLUMN plan_value numeric;

CREATE OR REPLACE FUNCTION public.tg_company_seed_dm_reason_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.dm_reason_codes (company_id, label, category_key, color, sort_order)
  VALUES
    (NEW.id, 'Machine down', NULL, 'text-red-600', 0),
    (NEW.id, 'Material shortage', NULL, 'text-amber-600', 1),
    (NEW.id, 'Manpower', NULL, 'text-sky-600', 2),
    (NEW.id, 'Method / process', NULL, 'text-violet-600', 3),
    (NEW.id, 'Quality escape', 'quality', 'text-rose-600', 4),
    (NEW.id, 'Supplier', NULL, 'text-orange-600', 5),
    (NEW.id, 'Customer / external', NULL, 'text-teal-600', 6),
    (NEW.id, 'Other', NULL, 'text-slate-600', 7);
  RETURN NEW;
END $$;

CREATE TRIGGER companies_seed_dm_reason_codes
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_company_seed_dm_reason_codes();

ALTER TABLE public.dm_reason_codes DISABLE TRIGGER dm_reason_codes_no_template_write;

INSERT INTO public.dm_reason_codes (company_id, label, category_key, color, sort_order)
SELECT c.id, v.label, v.category_key, v.color, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('Machine down', NULL, 'text-red-600', 0),
  ('Material shortage', NULL, 'text-amber-600', 1),
  ('Manpower', NULL, 'text-sky-600', 2),
  ('Method / process', NULL, 'text-violet-600', 3),
  ('Quality escape', 'quality', 'text-rose-600', 4),
  ('Supplier', NULL, 'text-orange-600', 5),
  ('Customer / external', NULL, 'text-teal-600', 6),
  ('Other', NULL, 'text-slate-600', 7)
) AS v(label, category_key, color, sort_order);

ALTER TABLE public.dm_reason_codes ENABLE TRIGGER dm_reason_codes_no_template_write;