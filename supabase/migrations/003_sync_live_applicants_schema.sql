-- Sync an existing live public.applicants table to the schema expected by the app.
-- This migration is additive only:
-- - no drops
-- - no renames
-- - no table rebuilds

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
  add column if not exists current_status text,
  add column if not exists flow_type text,
  add column if not exists flow_answers jsonb not null default '{}'::jsonb;

update public.applicants
set flow_answers = '{}'::jsonb
where flow_answers is null;

alter table public.applicants
  alter column flow_answers set default '{}'::jsonb,
  alter column flow_answers set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applicants_flow_answers_is_object_check'
      and conrelid = 'public.applicants'::regclass
  ) then
    alter table public.applicants
      add constraint applicants_flow_answers_is_object_check
      check (jsonb_typeof(flow_answers) = 'object');
  end if;
end
$$;
