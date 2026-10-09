-- Phase 3: organization codes route an existing pending initial registration.
-- Approval remains the existing audited registration transaction; never a membership shortcut.
create extension if not exists pgcrypto with schema extensions;

create table public.organization_access_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  check (expires_at > created_at),
  check ((active and revoked_at is null) or (not active and revoked_at is not null))
);
create unique index organization_access_codes_one_active on public.organization_access_codes(organization_id) where active;
create index organization_access_codes_creator on public.organization_access_codes(created_by);
alter table public.organization_access_codes enable row level security;
revoke all on public.organization_access_codes from public,anon,authenticated,service_role;

-- Immutable submission receipt; decision/status/history live in registration_requests.
-- This avoids two independent approval paths for the same initial membership.
create table public.organization_code_submissions (
  id uuid primary key default gen_random_uuid(),
  registration_request_id uuid not null unique references public.registration_requests(id),
  user_id uuid not null references public.profiles(id),
  access_code_id uuid not null references public.organization_access_codes(id),
  organization_id uuid not null references public.organizations(id),
  created_at timestamptz not null default now()
);
create index organization_code_submissions_user on public.organization_code_submissions(user_id);
create index organization_code_submissions_code on public.organization_code_submissions(access_code_id);
create index organization_code_submissions_org on public.organization_code_submissions(organization_id);
alter table public.organization_code_submissions enable row level security;
revoke all on public.organization_code_submissions from public,anon,authenticated,service_role;
create trigger organization_code_submissions_immutable before update or delete on public.organization_code_submissions
  for each row execute function securedesk_private.guard_audit_history();

create table securedesk_private.organization_code_attempts (
  user_id uuid primary key references public.profiles(id),
  window_started_at timestamptz not null,
  attempts integer not null check(attempts between 1 and 5)
);
alter table securedesk_private.organization_code_attempts enable row level security;
revoke all on securedesk_private.organization_code_attempts from public,anon,authenticated,service_role;

create function public.organization_access_code_state(p_organization_id uuid)
returns table(id uuid,created_at timestamptz,expires_at timestamptz,is_usable boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated'
    or coalesce(securedesk_private.active_actor_role(),'') not in ('admin','super_admin')
    or not securedesk_private.can_administer_organization(p_organization_id) then
    raise exception using errcode='42501',message='Organization code is not available';
  end if;
  return query select c.id,c.created_at,c.expires_at,
    c.expires_at>now() and o.status='active'
    from public.organization_access_codes c join public.organizations o on o.id=c.organization_id
    where c.organization_id=p_organization_id and c.active;
end;
$$;

create function public.manage_organization_access_code(p_organization_id uuid,p_expected_code_id uuid,p_intent text)
returns table(id uuid,code text,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; current_id uuid; generated text; new_id uuid; expiry timestamptz;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role not in ('admin','super_admin')
    or not securedesk_private.can_administer_organization(p_organization_id) then
    raise exception using errcode='42501',message='Organization code is not available';
  end if;
  if p_intent is null or p_intent not in ('issue','revoke') then
    raise exception using errcode='22023',message='Invalid organization code action';
  end if;
  -- Same org/assignment lock order as the existing access-management routines.
  perform securedesk_private.lock_access_organization(p_organization_id,p_intent='issue');
  select c.id into current_id from public.organization_access_codes c
    where c.organization_id=p_organization_id and c.active for update;
  if current_id is distinct from p_expected_code_id then
    raise exception using errcode='40001',message='Organization code changed; reload before trying again';
  end if;
  if p_intent='revoke' and current_id is null then
    raise exception using errcode='22023',message='No organization code to revoke';
  end if;
  if current_id is not null then
    update public.organization_access_codes set active=false,revoked_at=clock_timestamp() where organization_access_codes.id=current_id;
    insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
      values(p_organization_id,auth.uid(),'organization_code.revoked','organization_access_code',current_id,'success');
  end if;
  if p_intent='issue' then
    generated:=encode(extensions.gen_random_bytes(32),'hex');
    expiry:=clock_timestamp()+interval '7 days';
    insert into public.organization_access_codes(organization_id,code_hash,created_by,expires_at)
      values(p_organization_id,encode(extensions.digest(generated,'sha256'),'hex'),auth.uid(),expiry)
      returning organization_access_codes.id into new_id;
    insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
      values(p_organization_id,auth.uid(),'organization_code.issued','organization_access_code',new_id,'success');
    return query select new_id,generated,expiry;
  end if;
end;
$$;

create function public.own_organization_code_entry()
returns text language plpgsql stable security definer set search_path='' as $$
declare request_id uuid; target_id uuid;
begin
  if auth.role() is distinct from 'authenticated'
    or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
    or not exists(select 1 from public.profiles p join auth.users u on u.id=p.id
      where p.id=auth.uid() and p.app_role='client' and p.account_status='pending'
      and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now()))
    or exists(select 1 from public.organization_members where user_id=auth.uid())
    or exists(select 1 from public.staff_organization_assignments where staff_user_id=auth.uid())
    or exists(select 1 from public.organization_admin_assignments where admin_user_id=auth.uid()) then return 'unavailable'; end if;
  select r.id,r.target_organization_id into request_id,target_id from public.registration_requests r
    where r.user_id=auth.uid() and r.status='pending'
    order by r.attempt_number desc limit 1;
  if request_id is null then return 'unavailable'; end if;
  if exists(select 1 from public.organization_code_submissions s where s.registration_request_id=request_id) then return 'submitted'; end if;
  return case when target_id is null then 'available' else 'unavailable' end;
end;
$$;

create function public.submit_organization_access_code(p_code text)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; request public.registration_requests%rowtype;
  target_org uuid; selected_code public.organization_access_codes%rowtype;
  quota securedesk_private.organization_code_attempts%rowtype; normalized text; org_status text;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.app_role<>'client' or actor.account_status<>'pending' then
    raise exception using errcode='42501',message='A pending initial registration is required';
  end if;
  -- Actor lock serializes retries, approvals, routing and quota updates for this user.
  select * into quota from securedesk_private.organization_code_attempts where user_id=auth.uid() for update;
  if not found or quota.window_started_at<=clock_timestamp()-interval '15 minutes' then
    insert into securedesk_private.organization_code_attempts(user_id,window_started_at,attempts)
      values(auth.uid(),clock_timestamp(),1) on conflict(user_id) do update set window_started_at=excluded.window_started_at,attempts=1;
  elsif quota.attempts>=5 then return 'rate_limited';
  else update securedesk_private.organization_code_attempts set attempts=attempts+1 where user_id=auth.uid();
  end if;
  -- Invalid attempts return normally so their rate-limit counters COMMIT, not roll back.
  if p_code is null or octet_length(p_code)>256 then return 'unavailable'; end if;
  normalized:=lower(btrim(p_code));
  if normalized !~ '^[0-9a-f]{64}$' then return 'unavailable'; end if;
  if exists(select 1 from public.organization_members where user_id=auth.uid())
    or exists(select 1 from public.staff_organization_assignments where staff_user_id=auth.uid())
    or exists(select 1 from public.organization_admin_assignments where admin_user_id=auth.uid()) then return 'unavailable'; end if;
  select r.* into request from public.registration_requests r where r.user_id=auth.uid() and r.status='pending'
    order by r.attempt_number desc limit 1 for update;
  if not found then return 'unavailable'; end if;
  -- Locate internally; reveal no company name, ID, contact or people to the submitter.
  select c.organization_id into target_org from public.organization_access_codes c
    where c.code_hash=encode(extensions.digest(normalized,'sha256'),'hex');
  if target_org is null then return 'unavailable'; end if;
  -- Serialize with rotation/revocation before rechecking the code under the org lock.
  select o.status into org_status from public.organizations o where o.id=target_org for share;
  select c.* into selected_code from public.organization_access_codes c
    where c.code_hash=encode(extensions.digest(normalized,'sha256'),'hex') for share;
  if not found or not selected_code.active or selected_code.expires_at<=clock_timestamp()
    or org_status is distinct from 'active' then return 'unavailable'; end if;
  if request.target_organization_id is not null then
    if request.target_organization_id=target_org and exists(select 1 from public.organization_code_submissions s
      where s.registration_request_id=request.id and s.access_code_id=selected_code.id) then return 'submitted'; end if;
    return 'unavailable';
  end if;
  update public.registration_requests set target_organization_id=target_org where registration_requests.id=request.id;
  insert into public.organization_code_submissions(registration_request_id,user_id,access_code_id,organization_id)
    values(request.id,auth.uid(),selected_code.id,target_org);
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
    values(target_org,auth.uid(),'registration.code_submitted','registration_request',request.id,'success');
  return 'submitted';
end;
$$;

revoke all on function public.organization_access_code_state(uuid),public.manage_organization_access_code(uuid,uuid,text),
  public.own_organization_code_entry(),public.submit_organization_access_code(text) from public,anon,authenticated,service_role;
grant execute on function public.organization_access_code_state(uuid),public.manage_organization_access_code(uuid,uuid,text),
  public.own_organization_code_entry(),public.submit_organization_access_code(text) to authenticated;
