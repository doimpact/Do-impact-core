create table public.apqp_projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id) on delete cascade,
  title text not null,
  customer text,
  account_id uuid references public.accounts(id) on delete set null,
  part_number text,
  part_name text,
  program text,
  current_phase integer not null default 1 check (current_phase between 1 and 5),
  target_ppap_date date,
  owner text,
  status text not null default 'active' check (status in ('active','on_hold','complete','archived')),
  pfmea_study_id uuid references public.pfmea_studies(id) on delete set null,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

grant select, insert, update, delete on public.apqp_projects to authenticated;
grant all on public.apqp_projects to service_role;

alter table public.apqp_projects enable row level security;

create policy "apqp_projects_company_scope" on public.apqp_projects
  for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create index apqp_projects_company_idx on public.apqp_projects (company_id);
create trigger apqp_projects_updated_at before update on public.apqp_projects
  for each row execute function public.tg_set_updated_at();

create table public.apqp_phase_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id) on delete cascade,
  project_id uuid not null references public.apqp_projects(id) on delete cascade,
  phase integer not null check (phase between 1 and 5),
  sort_order integer not null default 0,
  label text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','complete','na')),
  evidence text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.apqp_phase_items to authenticated;
grant all on public.apqp_phase_items to service_role;

alter table public.apqp_phase_items enable row level security;

create policy "apqp_phase_items_company_scope" on public.apqp_phase_items
  for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create index apqp_phase_items_project_idx on public.apqp_phase_items (project_id, phase, sort_order);
create trigger apqp_phase_items_updated_at before update on public.apqp_phase_items
  for each row execute function public.tg_set_updated_at();

create or replace function public.tg_apqp_seed_checklist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.apqp_phase_items (company_id, project_id, phase, sort_order, label) values
    (new.company_id, new.id, 1, 1, 'Voice of Customer inputs collected'),
    (new.company_id, new.id, 1, 2, 'Business plan / marketing strategy reviewed'),
    (new.company_id, new.id, 1, 3, 'Product / process assumptions documented'),
    (new.company_id, new.id, 1, 4, 'Reliability and quality goals set'),
    (new.company_id, new.id, 1, 5, 'Preliminary bill of material'),
    (new.company_id, new.id, 1, 6, 'Preliminary process flow chart'),
    (new.company_id, new.id, 1, 7, 'Preliminary special characteristics list'),
    (new.company_id, new.id, 1, 8, 'Management support confirmed'),
    (new.company_id, new.id, 2, 1, 'DFMEA completed'),
    (new.company_id, new.id, 2, 2, 'Design for manufacturability review'),
    (new.company_id, new.id, 2, 3, 'Design verification plan & report (DVP&R)'),
    (new.company_id, new.id, 2, 4, 'Drawings and specifications released'),
    (new.company_id, new.id, 2, 5, 'Prototype control plan'),
    (new.company_id, new.id, 2, 6, 'Prototype builds completed'),
    (new.company_id, new.id, 2, 7, 'Engineering change log maintained'),
    (new.company_id, new.id, 3, 1, 'Process flow diagram finalized'),
    (new.company_id, new.id, 3, 2, 'PFMEA completed'),
    (new.company_id, new.id, 3, 3, 'Pre-launch control plan'),
    (new.company_id, new.id, 3, 4, 'Work instructions / operator aids'),
    (new.company_id, new.id, 3, 5, 'MSA plan defined'),
    (new.company_id, new.id, 3, 6, 'Packaging specifications'),
    (new.company_id, new.id, 3, 7, 'Floor plan and material flow verified'),
    (new.company_id, new.id, 4, 1, 'PPAP: Design records'),
    (new.company_id, new.id, 4, 2, 'PPAP: Engineering change documents'),
    (new.company_id, new.id, 4, 3, 'PPAP: Customer engineering approval'),
    (new.company_id, new.id, 4, 4, 'PPAP: DFMEA'),
    (new.company_id, new.id, 4, 5, 'PPAP: Process flow diagrams'),
    (new.company_id, new.id, 4, 6, 'PPAP: PFMEA'),
    (new.company_id, new.id, 4, 7, 'PPAP: Control plan'),
    (new.company_id, new.id, 4, 8, 'PPAP: MSA studies'),
    (new.company_id, new.id, 4, 9, 'PPAP: Dimensional results'),
    (new.company_id, new.id, 4, 10, 'PPAP: Material / performance test results'),
    (new.company_id, new.id, 4, 11, 'PPAP: Initial process studies (Cpk/Ppk)'),
    (new.company_id, new.id, 4, 12, 'PPAP: Qualified laboratory documentation'),
    (new.company_id, new.id, 4, 13, 'PPAP: Appearance approval report'),
    (new.company_id, new.id, 4, 14, 'PPAP: Sample production parts'),
    (new.company_id, new.id, 4, 15, 'PPAP: Master sample'),
    (new.company_id, new.id, 4, 16, 'PPAP: Checking aids'),
    (new.company_id, new.id, 4, 17, 'PPAP: Customer-specific requirements'),
    (new.company_id, new.id, 4, 18, 'PPAP: Part Submission Warrant (PSW)'),
    (new.company_id, new.id, 4, 19, 'Production trial run completed'),
    (new.company_id, new.id, 5, 1, 'SPC / Cpk monitoring in place'),
    (new.company_id, new.id, 5, 2, 'Variation reduction actions identified'),
    (new.company_id, new.id, 5, 3, 'Customer feedback loop active'),
    (new.company_id, new.id, 5, 4, 'Lessons learned captured to Problem Solver');
  return new;
end;
$$;

create trigger apqp_projects_seed_checklist after insert on public.apqp_projects
  for each row execute function public.tg_apqp_seed_checklist();

-- TitanScale Template example: Helios bracket automotive transfer program, Phase 3
insert into public.apqp_projects (
  id, company_id, title, customer, account_id, part_number, part_name, program,
  current_phase, target_ppap_date, owner, status, pfmea_study_id, notes
) values (
  'a9d00000-0000-0000-0000-000000000001',
  '9d12cf46-98e4-40ca-aed4-bcc95257d8b5',
  'Helios bracket — automotive transfer program',
  'Helios Defense Aviation',
  '30000000-0000-0000-0000-000000000003',
  'HLX-BRK-2041',
  'Machined titanium mounting bracket',
  'Helios 2026 transfer',
  3,
  '2026-11-15',
  'J. Smith',
  'active',
  '142f20fe-2ac2-4689-84c4-7ef47f50d0c9',
  'Customer requires full AIAG APQP with Level 3 PPAP. Process design in progress.'
);

update public.apqp_phase_items set status = 'complete', completed_at = now() - interval '20 days'
where project_id = 'a9d00000-0000-0000-0000-000000000001' and phase = 1;

update public.apqp_phase_items set status = 'complete', completed_at = now() - interval '9 days'
where project_id = 'a9d00000-0000-0000-0000-000000000001' and phase = 2 and sort_order in (1,2,4,5);
update public.apqp_phase_items set status = 'in_progress'
where project_id = 'a9d00000-0000-0000-0000-000000000001' and phase = 2 and sort_order = 3;

update public.apqp_phase_items set status = 'in_progress', evidence = 'PFMEA HLX-BRK-2041 linked — 12 rows, top AP actions open'
where project_id = 'a9d00000-0000-0000-0000-000000000001' and phase = 3 and sort_order = 2;
update public.apqp_phase_items set status = 'in_progress'
where project_id = 'a9d00000-0000-0000-0000-000000000001' and phase = 3 and sort_order in (1,3);