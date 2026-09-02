CREATE TABLE public.en_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.en_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.en_models(id) ON DELETE CASCADE,
  layer text NOT NULL DEFAULT 'capability',
  node_type text NOT NULL DEFAULT 'capability',
  label text NOT NULL,
  pillar text,
  owner_id uuid,
  owner_label text,
  criticality numeric NOT NULL DEFAULT 0.5,
  health text,
  notes text,
  source_table text,
  source_id uuid,
  x numeric,
  y numeric,
  pinned boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.en_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.en_models(id) ON DELETE CASCADE,
  from_node uuid NOT NULL REFERENCES public.en_nodes(id) ON DELETE CASCADE,
  to_node uuid NOT NULL REFERENCES public.en_nodes(id) ON DELETE CASCADE,
  link_type text NOT NULL DEFAULT 'information',
  strength numeric NOT NULL DEFAULT 0.6,
  lag_weeks numeric NOT NULL DEFAULT 0,
  polarity text NOT NULL DEFAULT 'S',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.en_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.en_models(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  source_node uuid REFERENCES public.en_nodes(id) ON DELETE SET NULL,
  shock_pct numeric NOT NULL DEFAULT 15,
  direction text NOT NULL DEFAULT 'increase',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['en_models','en_nodes','en_links','en_scenarios'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))
      WITH CHECK ((company_id = public.current_company_id()) AND public.is_company_member(company_id, auth.uid()))$f$, t || '_company_all', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_company_id()', t || '_set_company', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t || '_set_updated', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_write_access()', t || '_write_access', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.prevent_template_write()', t || '_no_template', t);
  END LOOP;
END $$;

CREATE INDEX en_nodes_model_idx ON public.en_nodes(model_id);
CREATE INDEX en_links_model_idx ON public.en_links(model_id);
CREATE INDEX en_scenarios_model_idx ON public.en_scenarios(model_id);
CREATE INDEX en_models_company_idx ON public.en_models(company_id);