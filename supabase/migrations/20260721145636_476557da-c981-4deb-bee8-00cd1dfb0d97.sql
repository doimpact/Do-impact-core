
CREATE TABLE public.restructuring_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID,
  start_date DATE,
  target_date DATE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restructuring_projects TO authenticated;
GRANT ALL ON public.restructuring_projects TO service_role;
ALTER TABLE public.restructuring_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read projects" ON public.restructuring_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write projects" ON public.restructuring_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_restructuring_projects_updated BEFORE UPDATE ON public.restructuring_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.restructuring_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.restructuring_projects(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (body IN ('steerco','pmo','workstream')),
  workstream_name TEXT,
  user_id UUID,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restructuring_members TO authenticated;
GRANT ALL ON public.restructuring_members TO service_role;
ALTER TABLE public.restructuring_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read members" ON public.restructuring_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write members" ON public.restructuring_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_restructuring_members_updated BEFORE UPDATE ON public.restructuring_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_restructuring_members_project ON public.restructuring_members(project_id, body);

ALTER TABLE public.restructuring_items ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.restructuring_projects(id) ON DELETE CASCADE;

DO $$
DECLARE default_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.restructuring_items WHERE project_id IS NULL) THEN
    INSERT INTO public.restructuring_projects (name, description) VALUES ('Default Project', 'Initial restructuring project')
    RETURNING id INTO default_id;
    UPDATE public.restructuring_items SET project_id = default_id WHERE project_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restructuring_items_project ON public.restructuring_items(project_id);
