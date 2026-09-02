-- 1. Tables
CREATE TABLE public.bid_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  reference text,
  title text NOT NULL,
  customer_name text,
  product_program text,
  est_revenue numeric NOT NULL DEFAULT 0,
  est_volume text,
  currency text NOT NULL DEFAULT 'USD',
  bid_due_date date,
  program_timing text,
  strategic_rationale text,
  capital_tooling text,
  owner_name text,
  owner_id uuid,
  current_gate integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'in_review',
  archived boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bid_review_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.bid_reviews(id) ON DELETE CASCADE,
  gate integer NOT NULL,
  decision text,
  decided_on date,
  approver text,
  notes text,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, gate)
);

CREATE TABLE public.bid_review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.bid_reviews(id) ON DELETE CASCADE,
  kind text NOT NULL,
  ref text,
  title text NOT NULL,
  detail text,
  owner_name text,
  status text NOT NULL DEFAULT 'open',
  due_date date,
  probability integer,
  impact integer,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bid_reviews_company_idx ON public.bid_reviews(company_id);
CREATE INDEX bid_review_gates_review_idx ON public.bid_review_gates(review_id);
CREATE INDEX bid_review_items_review_idx ON public.bid_review_items(review_id, kind);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bid_reviews TO authenticated;
GRANT ALL ON public.bid_reviews TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bid_review_gates TO authenticated;
GRANT ALL ON public.bid_review_gates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bid_review_items TO authenticated;
GRANT ALL ON public.bid_review_items TO service_role;

-- 3. RLS
ALTER TABLE public.bid_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_review_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_review_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "bid_reviews_company_scope" ON public.bid_reviews FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "bid_review_gates_company_scope" ON public.bid_review_gates FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY "bid_review_items_company_scope" ON public.bid_review_items FOR ALL TO authenticated
  USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());

-- 5. updated_at triggers
CREATE TRIGGER bid_reviews_set_updated_at BEFORE UPDATE ON public.bid_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bid_review_gates_set_updated_at BEFORE UPDATE ON public.bid_review_gates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bid_review_items_set_updated_at BEFORE UPDATE ON public.bid_review_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. TitanScale Template worked examples
INSERT INTO public.bid_reviews (id, company_id, account_id, reference, title, customer_name, product_program, est_revenue, est_volume, currency, bid_due_date, program_timing, strategic_rationale, capital_tooling, owner_name, current_gate, status, notes)
VALUES
 ('b1d00000-0000-0000-0000-000000000001','9d12cf46-98e4-40ca-aed4-bcc95257d8b5','30000000-0000-0000-0000-000000000001','BR-2026-014','NorthStar Aero — 5-year structural bracket LTA','NorthStar Aero Systems','Structural brackets, 4 part families',18400000,'~24,000 pcs/yr','USD','2026-09-18','Award Q4 2026, PPAP Q2 2027, SOP Q3 2027','Anchors the 5-axis cell load through 2031 and locks a second aerostructures platform.','2 dedicated fixtures + 1 CMM program set, est. $340k','D. Kaur',3,'in_review','Customer contract draft under review. Two material exceptions open on liability and tooling recovery.'),
 ('b1d00000-0000-0000-0000-000000000002','9d12cf46-98e4-40ca-aed4-bcc95257d8b5','30000000-0000-0000-0000-000000000003','BR-2026-009','Helios Defense — fixed-price actuator housings','Helios Defense Aviation','Actuator housing program HD-7',6250000,'3,100 pcs/yr','USD','2026-04-24','Awarded Jun 2026, SOP Oct 2026','Defence diversification, higher margin than commercial baseline.','Existing capacity, $85k gauging','M. Reyes',5,'handed_off','Signed and handed off. Monitoring material escalation exposure on fixed price.');

INSERT INTO public.bid_review_gates (company_id, review_id, gate, decision, decided_on, approver, notes, checklist) VALUES
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001',1,'go_with_conditions','2026-07-02','SLT — J. Alvarez','Conditional on confirming 5-axis capacity from 2027 and capping liability at contract value.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001',2,'approved','2026-08-11','CFO — L. Chen','Quote submitted at 27.4% contribution margin including tooling amortisation.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001',3,NULL,NULL,NULL,'Legal review in progress. Termination for convenience and IP clauses still open.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002',1,'go','2026-02-10','SLT — J. Alvarez','Strong strategic fit, existing process capability.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002',2,'approved','2026-04-18','CFO — L. Chen','Approved at 31% margin with a 6% material escalation assumption.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002',3,'approved','2026-06-05','Legal — S. Whitfield','Liability capped at 100% of contract value, warranty 24 months.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002',4,'completed','2026-06-16','PM — M. Reyes','Handoff completed with program team, all registers transferred.','{}'::jsonb),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002',5,NULL,NULL,NULL,'Quarterly program review cadence in place.','{}'::jsonb);

INSERT INTO public.bid_review_items (company_id, review_id, kind, ref, title, detail, owner_name, status, due_date, probability, impact, data, sort) VALUES
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','requirement','REQ-001','First article per AS9102 Rev C','Source: NSA-SPEC-4471 §6.2. Applies to all four part families.','Quality — P. Osei','compliant',NULL,NULL,NULL,'{"function":"Quality","source":"NSA-SPEC-4471","cost_impact":"Included","schedule_impact":"None","clarification":false}'::jsonb,1),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','requirement','REQ-002','48-hour AOG response on spares','Requires held stock and out-of-hours cover not currently in place.','Operations — T. Brandt','exception',NULL,NULL,NULL,'{"function":"Operations","source":"Draft LTA §11","cost_impact":"+$120k/yr","schedule_impact":"None","clarification":true}'::jsonb,2),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','requirement','REQ-003','Customer-owned tooling, no recovery on termination','Company position is recovery of unamortised tooling.','Finance — L. Chen','not_compliant',NULL,NULL,NULL,'{"function":"Finance","source":"Draft LTA §17","cost_impact":"Up to $340k exposure","schedule_impact":"None","clarification":true}'::jsonb,3),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','assumption_exception','EX-001','Uncapped liability in draft §14','Customer requires unlimited liability for consequential damages.','Legal — S. Whitfield','negotiating','2026-09-30',NULL,NULL,'{"company_concern":"Unlimited consequential damages exposure","business_impact":"Potential loss far exceeding programme value","proposed_position":"Cap at 100% of trailing 12-month contract value","fallback":"Cap at 200%, consequential damages excluded","approval_required":"CEO"}'::jsonb,1),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','assumption_exception','EX-002','Tooling recovery on termination for convenience','Draft gives no recovery of unamortised tooling or committed material.','Finance — L. Chen','open','2026-09-30',NULL,NULL,'{"company_concern":"$340k tooling plus long-lead billet at risk","business_impact":"Direct write-off","proposed_position":"Recovery of unamortised tooling and committed material","fallback":"Amortisation accelerated into unit price","approval_required":"CFO"}'::jsonb,2),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','assumption_exception','EX-003','Volumes are forecast, not firm','Pricing assumes 24,000 pcs/yr; contract commits to no minimum.','Sales — D. Kaur','accepted',NULL,NULL,NULL,'{"company_concern":"Margin erodes below 18,000 pcs/yr","business_impact":"Under-absorption of the 5-axis cell","proposed_position":"Price break table by annual volume band","fallback":"Annual price review clause","approval_required":"CFO"}'::jsonb,3),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','risk','R-001','Fixed price against volatile titanium billet','5-year term with no escalation mechanism in the draft.','Supply chain — A. Novak','open','2026-09-30',4,5,'{"category":"Commercial","mitigation":"Index-linked escalation clause plus 12-month supplier price agreement","residual":"Medium","management_approval":"CFO"}'::jsonb,1),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','risk','R-002','5-axis capacity from 2027','Programme ramp overlaps the existing NorthStar wing-rib load.','Operations — T. Brandt','mitigating','2026-10-15',3,4,'{"category":"Operational","mitigation":"Capacity model updated in SIOP; second shift from Q1 2027","residual":"Low","management_approval":"COO"}'::jsonb,2),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000001','risk','R-003','Unrecoverable tooling on termination','Linked to EX-002.','Finance — L. Chen','open','2026-09-30',3,4,'{"category":"Contractual","mitigation":"Negotiate recovery clause or accelerate amortisation","residual":"Medium","management_approval":"CEO"}'::jsonb,3),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002','risk','R-101','Material escalation on fixed price','6% assumption vs 9% actual on aluminium in H1.','Supply chain — A. Novak','mitigating','2026-09-30',3,3,'{"category":"Commercial","mitigation":"Forward-buy 6 months of billet; review at next program review","residual":"Medium","management_approval":"CFO"}'::jsonb,1),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002','ongoing','CR-001','ECN 4471-B — wall thickness change','Customer engineering change received 2026-08-04.','PM — M. Reyes','open','2026-09-12',NULL,NULL,'{"determination":"Revised quotation","trigger":"Engineering change","outcome":"Requote issued; awaiting customer PO amendment"}'::jsonb,1),
 ('9d12cf46-98e4-40ca-aed4-bcc95257d8b5','b1d00000-0000-0000-0000-000000000002','ongoing','CR-002','Volume increase +18% for 2027','Customer forecast update.','Sales — D. Kaur','closed',NULL,NULL,NULL,'{"determination":"Revalidation of technical feasibility","trigger":"Volume change","outcome":"Capacity confirmed in SIOP, no price change"}'::jsonb,2);