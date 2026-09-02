
-- ============ shared trigger fn (both source projects use set_updated_at) ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.task_status AS ENUM ('backlog','todo','in_progress','blocked','done'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.task_priority AS ENUM ('low','med','high','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.pillar_health AS ENUM ('green','yellow','red'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.calendar_event_type AS ENUM ('visit','audit','meeting','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.dm_category AS ENUM ('safety','people','quality','delivery'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.dm_status AS ENUM ('green','red'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.pillar_note_kind AS ENUM ('working_well','can_improve'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure profiles has manager_id/title/avatar_url expected by ported code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS profiles_manager_id_idx ON public.profiles(manager_id);

-- ============ OMS: PILLARS ============
CREATE TABLE IF NOT EXISTS public.pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  variant text NOT NULL DEFAULT 'light',
  health public.pillar_health NOT NULL DEFAULT 'green',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.pillars TO authenticated;
GRANT ALL ON public.pillars TO service_role;
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read pillars" ON public.pillars;
CREATE POLICY "read pillars" ON public.pillars FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admins manage pillars" ON public.pillars;
CREATE POLICY "admins manage pillars" ON public.pillars FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.sub_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.sub_pillars TO authenticated;
GRANT ALL ON public.sub_pillars TO service_role;
ALTER TABLE public.sub_pillars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read sub_pillars" ON public.sub_pillars;
CREATE POLICY "read sub_pillars" ON public.sub_pillars FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admins manage sub_pillars" ON public.sub_pillars;
CREATE POLICY "admins manage sub_pillars" ON public.sub_pillars FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ OMS: TASKS ============
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  sub_pillar_id uuid REFERENCES public.sub_pillars(id) ON DELETE SET NULL,
  title text NOT NULL, description text,
  status public.task_status NOT NULL DEFAULT 'backlog',
  priority public.task_priority NOT NULL DEFAULT 'med',
  assignee_id uuid,
  due_date date,
  position double precision NOT NULL DEFAULT 1000,
  closed_at timestamptz,
  close_reason text CHECK (close_reason IS NULL OR close_reason IN ('done','blocked','archived')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_pillar_status_pos ON public.tasks (pillar_id, status, position);
CREATE INDEX IF NOT EXISTS tasks_closed_at_idx ON public.tasks (closed_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read tasks" ON public.tasks;
CREATE POLICY "read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "create tasks" ON public.tasks;
CREATE POLICY "create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "update tasks" ON public.tasks;
CREATE POLICY "update tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR assignee_id=auth.uid() OR created_by=auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR assignee_id=auth.uid() OR created_by=auth.uid());
DROP POLICY IF EXISTS "delete tasks" ON public.tasks;
CREATE POLICY "delete tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR created_by=auth.uid());

-- ============ OMS: KPIs ============
CREATE TABLE IF NOT EXISTS public.kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  name text NOT NULL, unit text, target numeric,
  higher_is_better boolean NOT NULL DEFAULT true,
  green_threshold numeric, amber_threshold numeric,
  frequency text NOT NULL DEFAULT 'monthly',
  description text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpis TO authenticated;
GRANT ALL ON public.kpis TO service_role;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read kpis" ON public.kpis;
CREATE POLICY "read kpis" ON public.kpis FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "manage kpis" ON public.kpis;
CREATE POLICY "manage kpis" ON public.kpis FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

CREATE TABLE IF NOT EXISTS public.kpi_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  actual numeric,
  target numeric,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, period_start)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_values TO authenticated;
GRANT ALL ON public.kpi_values TO service_role;
ALTER TABLE public.kpi_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read kpi_values" ON public.kpi_values;
CREATE POLICY "read kpi_values" ON public.kpi_values FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "manage kpi_values" ON public.kpi_values;
CREATE POLICY "manage kpi_values" ON public.kpi_values FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

-- ============ OMS: REVIEWS ============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  scheduled_for date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read reviews" ON public.reviews;
CREATE POLICY "read reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "manage reviews" ON public.reviews;
CREATE POLICY "manage reviews" ON public.reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR created_by=auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR created_by=auth.uid());

CREATE TABLE IF NOT EXISTS public.review_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  pillar_id uuid NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  notes text, decisions text,
  UNIQUE (review_id, pillar_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_notes TO authenticated;
GRANT ALL ON public.review_notes TO service_role;
ALTER TABLE public.review_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read review_notes" ON public.review_notes;
CREATE POLICY "read review_notes" ON public.review_notes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "manage review_notes" ON public.review_notes;
CREATE POLICY "manage review_notes" ON public.review_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

-- ============ OMS: CALENDAR ============
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT,
  event_type public.calendar_event_type NOT NULL DEFAULT 'meeting',
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pillar_id UUID REFERENCES public.pillars(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(event_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cal read" ON public.calendar_events;
CREATE POLICY "cal read" ON public.calendar_events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cal insert" ON public.calendar_events;
CREATE POLICY "cal insert" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "cal update" ON public.calendar_events;
CREATE POLICY "cal update" ON public.calendar_events FOR UPDATE TO authenticated
  USING (auth.uid()=created_by OR auth.uid()=assignee_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (auth.uid()=created_by OR auth.uid()=assignee_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP POLICY IF EXISTS "cal delete" ON public.calendar_events;
CREATE POLICY "cal delete" ON public.calendar_events FOR DELETE TO authenticated
  USING (auth.uid()=created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OMS: DAILY MANAGEMENT ============
CREATE TABLE IF NOT EXISTS public.dm_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category public.dm_category NOT NULL,
  mark_date date NOT NULL,
  status public.dm_status NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, mark_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_marks TO authenticated;
GRANT ALL ON public.dm_marks TO service_role;
ALTER TABLE public.dm_marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm_marks read" ON public.dm_marks;
CREATE POLICY "dm_marks read" ON public.dm_marks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "dm_marks insert" ON public.dm_marks;
CREATE POLICY "dm_marks insert" ON public.dm_marks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP POLICY IF EXISTS "dm_marks update" ON public.dm_marks;
CREATE POLICY "dm_marks update" ON public.dm_marks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP POLICY IF EXISTS "dm_marks delete" ON public.dm_marks;
CREATE POLICY "dm_marks delete" ON public.dm_marks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS dm_marks_updated ON public.dm_marks;
CREATE TRIGGER dm_marks_updated BEFORE UPDATE ON public.dm_marks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.dm_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_id uuid REFERENCES public.dm_marks(id) ON DELETE CASCADE,
  category public.dm_category NOT NULL,
  occurred_on date NOT NULL,
  concern text NOT NULL,
  cause text,
  countermeasure text,
  owner_id uuid,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  escalated boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_escalations TO authenticated;
GRANT ALL ON public.dm_escalations TO service_role;
ALTER TABLE public.dm_escalations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm_esc read" ON public.dm_escalations;
CREATE POLICY "dm_esc read" ON public.dm_escalations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "dm_esc insert" ON public.dm_escalations;
CREATE POLICY "dm_esc insert" ON public.dm_escalations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP POLICY IF EXISTS "dm_esc update" ON public.dm_escalations;
CREATE POLICY "dm_esc update" ON public.dm_escalations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP POLICY IF EXISTS "dm_esc delete" ON public.dm_escalations;
CREATE POLICY "dm_esc delete" ON public.dm_escalations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS dm_esc_updated ON public.dm_escalations;
CREATE TRIGGER dm_esc_updated BEFORE UPDATE ON public.dm_escalations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OMS: MEETING NOTES ============
CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  attendees TEXT[] NOT NULL DEFAULT '{}',
  section_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  health_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_notes TO authenticated;
GRANT ALL ON public.meeting_notes TO service_role;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mn read" ON public.meeting_notes;
CREATE POLICY "mn read" ON public.meeting_notes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "mn write" ON public.meeting_notes;
CREATE POLICY "mn write" ON public.meeting_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS meeting_notes_set_updated_at ON public.meeting_notes;
CREATE TRIGGER meeting_notes_set_updated_at BEFORE UPDATE ON public.meeting_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ OMS: PILLAR NOTES ============
CREATE TABLE IF NOT EXISTS public.pillar_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  kind public.pillar_note_kind NOT NULL,
  position int NOT NULL DEFAULT 0,
  content text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pillar_notes_pillar_kind_idx ON public.pillar_notes(pillar_id, kind, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pillar_notes TO authenticated;
GRANT ALL ON public.pillar_notes TO service_role;
ALTER TABLE public.pillar_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pn read" ON public.pillar_notes;
CREATE POLICY "pn read" ON public.pillar_notes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pn insert" ON public.pillar_notes;
CREATE POLICY "pn insert" ON public.pillar_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR auth.uid()=created_by);
DROP POLICY IF EXISTS "pn update" ON public.pillar_notes;
CREATE POLICY "pn update" ON public.pillar_notes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR auth.uid()=created_by)
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR auth.uid()=created_by);
DROP POLICY IF EXISTS "pn delete" ON public.pillar_notes;
CREATE POLICY "pn delete" ON public.pillar_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader') OR auth.uid()=created_by);
DROP TRIGGER IF EXISTS pillar_notes_set_updated_at ON public.pillar_notes;
CREATE TRIGGER pillar_notes_set_updated_at BEFORE UPDATE ON public.pillar_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed pillars if empty
INSERT INTO public.pillars (key, name, tagline, variant, sort_order)
SELECT * FROM (VALUES
  ('customers','Customers & The Market','Growth Strategy | VoC | Sales Tunnel | Contracts | M&A','light',1),
  ('daily-tech','Daily Management Technical Services','Continuous Improvement · Front Line Leaders · Ops Planning, Infra & KPIs','light',2),
  ('daily-asset','Daily Management Asset Management','Portfolio · Resource Concentration · LT Growth & Drop Through','light',3),
  ('safety','Safety, Environment & Crisis','SMS | EHS | Facility | ERP | Cyber | BC Plan','dark',4),
  ('people','People','Attract/Develop/Retain | Coaching | Rosters | Training','dark',5),
  ('quality','Quality & Governance','FAA/Gov. | QCM | Risk | Compliance | Audits','dark',6),
  ('financial','Financial Results','Budgets | Financial Management & Performance | KPIs','light',7)
) v(key,name,tagline,variant,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.pillars);

-- ============ HUMAN CAPITAL: SKILLS CATALOG ============
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_categories TO authenticated;
GRANT ALL ON public.skill_categories TO service_role;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sc all" ON public.skill_categories;
CREATE POLICY "sc all" ON public.skill_categories FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.skill_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  is_certification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sk all" ON public.skills;
CREATE POLICY "sk all" ON public.skills FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

CREATE TABLE IF NOT EXISTS public.proficiency_levels (
  level int PRIMARY KEY,
  label text NOT NULL,
  color text NOT NULL,
  description text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proficiency_levels TO authenticated;
GRANT ALL ON public.proficiency_levels TO service_role;
ALTER TABLE public.proficiency_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pl all" ON public.proficiency_levels;
CREATE POLICY "pl all" ON public.proficiency_levels FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  department text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jr all" ON public.job_roles;
CREATE POLICY "jr all" ON public.job_roles FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

CREATE TABLE IF NOT EXISTS public.role_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.job_roles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level int NOT NULL CHECK (required_level BETWEEN 0 AND 4),
  UNIQUE(role_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_requirements TO authenticated;
GRANT ALL ON public.role_requirements TO service_role;
ALTER TABLE public.role_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rr all" ON public.role_requirements;
CREATE POLICY "rr all" ON public.role_requirements FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  role_id uuid REFERENCES public.job_roles(id) ON DELETE SET NULL,
  department text,
  hire_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emp all" ON public.employees;
CREATE POLICY "emp all" ON public.employees FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 4),
  assessed_on date,
  assessor text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_skills TO authenticated;
GRANT ALL ON public.employee_skills TO service_role;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "es all" ON public.employee_skills;
CREATE POLICY "es all" ON public.employee_skills FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS employee_skills_updated_at ON public.employee_skills;
CREATE TRIGGER employee_skills_updated_at BEFORE UPDATE ON public.employee_skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  name text NOT NULL,
  cert_number text,
  issued_on date,
  expires_on date,
  authority text,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert all" ON public.certifications;
CREATE POLICY "cert all" ON public.certifications FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS certifications_updated_at ON public.certifications;
CREATE TRIGGER certifications_updated_at BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.training_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  action_type text NOT NULL DEFAULT 'course',
  provider text,
  duration_hours numeric,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  target_level int CHECK (target_level BETWEEN 0 AND 4),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_actions TO authenticated;
GRANT ALL ON public.training_actions TO service_role;
ALTER TABLE public.training_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ta all" ON public.training_actions;
CREATE POLICY "ta all" ON public.training_actions FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));

CREATE TABLE IF NOT EXISTS public.development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level int NOT NULL DEFAULT 0 CHECK (current_level BETWEEN 0 AND 4),
  target_level int NOT NULL CHECK (target_level BETWEEN 0 AND 4),
  action_id uuid REFERENCES public.training_actions(id) ON DELETE SET NULL,
  target_date date,
  status text NOT NULL DEFAULT 'planned',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_plans TO authenticated;
GRANT ALL ON public.development_plans TO service_role;
ALTER TABLE public.development_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dp all" ON public.development_plans;
CREATE POLICY "dp all" ON public.development_plans FOR ALL TO authenticated
  USING (true) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'leader'));
DROP TRIGGER IF EXISTS development_plans_updated_at ON public.development_plans;
CREATE TRIGGER development_plans_updated_at BEFORE UPDATE ON public.development_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  address TEXT,
  faa_certificate_no TEXT,
  easa_approval_no TEXT,
  as9100_cert_no TEXT,
  quality_manager_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "os read" ON public.org_settings;
CREATE POLICY "os read" ON public.org_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "os write" ON public.org_settings;
CREATE POLICY "os write" ON public.org_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_org_settings_updated_at ON public.org_settings;
CREATE TRIGGER trg_org_settings_updated_at BEFORE UPDATE ON public.org_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed proficiency levels if empty
INSERT INTO public.proficiency_levels (level, label, color, description)
SELECT * FROM (VALUES
  (0, 'None', '#e5e7eb', 'No exposure'),
  (1, 'Trainee', '#fca5a5', 'Under close supervision'),
  (2, 'Assisted', '#fcd34d', 'Works with periodic guidance'),
  (3, 'Independent', '#86efac', 'Fully qualified independently'),
  (4, 'Expert', '#22c55e', 'Trainer / assessor / SME')
) v(level,label,color,description)
WHERE NOT EXISTS (SELECT 1 FROM public.proficiency_levels);

INSERT INTO public.org_settings (company_name)
SELECT '' WHERE NOT EXISTS (SELECT 1 FROM public.org_settings);
