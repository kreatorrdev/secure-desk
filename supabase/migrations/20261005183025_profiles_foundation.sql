-- SecureDesk v1.0: the first identity foundation, before registration and organization access.
-- Supabase Auth owns credentials. Profile roles/status never come from user-editable metadata.
create table public.profiles (
  id uuid primary key references auth.users (id),
  full_name text not null constraint profiles_full_name_not_blank check (btrim(full_name) <> ''),
  phone text not null constraint profiles_phone_not_blank check (btrim(phone) <> ''),
  app_role text not null default 'client'
    constraint profiles_app_role_allowed check (app_role in ('client', 'staff', 'admin', 'super_admin')),
  account_status text not null default 'pending'
    constraint profiles_account_status_allowed check (account_status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Retain referenced identity records; account deletion/history is handled by a later controlled flow.
create schema if not exists securedesk_private;
revoke all on schema securedesk_private from public, anon, authenticated, service_role;

create function securedesk_private.touch_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function securedesk_private.touch_profile_updated_at()
  from public, anon, authenticated, service_role;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function securedesk_private.touch_profile_updated_at();

alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated, service_role;
grant usage on schema public to authenticated;
-- Pending users only need their own identifier and account state at this stage.
grant select (id, account_status) on table public.profiles to authenticated;

create policy profiles_read_own_status
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
);

-- No client INSERT/UPDATE/DELETE policies. Registration and scoped admin routines follow later.
