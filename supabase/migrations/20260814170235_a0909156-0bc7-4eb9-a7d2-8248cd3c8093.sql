
create table public.eol_programs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  product_name text not null,
  platform text,
  family text,
  description text,
  phase smallint not null default 1 check (phase between 1 and 5),
  status text not null default 'planning',
  health text check (health in ('green','yellow','red')),
  eos_announce_date date,
  ltb_cutoff_date date,
  fts_date date,
  line_clear_date date,
  closeout_date date,
  reserve_budget numeric,
  lifetime_revenue numeric,
  currency text not null default 'USD',
  program_owner_id uuid,
  engineering_owner_id uuid,
  supply_chain_owner_id uuid,
  aftermarket_owner_id uuid,
  finance_owner_id uuid,
  notes text,
  archived_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eol_gate_checklist (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  program_id uuid not null references public.eol_programs(id) on delete cascade,
  phase smallint not null check (phase between 1 and 5),
  sort_order int not null default 0,
  label text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eol_readiness (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  program_id uuid not null references public.eol_programs(id) on delete cascade,
  domain text not null,
  deliverable text not null,
  owner_id uuid,
  rag text check (rag in ('green','yellow','red')),
  complete boolean not null default false,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eol_ltb_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  program_id uuid not null references public.eol_programs(id) on delete cascade,
  part_number text not null,
  description text,
  risk_tier text not null default 'cots',
  supplier text,
  forecast_qty numeric,
  ordered_qty numeric,
  consumed_qty numeric,
  unit_cost numeric,
  holding_strategy text not null default 'in_house',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eol_asset_disposition (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  program_id uuid not null references public.eol_programs(id) on delete cascade,
  asset_name text not null,
  asset_tag text,
  disposition text not null default 'undecided',
  book_value numeric,
  realized_value numeric,
  status text not null default 'open',
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.eol_customer_migration (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  program_id uuid not null references public.eol_programs(id) on delete cascade,
  customer text not null,
  current_product text,
  target_product text,
  notice_date date,
  status text not null default 'not_notified',
  revenue_at_risk numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.eol_programs to authenticated;
grant select, insert, update, delete on public.eol_gate_checklist to authenticated;
grant select, insert, update, delete on public.eol_readiness to authenticated;
grant select, insert, update, delete on public.eol_ltb_items to authenticated;
grant select, insert, update, delete on public.eol_asset_disposition to authenticated;
grant select, insert, update, delete on public.eol_customer_migration to authenticated;
grant all on public.eol_programs to service_role;
grant all on public.eol_gate_checklist to service_role;
grant all on public.eol_readiness to service_role;
grant all on public.eol_ltb_items to service_role;
grant all on public.eol_asset_disposition to service_role;
grant all on public.eol_customer_migration to service_role;

alter table public.eol_programs enable row level security;
alter table public.eol_gate_checklist enable row level security;
alter table public.eol_readiness enable row level security;
alter table public.eol_ltb_items enable row level security;
alter table public.eol_asset_disposition enable row level security;
alter table public.eol_customer_migration enable row level security;

do $$
declare t text;
begin
  foreach t in array array['eol_programs','eol_gate_checklist','eol_readiness','eol_ltb_items','eol_asset_disposition','eol_customer_migration'] loop
    execute format('create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id())', t || ' company read', t);
    execute format('create policy %I on public.%I for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id())', t || ' company write', t);
    execute format('create trigger set_company_id_%I before insert on public.%I for each row execute function public.tg_set_company_id()', t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('create trigger trg_enforce_write_access before insert or update or delete on public.%I for each row execute function public.enforce_write_access()', t);
    execute format('create trigger trg_prevent_template_write before insert or update or delete on public.%I for each row execute function public.prevent_template_write()', t);
    execute format('create index %I on public.%I (company_id)', 'idx_' || t || '_company', t);
  end loop;
end $$;

create index idx_eol_gate_checklist_program on public.eol_gate_checklist (program_id);
create index idx_eol_readiness_program on public.eol_readiness (program_id);
create index idx_eol_ltb_items_program on public.eol_ltb_items (program_id);
create index idx_eol_asset_disposition_program on public.eol_asset_disposition (program_id);
create index idx_eol_customer_migration_program on public.eol_customer_migration (program_id);

create or replace function public.tg_eol_seed_checklist()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  items text[][] := ARRAY[
    ARRAY['1','EOL business case signed off (margin erosion, obsolescence, regulatory shift or next-gen substitution)'],
    ARRAY['1','Cross-functional EOL team nominated (Engineering, Product Mgmt, Supply Chain, MRO, Legal/Compliance, Finance)'],
    ARRAY['1','Component commonality mapped across active product lines to avoid killing shared parts'],
    ARRAY['1','EOL reserve budget approved by Finance'],
    ARRAY['2','Formal End-of-Sale (EOS) notice issued to customers with replacement migration roadmap'],
    ARRAY['2','Last Time Buy demand model built (contracted spares, warranty obligations, historical MRO demand)'],
    ARRAY['2','Long-term service agreements (LTSAs) and supply obligations reviewed for compliance'],
    ARRAY['2','Customer migration plan agreed with named owners per account'],
    ARRAY['3','Final component purchase orders placed with Tier-1 / Tier-2 suppliers'],
    ARRAY['3','Supplier termination or transition agreements issued'],
    ARRAY['3','Single-source suppliers audited for long-term IP and tooling retention'],
    ARRAY['3','Production cell phase-out plan: floor space re-allocation, operator re-skilling, line decommission'],
    ARRAY['3','Short Interval Control (SIC) applied to final production runs'],
    ARRAY['4','Tooling and fixture disposition audited, catalogued and decided (repurpose / transfer / scrap)'],
    ARRAY['4','Core and Used Serviceable Material (USM) harvesting plan executed'],
    ARRAY['4','Production test rigs and conversion kits retained for repair stations'],
    ARRAY['4','IP and data lock: build records, FAI reports, CAD models, test software and technical publications archived'],
    ARRAY['5','Financial reconciliation: final scrap write-downs audited against the EOL reserve'],
    ARRAY['5','EHS and regulatory decommissioning complete (hazmat disposal, site closeout, notifications)'],
    ARRAY['5','Design-for-EOL feedback fed back to Engineering for current design projects'],
    ARRAY['5','Final gate sign-off and P&L closeout recorded']
  ];
  domains text[][] := ARRAY[
    ARRAY['Product Mgmt & Commercial','EOS/EOL notification records issued'],
    ARRAY['Product Mgmt & Commercial','Customer migration sign-offs collected'],
    ARRAY['Product Mgmt & Commercial','LTB demand forecast approved'],
    ARRAY['Manufacturing Engineering','Tooling disposition log complete'],
    ARRAY['Manufacturing Engineering','Floor space re-layout plan approved'],
    ARRAY['Manufacturing Engineering','Digital assembly archive complete'],
    ARRAY['Supply Chain & Sourcing','Supplier termination agreements executed'],
    ARRAY['Supply Chain & Sourcing','LTB inventory audit complete'],
    ARRAY['Supply Chain & Sourcing','Contract liability reconciliation complete'],
    ARRAY['Quality & Regulatory','Final EHS audit closed'],
    ARRAY['Quality & Regulatory','Regulatory notification receipts filed'],
    ARRAY['Quality & Regulatory','Compliance records preserved'],
    ARRAY['Aftermarket & MRO','Spares fulfilment strategy agreed'],
    ARRAY['Aftermarket & MRO','Repair capability transfer plan complete'],
    ARRAY['Aftermarket & MRO','Core / USM harvesting plan complete'],
    ARRAY['Finance','Reserve reconciliation report issued'],
    ARRAY['Finance','Scrap value realization recorded'],
    ARRAY['Finance','Final P&L sign-off']
  ];
  i int;
BEGIN
  FOR i IN 1 .. array_length(items, 1) LOOP
    INSERT INTO public.eol_gate_checklist (company_id, program_id, phase, sort_order, label)
    VALUES (NEW.company_id, NEW.id, items[i][1]::smallint, i, items[i][2]);
  END LOOP;
  FOR i IN 1 .. array_length(domains, 1) LOOP
    INSERT INTO public.eol_readiness (company_id, program_id, domain, deliverable, sort_order)
    VALUES (NEW.company_id, NEW.id, domains[i][1], domains[i][2], i);
  END LOOP;
  RETURN NEW;
END;
$function$;

create trigger eol_programs_seed after insert on public.eol_programs
for each row execute function public.tg_eol_seed_checklist();
