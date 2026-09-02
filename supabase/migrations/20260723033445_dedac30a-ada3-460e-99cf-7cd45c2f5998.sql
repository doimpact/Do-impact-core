
-- 1. dm_boards table
CREATE TABLE public.dm_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_boards TO authenticated;
GRANT ALL ON public.dm_boards TO service_role;

ALTER TABLE public.dm_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read boards" ON public.dm_boards FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "members write boards" ON public.dm_boards FOR ALL TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

CREATE TRIGGER trg_dm_boards_company BEFORE INSERT ON public.dm_boards
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();
CREATE TRIGGER trg_dm_boards_updated BEFORE UPDATE ON public.dm_boards
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Seed a "Main" board per existing company
INSERT INTO public.dm_boards (company_id, name, sort_order)
SELECT id, 'Main', 0 FROM public.companies
ON CONFLICT DO NOTHING;

-- 3. Add board_id to dm_marks and dm_escalations
ALTER TABLE public.dm_marks ADD COLUMN board_id uuid REFERENCES public.dm_boards(id) ON DELETE CASCADE;
ALTER TABLE public.dm_escalations ADD COLUMN board_id uuid REFERENCES public.dm_boards(id) ON DELETE CASCADE;

-- 4. Backfill existing marks/3Cs to each company's Main board
UPDATE public.dm_marks m
SET board_id = b.id
FROM public.dm_boards b
WHERE b.company_id = m.company_id AND b.name = 'Main' AND m.board_id IS NULL;

UPDATE public.dm_escalations e
SET board_id = b.id
FROM public.dm_boards b
WHERE b.company_id = e.company_id AND b.name = 'Main' AND e.board_id IS NULL;

ALTER TABLE public.dm_marks ALTER COLUMN board_id SET NOT NULL;
ALTER TABLE public.dm_escalations ALTER COLUMN board_id SET NOT NULL;

-- 5. Adjust unique constraint on dm_marks to include board
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.dm_marks'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.dm_marks DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS dm_marks_board_cat_date_uniq
  ON public.dm_marks (board_id, category, mark_date);

CREATE INDEX IF NOT EXISTS dm_escalations_board_idx ON public.dm_escalations (board_id);

-- 6. Auto-create Main board when a new company is created
CREATE OR REPLACE FUNCTION public.tg_company_seed_dm_board()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.dm_boards (company_id, name, sort_order)
  VALUES (NEW.id, 'Main', 0)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_company_seed_dm_board ON public.companies;
CREATE TRIGGER trg_company_seed_dm_board AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.tg_company_seed_dm_board();
