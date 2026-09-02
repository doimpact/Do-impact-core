
-- ============ Supply Chain (SPMS) ============

CREATE TABLE public.sc_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.sc_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  owner_id uuid,
  annual_spend numeric,
  supplier_count integer,
  market_assessment text,
  spend_analysis text,
  current_state text,
  future_state text,
  kpis text,
  strategy_status text NOT NULL DEFAULT 'draft',
  refresh_date date,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  governance text,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_risk_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_escalation_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  level_no integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  owner_role text,
  response_hours integer,
  required_actions text,
  closure_criteria text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_score_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  dimension text NOT NULL DEFAULT 'quality',
  weight_pct numeric NOT NULL DEFAULT 0,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_onboarding_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_contract_clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_review_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  cadence text,
  agenda text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  category_id uuid REFERENCES public.sc_categories(id) ON DELETE SET NULL,
  commodity_id uuid REFERENCES public.sc_categories(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES public.sc_segments(id) ON DELETE SET NULL,
  site text,
  country text,
  owner_id uuid,
  annual_spend numeric,
  sole_source boolean NOT NULL DEFAULT false,
  as9100 boolean NOT NULL DEFAULT false,
  nadcap boolean NOT NULL DEFAULT false,
  export_controlled boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, period_month)
);

CREATE TABLE public.sc_scorecard_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scorecard_id uuid NOT NULL REFERENCES public.sc_scorecards(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES public.sc_score_metrics(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scorecard_id, metric_id)
);

CREATE TABLE public.sc_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  risk_type_id uuid REFERENCES public.sc_risk_types(id) ON DELETE SET NULL,
  title text NOT NULL,
  likelihood integer NOT NULL DEFAULT 3,
  impact integer NOT NULL DEFAULT 3,
  mitigation text,
  owner_id uuid,
  review_date date,
  status text NOT NULL DEFAULT 'open',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  period date NOT NULL,
  available_units numeric,
  max_units numeric,
  demand_units numeric,
  unit text,
  bottleneck text,
  tooling_constraints text,
  labour_constraints text,
  investment_plan text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  contract_type text,
  start_date date,
  end_date date,
  pricing_model text,
  capacity_reservation text,
  escalation_mechanism text,
  review_date date,
  status text NOT NULL DEFAULT 'draft',
  clauses jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_onboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'todo',
  owner_id uuid,
  due_date date,
  completed_at timestamptz,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_development_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  year integer NOT NULL DEFAULT 2026,
  objective text NOT NULL,
  activities text,
  owner_id uuid,
  target_date date,
  status text NOT NULL DEFAULT 'not_started',
  benefit text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  review_type_id uuid REFERENCES public.sc_review_types(id) ON DELETE SET NULL,
  title text NOT NULL,
  review_date date,
  attendees text,
  notes text,
  decisions text,
  status text NOT NULL DEFAULT 'planned',
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_selection_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_id uuid REFERENCES public.sc_categories(id) ON DELETE SET NULL,
  need text,
  country text,
  stage text NOT NULL DEFAULT 'need',
  owner_id uuid,
  score numeric,
  decision text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_selection_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.sc_selection_candidates(id) ON DELETE CASCADE,
  seq integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  score numeric,
  notes text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  level_no integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  owner_id uuid,
  opened_at date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  actions text,
  closure_criteria text,
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sc_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.sc_suppliers(id) ON DELETE CASCADE,
  source_type text,
  source_id uuid,
  title text NOT NULL,
  owner_id uuid,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants, RLS, policies, triggers for every sc_ table
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sc_categories','sc_segments','sc_risk_types','sc_escalation_levels','sc_score_metrics',
    'sc_onboarding_templates','sc_contract_clauses','sc_review_types','sc_suppliers',
    'sc_scorecards','sc_scorecard_scores','sc_risks','sc_capacity','sc_contracts',
    'sc_onboarding_items','sc_development_plans','sc_reviews','sc_selection_candidates',
    'sc_selection_gates','sc_escalations','sc_actions'
  ] LOOP
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

CREATE INDEX sc_suppliers_company_idx ON public.sc_suppliers(company_id);
CREATE INDEX sc_scorecards_supplier_idx ON public.sc_scorecards(supplier_id, period_month);
CREATE INDEX sc_risks_supplier_idx ON public.sc_risks(supplier_id);
CREATE INDEX sc_escalations_company_idx ON public.sc_escalations(company_id, status);

-- Default reference lists for every workspace
CREATE OR REPLACE FUNCTION public.seed_supply_chain_defaults(_company uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.sc_segments WHERE company_id = _company) THEN RETURN; END IF;

  INSERT INTO public.sc_segments (company_id, name, description, governance, color, sort_order) VALUES
    (_company,'Strategic','High spend, critical technology or sole source','Quarterly business review + annual executive review','#ef4444',1),
    (_company,'Preferred','Good performance, moderate spend','Quarterly scorecard review','#22c55e',2),
    (_company,'Transactional','Commodity items, low complexity','Exception based','#64748b',3),
    (_company,'High Risk','Poor quality, financial or capacity concerns','Monthly recovery review','#f59e0b',4);

  INSERT INTO public.sc_categories (company_id, name, strategy_status, sort_order) VALUES
    (_company,'Machined Components','draft',1),
    (_company,'Sheet Metal','draft',2),
    (_company,'Castings','draft',3),
    (_company,'Forgings','draft',4),
    (_company,'Electronics','draft',5),
    (_company,'Composite Parts','draft',6),
    (_company,'Raw Material','draft',7),
    (_company,'Surface Treatments','draft',8),
    (_company,'Special Processes','draft',9),
    (_company,'Logistics','draft',10);

  INSERT INTO public.sc_risk_types (company_id, name, sort_order) VALUES
    (_company,'Financial',1),(_company,'Capacity',2),(_company,'Geography',3),(_company,'Political',4),
    (_company,'Cyber',5),(_company,'Natural disaster',6),(_company,'Single source',7),
    (_company,'Obsolescence',8),(_company,'Special process',9),(_company,'Export controls',10);

  INSERT INTO public.sc_escalation_levels (company_id, level_no, name, owner_role, response_hours, required_actions, closure_criteria, sort_order) VALUES
    (_company,0,'L0 — Buyer','Buyer',24,'Chase order, confirm new date','Delivery confirmed',1),
    (_company,1,'L1 — Commodity Manager','Commodity Manager',48,'Root cause on repeated lateness, written recovery commitment','Two consecutive on-time deliveries',2),
    (_company,2,'L2 — Supply Chain Manager','Supply Chain Manager',72,'Formal recovery plan, executive supplier meeting','Recovery plan on track for 4 weeks',3),
    (_company,3,'L3 — Director','Director',120,'Customer impact assessment, senior leadership review','Customer risk removed',4),
    (_company,4,'L4 — Executive Steering','Executive Steering Committee',168,'Commercial intervention, resourcing or exit strategy','Steering committee closure',5);

  INSERT INTO public.sc_score_metrics (company_id, name, dimension, weight_pct, sort_order) VALUES
    (_company,'PPM','quality',15,1),
    (_company,'Escapes / NCRs','quality',10,2),
    (_company,'Corrective action closure','quality',10,3),
    (_company,'OTIF','delivery',20,4),
    (_company,'Promise date accuracy','delivery',10,5),
    (_company,'Lead time performance','delivery',5,6),
    (_company,'Cost reduction','commercial',5,7),
    (_company,'Invoice accuracy','commercial',5,8),
    (_company,'Engineering support','engineering',10,9),
    (_company,'Risk profile','risk',10,10);

  INSERT INTO public.sc_onboarding_templates (company_id, label, sort_order) VALUES
    (_company,'Quality approvals (AS9100 / NADCAP)',1),
    (_company,'ERP & vendor master setup',2),
    (_company,'PPAP / FAI submitted',3),
    (_company,'Engineering documentation issued',4),
    (_company,'Supplier portal access',5),
    (_company,'Packaging standard agreed',6),
    (_company,'Logistics & Incoterms agreed',7),
    (_company,'EDI / data exchange live',8),
    (_company,'Forecast sharing set up',9),
    (_company,'Training completed',10);

  INSERT INTO public.sc_contract_clauses (company_id, label, sort_order) VALUES
    (_company,'Master supply agreement',1),(_company,'Quality clauses',2),(_company,'IP clauses',3),
    (_company,'Delivery commitments',4),(_company,'Forecast obligations',5),(_company,'Pricing model',6),
    (_company,'Escalation mechanism',7),(_company,'Force majeure',8),(_company,'Capacity reservation',9),
    (_company,'Recovery obligations',10),(_company,'Continuous improvement commitments',11),(_company,'KPIs',12);

  INSERT INTO public.sc_review_types (company_id, name, cadence, agenda, sort_order) VALUES
    (_company,'Operational review','monthly','Late orders, quality escapes, recovery plans',1),
    (_company,'Supplier business review','quarterly','KPIs, capacity, forecast, technology, investment, risk, actions',2),
    (_company,'Executive review','annual','Long-term strategy, contracts, growth, investment, innovation, relationship',3),
    (_company,'Commodity review','monthly','Category spend, supplier mix, savings, risk',4),
    (_company,'Supply chain risk review','monthly','Scorecards, forecast, shortages, capacity, financial alerts → IBP inputs',5);
END $$;

CREATE OR REPLACE FUNCTION public.tg_company_seed_supply_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_supply_chain_defaults(NEW.id);
  RETURN NEW;
END $$;

CREATE TRIGGER companies_seed_supply_chain
AFTER INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.tg_company_seed_supply_chain();

DO $$
DECLARE c uuid;
BEGIN
  ALTER TABLE public.sc_segments DISABLE TRIGGER sc_segments_no_template;
  ALTER TABLE public.sc_categories DISABLE TRIGGER sc_categories_no_template;
  ALTER TABLE public.sc_risk_types DISABLE TRIGGER sc_risk_types_no_template;
  ALTER TABLE public.sc_escalation_levels DISABLE TRIGGER sc_escalation_levels_no_template;
  ALTER TABLE public.sc_score_metrics DISABLE TRIGGER sc_score_metrics_no_template;
  ALTER TABLE public.sc_onboarding_templates DISABLE TRIGGER sc_onboarding_templates_no_template;
  ALTER TABLE public.sc_contract_clauses DISABLE TRIGGER sc_contract_clauses_no_template;
  ALTER TABLE public.sc_review_types DISABLE TRIGGER sc_review_types_no_template;
  FOR c IN SELECT id FROM public.companies LOOP
    PERFORM public.seed_supply_chain_defaults(c);
  END LOOP;
  ALTER TABLE public.sc_segments ENABLE TRIGGER sc_segments_no_template;
  ALTER TABLE public.sc_categories ENABLE TRIGGER sc_categories_no_template;
  ALTER TABLE public.sc_risk_types ENABLE TRIGGER sc_risk_types_no_template;
  ALTER TABLE public.sc_escalation_levels ENABLE TRIGGER sc_escalation_levels_no_template;
  ALTER TABLE public.sc_score_metrics ENABLE TRIGGER sc_score_metrics_no_template;
  ALTER TABLE public.sc_onboarding_templates ENABLE TRIGGER sc_onboarding_templates_no_template;
  ALTER TABLE public.sc_contract_clauses ENABLE TRIGGER sc_contract_clauses_no_template;
  ALTER TABLE public.sc_review_types ENABLE TRIGGER sc_review_types_no_template;
END $$;
