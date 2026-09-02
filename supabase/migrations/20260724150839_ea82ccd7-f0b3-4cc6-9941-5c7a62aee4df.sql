BEGIN;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;

UPDATE public.companies SET is_template = true WHERE id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5';

INSERT INTO public.company_members (company_id, user_id, role)
VALUES ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5', 'a4c631d7-0912-4404-89cf-e413df626aeb', 'owner')
ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'owner';

CREATE OR REPLACE FUNCTION public.prevent_template_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_template boolean;
BEGIN
  SELECT c.is_template INTO is_template
  FROM public.companies c
  WHERE c.id = NEW.company_id;
  IF is_template THEN
    RAISE EXCEPTION 'TitanScale Template is read-only. Duplicate it to edit.';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_strategies') THEN
    CREATE TRIGGER trg_prevent_template_strategies BEFORE INSERT OR UPDATE OR DELETE ON public.strategies
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_themes') THEN
    CREATE TRIGGER trg_prevent_template_themes BEFORE INSERT OR UPDATE OR DELETE ON public.strategic_themes
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_objectives') THEN
    CREATE TRIGGER trg_prevent_template_objectives BEFORE INSERT OR UPDATE OR DELETE ON public.strategic_objectives
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_capex') THEN
    CREATE TRIGGER trg_prevent_template_capex BEFORE INSERT OR UPDATE OR DELETE ON public.capex_projects
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_waterfall') THEN
    CREATE TRIGGER trg_prevent_template_waterfall BEFORE INSERT OR UPDATE OR DELETE ON public.waterfall_bridges
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_a3') THEN
    CREATE TRIGGER trg_prevent_template_a3 BEFORE INSERT OR UPDATE OR DELETE ON public.a3_reports
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_employees') THEN
    CREATE TRIGGER trg_prevent_template_employees BEFORE INSERT OR UPDATE OR DELETE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_pillars') THEN
    CREATE TRIGGER trg_prevent_template_pillars BEFORE INSERT OR UPDATE OR DELETE ON public.pillars
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_template_accounts') THEN
    CREATE TRIGGER trg_prevent_template_accounts BEFORE INSERT OR UPDATE OR DELETE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
  END IF;
END $$;

COMMIT;