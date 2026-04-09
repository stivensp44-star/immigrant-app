-- Backfill vendor rows for all existing auth users and enforce applicant vendor ownership.
--
-- Safety model:
-- 1. Backfill public.vendors from auth.users automatically.
-- 2. Do NOT guess applicant ownership for rows where vendor_id is null.
-- 3. Abort before NOT NULL enforcement if any applicants still need manual ownership assignment.
--
-- Manual review query for unresolved applicants:
-- select id, created_at, first_name, last_name, email
-- from public.applicants
-- where vendor_id is null
-- order by created_at asc, id asc;
--
-- Example manual remediation pattern:
-- update public.applicants
-- set vendor_id = '<vendor-uuid>'
-- where id in (...);

insert into public.vendors (id)
select au.id
from auth.users au
left join public.vendors v
  on v.id = au.id
where v.id is null;

do $$
declare
  null_vendor_count bigint;
begin
  select count(*)
  into null_vendor_count
  from public.applicants
  where vendor_id is null;

  if null_vendor_count > 0 then
    raise exception using
      message = format(
        'Cannot enforce applicants.vendor_id NOT NULL: %s applicant row(s) still have vendor_id IS NULL.',
        null_vendor_count
      ),
      detail = 'Backfill applicant ownership manually before rerunning this migration.',
      hint = 'Run: select id, created_at, first_name, last_name, email from public.applicants where vendor_id is null order by created_at asc, id asc;';
  end if;
end
$$;

alter table public.applicants
  alter column vendor_id set not null;
