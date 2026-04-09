-- Ensure every auth user has a matching vendor row.
-- This keeps vendor provisioning tied directly to Supabase Auth creation.

create or replace function public.handle_new_vendor_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vendors (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_vendor_user();
