CREATE TYPE public.five_whys_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE public.fishbone_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE public.dmaic_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE public.dmaic_phase AS ENUM ('define', 'measure', 'analyze', 'improve', 'control');

CREATE TABLE public.five_whys_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    title text NOT NULL,
    status public.five_whys_status NOT NULL DEFAULT 'draft',
    problem_statement text,
    why_1 text,
    why_2 text,
    why_3 text,
    why_4 text,
    why_5 text,
    root_cause text,
    corrective_action text,
    archived_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.five_whys_reports TO authenticated;
GRANT ALL ON public.five_whys_reports TO service_role;

ALTER TABLE public.five_whys_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "five_whys company read" ON public.five_whys_reports
    FOR SELECT TO authenticated USING (company_id = current_company_id());

CREATE POLICY "five_whys insert" ON public.five_whys_reports
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND company_id = current_company_id());

CREATE POLICY "five_whys update" ON public.five_whys_reports
    FOR UPDATE TO authenticated
    USING (company_id = current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin') OR has_role(auth.uid(), company_id, 'leader')))
    WITH CHECK (company_id = current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin') OR has_role(auth.uid(), company_id, 'leader')));

CREATE POLICY "five_whys delete" ON public.five_whys_reports
    FOR DELETE TO authenticated
    USING (company_id = current_company_id() AND (created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin')));

CREATE POLICY "five_whys company scope" ON public.five_whys_reports
    AS RESTRICTIVE USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TABLE public.fishbone_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    title text NOT NULL,
    status public.fishbone_status NOT NULL DEFAULT 'draft',
    problem_statement text,
    categories jsonb NOT NULL DEFAULT '{}',
    archived_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fishbone_reports TO authenticated;
GRANT ALL ON public.fishbone_reports TO service_role;

ALTER TABLE public.fishbone_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fishbone company read" ON public.fishbone_reports
    FOR SELECT TO authenticated USING (company_id = current_company_id());

CREATE POLICY "fishbone insert" ON public.fishbone_reports
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND company_id = current_company_id());

CREATE POLICY "fishbone update" ON public.fishbone_reports
    FOR UPDATE TO authenticated
    USING (company_id = current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin') OR has_role(auth.uid(), company_id, 'leader')))
    WITH CHECK (company_id = current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin') OR has_role(auth.uid(), company_id, 'leader')));

CREATE POLICY "fishbone delete" ON public.fishbone_reports
    FOR DELETE TO authenticated
    USING (company_id = current_company_id() AND (created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin')));

CREATE POLICY "fishbone company scope" ON public.fishbone_reports
    AS RESTRICTIVE USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TABLE public.dmaic_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    title text NOT NULL,
    status public.dmaic_status NOT NULL DEFAULT 'draft',
    phase public.dmaic_phase NOT NULL DEFAULT 'define',
    problem_statement text,
    goal text,
    measure_summary text,
    analyze_summary text,
    improve_summary text,
    control_summary text,
    metrics text,
    archived_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dmaic_projects TO authenticated;
GRANT ALL ON public.dmaic_projects TO service_role;

ALTER TABLE public.dmaic_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dmaic company read" ON public.dmaic_projects
    FOR SELECT TO authenticated USING (company_id = current_company_id());

CREATE POLICY "dmaic insert" ON public.dmaic_projects
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND company_id = current_company_id());

CREATE POLICY "dmaic update" ON public.dmaic_projects
    FOR UPDATE TO authenticated
    USING (company_id = current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin') OR has_role(auth.uid(), company_id, 'leader')))
    WITH CHECK (company_id = current_company_id() AND (owner_id = auth.uid() OR created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin') OR has_role(auth.uid(), company_id, 'leader')));

CREATE POLICY "dmaic delete" ON public.dmaic_projects
    FOR DELETE TO authenticated
    USING (company_id = current_company_id() AND (created_by = auth.uid() OR has_role(auth.uid(), company_id, 'admin')));

CREATE POLICY "dmaic company scope" ON public.dmaic_projects
    AS RESTRICTIVE USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

CREATE TRIGGER five_whys_updated_at BEFORE UPDATE ON public.five_whys_reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER fishbone_updated_at BEFORE UPDATE ON public.fishbone_reports FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER dmaic_updated_at BEFORE UPDATE ON public.dmaic_projects FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER trg_prevent_template_five_whys BEFORE INSERT OR DELETE OR UPDATE ON public.five_whys_reports FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER trg_prevent_template_fishbone BEFORE INSERT OR DELETE OR UPDATE ON public.fishbone_reports FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();
CREATE TRIGGER trg_prevent_template_dmaic BEFORE INSERT OR DELETE OR UPDATE ON public.dmaic_projects FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write();

CREATE INDEX five_whys_reports_company_id_idx ON public.five_whys_reports(company_id);
CREATE INDEX fishbone_reports_company_id_idx ON public.fishbone_reports(company_id);
CREATE INDEX dmaic_projects_company_id_idx ON public.dmaic_projects(company_id);