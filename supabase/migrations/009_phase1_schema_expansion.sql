-- Migration 009: Phase 1 schema expansion.
-- Adds new tables for form-fill workflows, drops orphan template tables.
-- Type notes: applicants.id = bigint, vendors.id = uuid

-- =============================================================================
-- PART 1: NEW TABLES
-- =============================================================================

create table if not exists public.address_history (
  id uuid primary key default gen_random_uuid(),
  client_id bigint not null references public.applicants (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  address_type text not null,
  street_line_1 text,
  street_line_2 text,
  city text,
  state text,
  zip text,
  country text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint address_history_address_type_check
    check (address_type in ('physical', 'mailing', 'port_of_entry'))
);

create index if not exists address_history_client_id_idx on public.address_history (client_id);
create index if not exists address_history_vendor_id_idx on public.address_history (vendor_id);

create table if not exists public.spouses (
  id uuid primary key default gen_random_uuid(),
  client_id bigint not null references public.applicants (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  relationship_status text not null,
  first_name text,
  middle_name text,
  last_name text,
  date_of_birth date,
  country_of_birth text,
  a_number text,
  date_of_marriage date,
  date_of_marriage_end date,
  reason_marriage_ended text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint spouses_relationship_status_check
    check (relationship_status in ('current', 'former'))
);

create index if not exists spouses_client_id_idx on public.spouses (client_id);
create index if not exists spouses_vendor_id_idx on public.spouses (vendor_id);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  client_id bigint not null references public.applicants (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  first_name text,
  middle_name text,
  last_name text,
  date_of_birth date,
  country_of_birth text,
  a_number text,
  currently_residing_with_client boolean,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists children_client_id_idx on public.children (client_id);
create index if not exists children_vendor_id_idx on public.children (vendor_id);

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  client_id bigint not null references public.applicants (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  form_type text not null,
  form_edition text,
  filing_type text,
  eligibility_category text,
  form_data jsonb not null default '{}'::jsonb,
  client_data_snapshot jsonb,
  status text not null default 'draft',
  generated_at timestamptz,
  filing_date date,
  expiration_date date,
  uscis_receipt_number text,
  renewal_of_form_id uuid references public.forms (id) on delete set null,
  confirmed_at timestamptz,
  confirmed_by_vendor_id uuid references public.vendors (id) on delete set null,
  pdf_storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint forms_form_type_check check (form_type in ('I-821', 'I-765')),
  constraint forms_filing_type_check check (filing_type is null or filing_type in ('initial', 'renewal', 'replacement')),
  constraint forms_eligibility_category_check check (eligibility_category is null or eligibility_category in ('c8', 'c19')),
  constraint forms_status_check check (status in ('draft', 'generated', 'filed', 'discarded', 'approved', 'denied')),
  constraint forms_form_data_is_object_check check (jsonb_typeof(form_data) = 'object'),
  constraint forms_client_data_snapshot_is_object_check check (client_data_snapshot is null or jsonb_typeof(client_data_snapshot) = 'object')
);

create index if not exists forms_client_id_idx on public.forms (client_id);
create index if not exists forms_vendor_id_idx on public.forms (vendor_id);
create index if not exists forms_status_idx on public.forms (status);
create index if not exists forms_expiration_date_idx on public.forms (expiration_date);
create index if not exists forms_renewal_of_form_id_idx on public.forms (renewal_of_form_id);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id bigint not null references public.applicants (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  document_type text not null,
  file_storage_path text not null,
  original_filename text,
  mime_type text,
  expires_at date,
  notes text,
  uploaded_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_client_id_idx on public.documents (client_id);
create index if not exists documents_vendor_id_idx on public.documents (vendor_id);
create index if not exists documents_document_type_idx on public.documents (document_type);

-- =============================================================================
-- PART 2: RLS ENABLED AND FORCED
-- =============================================================================

alter table public.address_history enable row level security;
alter table public.address_history force row level security;
alter table public.spouses enable row level security;
alter table public.spouses force row level security;
alter table public.children enable row level security;
alter table public.children force row level security;
alter table public.forms enable row level security;
alter table public.forms force row level security;
alter table public.documents enable row level security;
alter table public.documents force row level security;

-- =============================================================================
-- PART 3: RLS POLICIES
-- =============================================================================

drop policy if exists address_history_select_own_vendor on public.address_history;
create policy address_history_select_own_vendor on public.address_history for select to authenticated using (vendor_id = auth.uid());
drop policy if exists address_history_insert_own_vendor on public.address_history;
create policy address_history_insert_own_vendor on public.address_history for insert to authenticated with check (vendor_id = auth.uid());
drop policy if exists address_history_update_own_vendor on public.address_history;
create policy address_history_update_own_vendor on public.address_history for update to authenticated using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());
drop policy if exists address_history_delete_own_vendor on public.address_history;
create policy address_history_delete_own_vendor on public.address_history for delete to authenticated using (vendor_id = auth.uid());

drop policy if exists spouses_select_own_vendor on public.spouses;
create policy spouses_select_own_vendor on public.spouses for select to authenticated using (vendor_id = auth.uid());
drop policy if exists spouses_insert_own_vendor on public.spouses;
create policy spouses_insert_own_vendor on public.spouses for insert to authenticated with check (vendor_id = auth.uid());
drop policy if exists spouses_update_own_vendor on public.spouses;
create policy spouses_update_own_vendor on public.spouses for update to authenticated using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());
drop policy if exists spouses_delete_own_vendor on public.spouses;
create policy spouses_delete_own_vendor on public.spouses for delete to authenticated using (vendor_id = auth.uid());

drop policy if exists children_select_own_vendor on public.children;
create policy children_select_own_vendor on public.children for select to authenticated using (vendor_id = auth.uid());
drop policy if exists children_insert_own_vendor on public.children;
create policy children_insert_own_vendor on public.children for insert to authenticated with check (vendor_id = auth.uid());
drop policy if exists children_update_own_vendor on public.children;
create policy children_update_own_vendor on public.children for update to authenticated using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());
drop policy if exists children_delete_own_vendor on public.children;
create policy children_delete_own_vendor on public.children for delete to authenticated using (vendor_id = auth.uid());

drop policy if exists forms_select_own_vendor on public.forms;
create policy forms_select_own_vendor on public.forms for select to authenticated using (vendor_id = auth.uid());
drop policy if exists forms_insert_own_vendor on public.forms;
create policy forms_insert_own_vendor on public.forms for insert to authenticated with check (vendor_id = auth.uid());
drop policy if exists forms_update_own_vendor on public.forms;
create policy forms_update_own_vendor on public.forms for update to authenticated using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());
drop policy if exists forms_delete_own_vendor on public.forms;
create policy forms_delete_own_vendor on public.forms for delete to authenticated using (vendor_id = auth.uid());

drop policy if exists documents_select_own_vendor on public.documents;
create policy documents_select_own_vendor on public.documents for select to authenticated using (vendor_id = auth.uid());
drop policy if exists documents_insert_own_vendor on public.documents;
create policy documents_insert_own_vendor on public.documents for insert to authenticated with check (vendor_id = auth.uid());
drop policy if exists documents_update_own_vendor on public.documents;
create policy documents_update_own_vendor on public.documents for update to authenticated using (vendor_id = auth.uid()) with check (vendor_id = auth.uid());
drop policy if exists documents_delete_own_vendor on public.documents;
create policy documents_delete_own_vendor on public.documents for delete to authenticated using (vendor_id = auth.uid());

-- =============================================================================
-- PART 4: DROP ORPHAN TABLES
-- =============================================================================

drop table if exists public.tickets cascade;
drop table if exists public.ticket_tiers cascade;
drop table if exists public.payouts cascade;
drop table if exists public.events cascade;
drop table if exists public.promoters cascade;