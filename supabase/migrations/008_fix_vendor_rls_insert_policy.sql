-- Repair vendors RLS so an authenticated user can provision exactly their own
-- vendor row during login/signup session establishment.
--
-- This keeps RLS enabled and deny-by-default. Access remains limited to rows
-- where public.vendors.id = auth.uid().

alter table public.vendors enable row level security;
alter table public.vendors force row level security;

drop policy if exists vendors_select_own on public.vendors;
create policy vendors_select_own
  on public.vendors
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists vendors_insert_own on public.vendors;
create policy vendors_insert_own
  on public.vendors
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists vendors_update_own on public.vendors;
create policy vendors_update_own
  on public.vendors
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists vendors_delete_own on public.vendors;
create policy vendors_delete_own
  on public.vendors
  for delete
  to authenticated
  using (id = auth.uid());
