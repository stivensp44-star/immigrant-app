-- Enable Row Level Security for the vendor ownership model.
-- These policies are deny-by-default: only authenticated users whose auth.uid()
-- matches the row owner are allowed to access data.

alter table public.vendors enable row level security;
alter table public.vendors force row level security;

alter table public.applicants enable row level security;
alter table public.applicants force row level security;

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

drop policy if exists applicants_select_own_vendor on public.applicants;
create policy applicants_select_own_vendor
  on public.applicants
  for select
  to authenticated
  using (vendor_id = auth.uid());

drop policy if exists applicants_insert_own_vendor on public.applicants;
create policy applicants_insert_own_vendor
  on public.applicants
  for insert
  to authenticated
  with check (vendor_id = auth.uid());

drop policy if exists applicants_update_own_vendor on public.applicants;
create policy applicants_update_own_vendor
  on public.applicants
  for update
  to authenticated
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

drop policy if exists applicants_delete_own_vendor on public.applicants;
create policy applicants_delete_own_vendor
  on public.applicants
  for delete
  to authenticated
  using (vendor_id = auth.uid());
