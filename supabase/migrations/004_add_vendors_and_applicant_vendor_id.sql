-- Introduce a vendor ownership model without breaking existing applicants data.
-- Fresh environments should use supabase/schema.sql, which makes vendor_id NOT NULL.
-- This additive migration creates the vendors table and adds applicants.vendor_id
-- as a foreign key first. Existing rows must be backfilled before enforcing NOT NULL.

create table if not exists public.vendors (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.applicants
  add column if not exists vendor_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applicants_vendor_id_fkey'
      and conrelid = 'public.applicants'::regclass
  ) then
    alter table public.applicants
      add constraint applicants_vendor_id_fkey
      foreign key (vendor_id)
      references public.vendors (id)
      on delete restrict;
  end if;
end
$$;

create index if not exists applicants_vendor_id_idx
  on public.applicants (vendor_id);

-- Follow-up after vendor rows are created and legacy applicants are backfilled:
-- alter table public.applicants
--   alter column vendor_id set not null;
