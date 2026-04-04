-- Safe additive migration for existing public.applicants tables.
-- This script does not drop columns, rename fields, or rebuild the table.
-- It adds the expanded client profile fields used by the app and
-- adds the flow_type check constraint when it is not already present.

alter table if exists public.applicants
  add column if not exists phone text,
  add column if not exists dob date,
  add column if not exists country_of_birth text,
  add column if not exists country_of_citizenship text,
  add column if not exists a_number text,
  add column if not exists uscis_online_account_number text,
  add column if not exists passport_number text,
  add column if not exists passport_country text,
  add column if not exists entry_date_us date,
  add column if not exists i94_number text,
  add column if not exists current_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applicants_flow_type_check'
      and conrelid = 'public.applicants'::regclass
  ) then
    alter table public.applicants
      add constraint applicants_flow_type_check
      check (flow_type in ('TPS', 'TPS_EAD', 'ASYLUM_EAD'));
  end if;
end
$$;

-- Intentionally omitted from this migration:
-- - setting NOT NULL on legacy columns
-- - adding non-blank check constraints for existing data
-- Those stricter constraints are documented in supabase/schema.sql for
-- fresh environments, but should only be enforced after confirming the
-- live table does not contain older rows that would violate them.
