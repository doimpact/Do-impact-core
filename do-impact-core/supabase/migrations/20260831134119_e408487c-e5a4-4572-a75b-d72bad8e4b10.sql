begin;

drop policy if exists "restructuring_items company all" on public.restructuring_items;
drop policy if exists "restructuring_items_company_scope" on public.restructuring_items;

create policy "restructuring_items_member_scope"
on public.restructuring_items
for all
to authenticated
using (public.is_company_member(company_id, auth.uid()))
with check (public.is_company_member(company_id, auth.uid()));

commit;