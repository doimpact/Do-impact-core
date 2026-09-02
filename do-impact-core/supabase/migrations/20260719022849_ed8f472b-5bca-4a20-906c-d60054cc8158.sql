
-- Reusable updated_at trigger (idempotent) — reuse existing tg_set_updated_at
-- (already defined in schema).

-- =========================================================
-- ACCOUNTS
-- =========================================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  address TEXT,
  tier TEXT CHECK (tier IS NULL OR tier IN ('tier_1','tier_2','tier_3')),
  notes TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team accounts all" ON public.accounts FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX accounts_name_idx ON public.accounts (lower(name));

-- =========================================================
-- CONTACTS
-- =========================================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  decision_role TEXT,
  influence TEXT CHECK (influence IS NULL OR influence IN ('low','medium','high')),
  relationship_strength TEXT CHECK (relationship_strength IS NULL OR relationship_strength IN ('weak','neutral','strong','champion')),
  relationship_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team contacts all" ON public.contacts FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX contacts_account_idx ON public.contacts (account_id);

-- =========================================================
-- INTERACTIONS (with FTS)
-- =========================================================
CREATE TYPE public.interaction_type AS ENUM ('call','email','meeting','note','update');

CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type public.interaction_type NOT NULL DEFAULT 'note',
  subject TEXT,
  body TEXT,
  body_text TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_id UUID REFERENCES auth.users ON DELETE SET NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(subject,'') || ' ' || coalesce(body_text,''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO service_role;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team interactions all" ON public.interactions FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER interactions_updated_at BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX interactions_account_idx ON public.interactions (account_id, occurred_at DESC);
CREATE INDEX interactions_search_idx ON public.interactions USING GIN (search_vector);

CREATE OR REPLACE FUNCTION public.tg_interaction_body_text()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.body_text := regexp_replace(coalesce(NEW.body,''), '<[^>]+>', ' ', 'g');
  NEW.body_text := regexp_replace(NEW.body_text, '\s+', ' ', 'g');
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.tg_interaction_body_text() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER interactions_body_text BEFORE INSERT OR UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_interaction_body_text();

-- =========================================================
-- OPPORTUNITIES
-- =========================================================
CREATE TYPE public.opportunity_stage AS ENUM ('prospect','proposal','won','lost');

CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  stage public.opportunity_stage NOT NULL DEFAULT 'prospect',
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  probability INTEGER NOT NULL DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  source TEXT,
  notes TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team opportunities all" ON public.opportunities FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX opportunities_account_idx ON public.opportunities (account_id);
CREATE INDEX opportunities_archived_idx ON public.opportunities (archived);

-- =========================================================
-- CONTRACTS
-- =========================================================
CREATE TYPE public.contract_status AS ENUM ('draft','active','expired','terminated','renewed');

CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  contract_number TEXT,
  title TEXT NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'draft',
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  signed_date DATE,
  document_url TEXT,
  notes TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team contracts all" ON public.contracts FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX contracts_account_idx ON public.contracts (account_id);

-- =========================================================
-- STAKEHOLDER TOUCHPOINTS
-- =========================================================
CREATE TABLE public.stakeholder_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'meeting' CHECK (type IN ('call','email','meeting','note','update')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','completed','cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  subject TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stakeholder_touchpoints TO authenticated;
GRANT ALL ON public.stakeholder_touchpoints TO service_role;
ALTER TABLE public.stakeholder_touchpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team touchpoints all" ON public.stakeholder_touchpoints FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER touchpoints_updated_at BEFORE UPDATE ON public.stakeholder_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX touchpoints_contact_idx ON public.stakeholder_touchpoints (contact_id, scheduled_at DESC);
CREATE INDEX touchpoints_account_idx ON public.stakeholder_touchpoints (account_id, scheduled_at DESC);

-- =========================================================
-- QUOTES
-- =========================================================
CREATE TYPE public.quote_status AS ENUM ('draft','sent','negotiating','approved','closed_won','closed_lost');
CREATE SEQUENCE public.quote_seq START 1000;

CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.quote_status NOT NULL DEFAULT 'draft',
  expected_close_date DATE,
  delivery_date DATE,
  notes TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team quotes all" ON public.quotes FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX quotes_account_idx ON public.quotes (account_id);
CREATE INDEX quotes_status_idx ON public.quotes (status);
CREATE INDEX quotes_delivery_idx ON public.quotes (delivery_date);
CREATE INDEX quotes_close_idx ON public.quotes (expected_close_date);

CREATE OR REPLACE FUNCTION public.tg_quote_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number := 'Q-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.quote_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.tg_quote_number() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER quotes_number BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.tg_quote_number();

-- =========================================================
-- GROWTH TARGETS + BOOKED BACKLOG (36-month plan)
-- =========================================================
CREATE TABLE public.growth_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.growth_targets TO authenticated;
GRANT ALL ON public.growth_targets TO service_role;
ALTER TABLE public.growth_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team targets all" ON public.growth_targets FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER growth_targets_updated_at BEFORE UPDATE ON public.growth_targets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.booked_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booked_backlog TO authenticated;
GRANT ALL ON public.booked_backlog TO service_role;
ALTER TABLE public.booked_backlog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team backlog all" ON public.booked_backlog FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TRIGGER booked_backlog_updated_at BEFORE UPDATE ON public.booked_backlog
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed the 36 months (current year + next 2)
INSERT INTO public.growth_targets (year, month, amount)
SELECT y, m, 0
FROM generate_series(extract(year from now())::int, extract(year from now())::int + 2) AS y,
     generate_series(1,12) AS m
ON CONFLICT DO NOTHING;

INSERT INTO public.booked_backlog (year, month, amount)
SELECT y, m, 0
FROM generate_series(extract(year from now())::int, extract(year from now())::int + 2) AS y,
     generate_series(1,12) AS m
ON CONFLICT DO NOTHING;
