-- SecureDesk phase 2: controlled Client registration review/retry.
-- Minimal projects/audit foundations support atomic activation; no project creation UI/API.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (btrim(name) <> '' and char_length(name)<=200),
  description text not null check (btrim(description) <> '' and char_length(description)<=4000),
  status text not null default 'active' check (status in ('active','inactive')),
  is_general_support boolean not null default false,
  created_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  check (not is_general_support or name='General Support')
);
create unique index projects_one_general_support on public.projects(organization_id) where is_general_support;
create trigger projects_updated_at before update on public.projects
  for each row execute function securedesk_private.touch_updated_at();
alter table public.projects enable row level security;
revoke all on public.projects from public,anon,authenticated,service_role;
grant select on public.projects to authenticated;
create policy projects_read_scope on public.projects for select to authenticated using (
  securedesk_private.can_read_organization(organization_id)
  and (status='active' or securedesk_private.can_administer_organization(organization_id))
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  actor_user_id uuid references public.profiles(id),
  event_type text not null check (btrim(event_type)<>''),
  target_type text not null check (btrim(target_type)<>''),
  target_id uuid not null,
  outcome text not null check (outcome in ('success','failure')),
  metadata_redacted jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata_redacted)='object'),
  created_at timestamptz not null default now()
);
create index audit_logs_org_created on public.audit_logs(organization_id,created_at);
create index audit_logs_actor_created on public.audit_logs(actor_user_id,created_at);
create function securedesk_private.guard_audit_history() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  raise exception using errcode='23514',message='Audit history cannot be rewritten or deleted directly';
end;
$$;
revoke all on function securedesk_private.guard_audit_history() from public,anon,authenticated,service_role;
create trigger audit_logs_append_only before update or delete on public.audit_logs
  for each row execute function securedesk_private.guard_audit_history();
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from public,anon,authenticated,service_role;
grant select on public.audit_logs to authenticated;
create policy audit_logs_read_scope on public.audit_logs for select to authenticated using (
  (select securedesk_private.active_actor_role())='super_admin'
  or (organization_id is not null and securedesk_private.can_administer_organization(organization_id))
);

-- Immediate Auth eligibility also protects the existing organization/project read helpers.
create or replace function securedesk_private.active_actor_role()
returns text language sql stable security definer set search_path='' as $$
  select p.app_role from public.profiles p join auth.users u on u.id=p.id
  where p.id=(select auth.uid()) and p.account_status='active'
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())
    and coalesce((select auth.jwt())->>'is_anonymous','false')='false';
$$;

-- Private helpers are not callable from an app. Every public routine derives actor from JWT.
create function securedesk_private.lock_registration_actor() returns public.profiles
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype;
begin
  if auth.uid() is null or auth.role() is distinct from 'authenticated'
    or coalesce(auth.jwt()->>'is_anonymous','false') <> 'false' then
    raise exception using errcode='42501',message='A verified account is required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||auth.uid()::text,0));
  select p.* into actor from public.profiles p join auth.users u on u.id=p.id
    where p.id=auth.uid() and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now()) for share of p,u;
  if not found then raise exception using errcode='42501',message='A verified account is required'; end if;
  return actor;
end;
$$;
create function securedesk_private.registration_review_allowed(target_org uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select coalesce(securedesk_private.active_actor_role()='super_admin',false)
    or (securedesk_private.active_actor_role()='admin' and exists (
      select 1 from public.organizations o join public.organization_admin_assignments a on a.organization_id=o.id
      where o.id=target_org and o.status in ('pending','active') and a.admin_user_id=auth.uid() and a.active
    ));
$$;
create function securedesk_private.lock_pending_registration(request_id uuid)
returns public.registration_requests language plpgsql security definer set search_path='' as $$
declare selected_request public.registration_requests%rowtype; target_user uuid;
begin
  select r.user_id into target_user from public.registration_requests r where r.id=request_id;
  if target_user is null then raise exception using errcode='42501',message='Registration request is not available'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||target_user::text,0));
  perform 1 from public.profiles p where p.id=target_user and p.app_role='client' and p.account_status='pending' for update;
  if not found then raise exception using errcode='42501',message='Registration request is not available'; end if;
  select r.* into selected_request from public.registration_requests r where r.id=request_id for update;
  if not found or selected_request.status <> 'pending' or selected_request.attempt_number <>
    (select max(r.attempt_number) from public.registration_requests r where r.user_id=target_user)
    or not securedesk_private.registration_review_allowed(selected_request.target_organization_id) then
    raise exception using errcode='42501',message='Registration request is not available';
  end if;
  return selected_request;
end;
$$;
create function securedesk_private.lock_registration_org(target_org uuid) returns text
language plpgsql security definer set search_path='' as $$
declare org_status text;
begin
  select o.status into org_status from public.organizations o where o.id=target_org for update;
  if not found then raise exception using errcode='42501',message='Registration request is not available'; end if;
  if securedesk_private.active_actor_role() is distinct from 'super_admin' then
    perform 1 from public.organization_admin_assignments a where a.organization_id=target_org and a.admin_user_id=auth.uid() and a.active for share;
    if not found or org_status not in ('pending','active') then
      raise exception using errcode='42501',message='Registration request is not available';
    end if;
  end if;
  return org_status;
end;
$$;
create function securedesk_private.validate_new_client(target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from auth.users u where u.id=target_user and u.email_confirmed_at is not null
    and not coalesce(u.is_anonymous,false) and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now()) for share;
  if not found then raise exception using errcode='22023',message='Client email must be confirmed and eligible for login'; end if;
  if exists (select 1 from public.organization_members where user_id=target_user)
    or exists (select 1 from public.staff_organization_assignments where staff_user_id=target_user)
    or exists (select 1 from public.organization_admin_assignments where admin_user_id=target_user) then
    raise exception using errcode='22023',message='Initial registration cannot replace existing membership or assignment history';
  end if;
end;
$$;
create function securedesk_private.activate_registration_client(request_id uuid,target_org uuid) returns void
language plpgsql security definer set search_path='' as $$
declare selected_request public.registration_requests%rowtype;
begin
  select r.* into selected_request from public.registration_requests r where r.id=request_id;
  -- Caller has locked/validated actor, request, client and organization.
  insert into public.projects (organization_id,name,description,is_general_support,created_by_user_id)
    values (target_org,'General Support','Default support project.',true,auth.uid())
    on conflict (organization_id) where is_general_support do nothing;
  if not exists (select 1 from public.projects where organization_id=target_org and is_general_support and status='active') then
    raise exception using errcode='22023',message='An active General Support project is required';
  end if;
  update public.organizations set status='active' where id=target_org and status='pending';
  insert into public.organization_members (organization_id,user_id,approved_by) values (target_org,selected_request.user_id,auth.uid());
  update public.profiles set account_status='active' where id=selected_request.user_id;
  update public.registration_requests set status='approved',target_organization_id=target_org,reviewed_by=auth.uid(),reviewed_at=now() where id=request_id;
  insert into public.audit_logs (organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values (target_org,auth.uid(),'registration.approved','registration_request',request_id,'success',jsonb_build_object('attempt_number',selected_request.attempt_number));
end;
$$;
revoke all on function securedesk_private.lock_registration_actor(), securedesk_private.registration_review_allowed(uuid),
  securedesk_private.lock_pending_registration(uuid),securedesk_private.lock_registration_org(uuid),
  securedesk_private.validate_new_client(uuid),securedesk_private.activate_registration_client(uuid,uuid)
  from public,anon,authenticated,service_role;

create function public.admin_registration_requests(p_limit integer default 50,p_offset integer default 0)
returns table (id uuid,user_id uuid,attempt_number integer,full_name text,email text,company_name_text text,
  message text,phone text,target_organization_id uuid,status text,rejection_reason text,reviewed_by uuid,reviewed_at timestamptz,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status <> 'active' or actor.app_role not in ('admin','super_admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  if p_limit is null or p_limit not between 1 and 100 or p_offset is null or p_offset not between 0 and 100000 then
    raise exception using errcode='22023',message='Invalid review page size';
  end if;
  return query select r.id,r.user_id,r.attempt_number,p.full_name,u.email::text,r.company_name_text,r.message,r.phone,
    r.target_organization_id,r.status,r.rejection_reason,r.reviewed_by,r.reviewed_at,r.created_at
    from public.registration_requests r join public.profiles p on p.id=r.user_id join auth.users u on u.id=p.id
    where securedesk_private.registration_review_allowed(r.target_organization_id)
    order by (r.status='pending') desc,r.created_at,r.id limit p_limit offset p_offset;
end;
$$;
create function public.route_registration_request(p_request_id uuid,p_organization_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; selected_request public.registration_requests%rowtype; org_status text;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status <> 'active' or actor.app_role <> 'super_admin' then
    raise exception using errcode='42501',message='Super Admin access is required';
  end if;
  selected_request:=securedesk_private.lock_pending_registration(p_request_id);
  if p_organization_id is not null then
    org_status:=securedesk_private.lock_registration_org(p_organization_id);
    if org_status not in ('pending','active') then raise exception using errcode='22023',message='Organization must be pending or active'; end if;
  end if;
  if selected_request.target_organization_id is not distinct from p_organization_id then return p_request_id; end if;
  update public.registration_requests set target_organization_id=p_organization_id where id=p_request_id;
  insert into public.audit_logs (organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values (p_organization_id,auth.uid(),'registration.routed','registration_request',p_request_id,'success',jsonb_build_object('attempt_number',selected_request.attempt_number));
  return p_request_id;
end;
$$;
create function public.reject_registration_request(p_request_id uuid,p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; selected_request public.registration_requests%rowtype; reason text;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status <> 'active' or actor.app_role not in ('admin','super_admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  selected_request:=securedesk_private.lock_pending_registration(p_request_id);
  if selected_request.target_organization_id is not null then perform securedesk_private.lock_registration_org(selected_request.target_organization_id); end if;
  reason:=securedesk_private.required_registration_text(jsonb_build_object('reason',p_reason),'reason',2000);
  update public.profiles set account_status='rejected' where id=selected_request.user_id;
  update public.registration_requests set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),rejection_reason=reason where id=p_request_id;
  insert into public.audit_logs (organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values (selected_request.target_organization_id,auth.uid(),'registration.rejected','registration_request',p_request_id,'success',jsonb_build_object('attempt_number',selected_request.attempt_number));
  return p_request_id;
end;
$$;
create function public.approve_registration_request(p_request_id uuid,p_organization_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; selected_request public.registration_requests%rowtype; org_status text;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status <> 'active' or actor.app_role not in ('admin','super_admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  selected_request:=securedesk_private.lock_pending_registration(p_request_id);
  if p_organization_id is null or selected_request.target_organization_id is distinct from p_organization_id then
    raise exception using errcode='42501',message='Registration request is not available';
  end if;
  org_status:=securedesk_private.lock_registration_org(p_organization_id);
  if org_status not in ('pending','active') then raise exception using errcode='22023',message='Organization must be pending or active'; end if;
  perform securedesk_private.validate_new_client(selected_request.user_id);
  perform securedesk_private.activate_registration_client(p_request_id,p_organization_id);
  return p_request_id;
end;
$$;
create function public.approve_registration_new_organization(p_request_id uuid,p_details jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; selected_request public.registration_requests%rowtype; org_id uuid;
  org_name text; org_address text; org_email text; org_phone text; org_description text; org_industry text; org_contact text;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status <> 'active' or actor.app_role <> 'super_admin' then
    raise exception using errcode='42501',message='Super Admin access is required';
  end if;
  selected_request:=securedesk_private.lock_pending_registration(p_request_id);
  if selected_request.target_organization_id is not null then raise exception using errcode='22023',message='New organization requires an unrouted request'; end if;
  perform securedesk_private.validate_new_client(selected_request.user_id);
  if jsonb_typeof(p_details) is distinct from 'object' or exists (
    select 1 from jsonb_object_keys(p_details) k where k not in ('name','address','email','phone','description','industry','contact_person')
  ) then raise exception using errcode='22023',message='Invalid organization fields'; end if;
  org_name:=securedesk_private.required_registration_text(p_details,'name',200);
  org_address:=securedesk_private.required_registration_text(p_details,'address',1000);
  org_email:=securedesk_private.required_registration_text(p_details,'email',254);
  if org_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then raise exception using errcode='22023',message='Organization email is invalid'; end if;
  org_phone:=securedesk_private.required_registration_text(p_details,'phone',40);
  org_description:=securedesk_private.required_registration_text(p_details,'description',4000);
  if p_details ? 'industry' then org_industry:=securedesk_private.required_registration_text(p_details,'industry',200); end if;
  if p_details ? 'contact_person' then org_contact:=securedesk_private.required_registration_text(p_details,'contact_person',120); end if;
  insert into public.organizations (name,address,email,phone,description,industry,contact_person,status)
    values (org_name,org_address,org_email,org_phone,org_description,org_industry,org_contact,'pending') returning id into org_id;
  perform securedesk_private.activate_registration_client(p_request_id,org_id);
  return org_id;
end;
$$;
create function public.resubmit_registration(p_company_name text,p_phone text,p_message text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; latest_request public.registration_requests%rowtype; new_request_id uuid;
  company_text text; phone_text text; message_text text;
begin
  actor:=securedesk_private.lock_registration_actor();
  select p.* into actor from public.profiles p where p.id=auth.uid() and p.app_role='client' and p.account_status='rejected' for update;
  if not found then raise exception using errcode='42501',message='Only a rejected Client may submit a new request'; end if;
  select r.* into latest_request from public.registration_requests r where r.user_id=auth.uid() order by r.attempt_number desc limit 1 for update;
  if not found or latest_request.status <> 'rejected' or exists (select 1 from public.registration_requests where user_id=auth.uid() and status='pending') then
    raise exception using errcode='42501',message='The latest request must be rejected';
  end if;
  if exists (select 1 from public.organization_members where user_id=auth.uid() and status='active')
    or exists (select 1 from public.staff_organization_assignments where staff_user_id=auth.uid() and active)
    or exists (select 1 from public.organization_admin_assignments where admin_user_id=auth.uid() and active) then
    raise exception using errcode='42501',message='Registration retry cannot replace active assignments';
  end if;
  company_text:=securedesk_private.required_registration_text(jsonb_build_object('company',p_company_name),'company',200);
  phone_text:=securedesk_private.required_registration_text(jsonb_build_object('phone',p_phone),'phone',40);
  message_text:=securedesk_private.required_registration_text(jsonb_build_object('message',p_message),'message',4000);
  update public.profiles set account_status='pending',phone=phone_text where id=auth.uid();
  insert into public.registration_requests (user_id,attempt_number,company_name_text,phone,message)
    values (auth.uid(),latest_request.attempt_number+1,company_text,phone_text,message_text) returning id into new_request_id;
  insert into public.audit_logs (actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values (auth.uid(),'registration.resubmitted','registration_request',new_request_id,'success',jsonb_build_object('attempt_number',latest_request.attempt_number+1));
  return new_request_id;
end;
$$;
revoke all on function public.admin_registration_requests(integer,integer),public.route_registration_request(uuid,uuid),
  public.reject_registration_request(uuid,text),public.approve_registration_request(uuid,uuid),
  public.approve_registration_new_organization(uuid,jsonb),public.resubmit_registration(text,text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.admin_registration_requests(integer,integer),public.route_registration_request(uuid,uuid),
  public.reject_registration_request(uuid,text),public.approve_registration_request(uuid,uuid),
  public.approve_registration_new_organization(uuid,jsonb),public.resubmit_registration(text,text,text) to authenticated;
-- No direct table writes, privileged-role assignment, transfer or generic project creation.
-- Failed transactions have no partial success/audit. Failure telemetry/retention belong to later hardening.
