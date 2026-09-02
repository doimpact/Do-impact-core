
DO $$ BEGIN
  CREATE TYPE public.voc_note_kind AS ENUM ('works_well','can_improve');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.voc_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  kind public.voc_note_kind NOT NULL,
  position int NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voc_notes_company_kind_idx ON public.voc_notes(company_id, kind, position);
CREATE INDEX IF NOT EXISTS voc_notes_account_idx ON public.voc_notes(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voc_notes TO authenticated;
GRANT ALL ON public.voc_notes TO service_role;

ALTER TABLE public.voc_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voc read" ON public.voc_notes;
CREATE POLICY "voc read" ON public.voc_notes FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "voc insert" ON public.voc_notes;
CREATE POLICY "voc insert" ON public.voc_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "voc update" ON public.voc_notes;
CREATE POLICY "voc update" ON public.voc_notes FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()))
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

DROP POLICY IF EXISTS "voc delete" ON public.voc_notes;
CREATE POLICY "voc delete" ON public.voc_notes FOR DELETE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

DROP TRIGGER IF EXISTS voc_notes_set_company_id ON public.voc_notes;
CREATE TRIGGER voc_notes_set_company_id BEFORE INSERT ON public.voc_notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id();

DROP TRIGGER IF EXISTS voc_notes_set_updated_at ON public.voc_notes;
CREATE TRIGGER voc_notes_set_updated_at BEFORE UPDATE ON public.voc_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_prevent_template_voc_notes ON public.voc_notes;
CREATE TRIGGER trg_prevent_template_voc_notes BEFORE INSERT OR UPDATE OR DELETE ON public.voc_notes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
