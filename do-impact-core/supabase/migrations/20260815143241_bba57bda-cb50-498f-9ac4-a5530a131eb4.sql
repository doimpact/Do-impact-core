create table public.industrial_strategy_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  section_key text not null,
  item_key text not null,
  content text,
  status text not null default 'open',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, section_key, item_key)
);

create table public.industrial_strategy_rows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id(),
  section_key text not null,
  label text,
  data jsonb not null default '{}'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.industrial_strategy_entries to authenticated;
grant select, insert, update, delete on public.industrial_strategy_rows to authenticated;
grant all on public.industrial_strategy_entries to service_role;
grant all on public.industrial_strategy_rows to service_role;

alter table public.industrial_strategy_entries enable row level security;
alter table public.industrial_strategy_rows enable row level security;

do $$
declare t text;
begin
  foreach t in array array['industrial_strategy_entries','industrial_strategy_rows'] loop
    execute format('create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id())', t || ' company read', t);
    execute format('create policy %I on public.%I for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id())', t || ' company write', t);
    execute format('create trigger set_company_id_%I before insert on public.%I for each row execute function public.tg_set_company_id()', t, t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated', t);
    execute format('create trigger trg_enforce_write_access before insert or update or delete on public.%I for each row execute function public.enforce_write_access()', t);
    execute format('create trigger trg_prevent_template_write before insert or update or delete on public.%I for each row execute function public.prevent_template_write()', t);
    execute format('create index %I on public.%I (company_id)', 'idx_' || t || '_company', t);
    execute format('create index %I on public.%I (company_id, section_key)', 'idx_' || t || '_section', t);
  end loop;
end $$;