-- US-06 / T-07: scoped consent and atomic Client membership transfer.
create table public.organization_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  from_organization_id uuid not null references public.organizations(id),
  to_organization_id uuid not null references public.organizations(id),
  source_membership_id uuid not null references public.organization_members(id),
  source_access_revision bigint not null check(source_access_revision>0),
  access_code_id uuid not null references public.organization_access_codes(id),
  reason text check(reason is null or char_length(reason) between 1 and 2000),
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  revision bigint not null default 1 check(revision>0),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(from_organization_id<>to_organization_id),
  check((status='pending' and reviewed_by is null and reviewed_at is null and rejection_reason is null)
    or (status='approved' and reviewed_by is not null and reviewed_at is not null and rejection_reason is null)
    or (status='rejected' and reviewed_by is not null and reviewed_at is not null and rejection_reason is not null and char_length(btrim(rejection_reason)) between 1 and 2000)),
  check(reviewed_at is null or reviewed_at>=created_at)
);
create unique index organization_change_requests_one_pending on public.organization_change_requests(user_id) where status='pending';
create index organization_change_requests_source on public.organization_change_requests(from_organization_id,status,created_at);
create index organization_change_requests_destination on public.organization_change_requests(to_organization_id,status,created_at);
create index organization_change_requests_member on public.organization_change_requests(source_membership_id);
create index organization_change_requests_code on public.organization_change_requests(access_code_id);
create index organization_change_requests_reviewer on public.organization_change_requests(reviewed_by);
create table public.organization_change_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.organization_change_requests(id),
  side text not null check(side in ('source','destination')),
  actor_user_id uuid not null references public.profiles(id),
  actor_access_revision bigint not null check(actor_access_revision>0),
  assignment_id uuid not null references public.organization_admin_assignments(id),
  assignment_revision bigint not null check(assignment_revision>0),
  created_at timestamptz not null default now(),
  unique(request_id,side,actor_user_id,actor_access_revision,assignment_id,assignment_revision)
);
create index organization_change_approvals_assignment on public.organization_change_approvals(assignment_id);
create index organization_change_approvals_actor on public.organization_change_approvals(actor_user_id);
alter table public.organization_change_requests enable row level security;
alter table public.organization_change_approvals enable row level security;
revoke all on public.organization_change_requests,public.organization_change_approvals from public,anon,authenticated,service_role;

create function securedesk_private.guard_transfer_history() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='DELETE' or old.status<>'pending' then
    raise exception using errcode='23514',message='Completed transfer history is immutable';
  end if;
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
    or new.from_organization_id is distinct from old.from_organization_id or new.to_organization_id is distinct from old.to_organization_id
    or new.source_membership_id is distinct from old.source_membership_id or new.source_access_revision is distinct from old.source_access_revision
    or new.access_code_id is distinct from old.access_code_id or new.reason is distinct from old.reason or new.created_at is distinct from old.created_at then
    raise exception using errcode='23514',message='Submitted transfer fields are immutable';
  end if;
  return new;
end;
$$;
revoke all on function securedesk_private.guard_transfer_history() from public,anon,authenticated,service_role;
create trigger transfer_history before update or delete on public.organization_change_requests for each row execute function securedesk_private.guard_transfer_history();
create trigger transfer_revision before update on public.organization_change_requests for each row execute function securedesk_private.advance_assignment_revision();
create trigger transfer_updated_at before update on public.organization_change_requests for each row execute function securedesk_private.touch_updated_at();
create trigger transfer_approvals_immutable before update or delete on public.organization_change_approvals for each row execute function securedesk_private.guard_audit_history();

create function securedesk_private.transfer_consent_valid(p_approval_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.organization_change_approvals c
    join public.organization_change_requests r on r.id=c.request_id
    join public.organization_admin_assignments a on a.id=c.assignment_id
    join public.organizations o on o.id=a.organization_id
    join public.profiles p on p.id=c.actor_user_id join auth.users u on u.id=p.id
    where c.id=p_approval_id and a.admin_user_id=p.id and a.active and a.revision=c.assignment_revision
      and a.organization_id=case c.side when 'source' then r.from_organization_id else r.to_organization_id end
      and o.status='active' and p.app_role='admin' and p.account_status='active' and p.access_revision=c.actor_access_revision
      and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<=now()));
$$;
revoke all on function securedesk_private.transfer_consent_valid(uuid) from public,anon,authenticated,service_role;

create function public.own_organization_transfer_context()
returns table(organization_name text,can_request boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or securedesk_private.active_actor_role() is distinct from 'client' then
    raise exception using errcode='42501',message='Active Client access is required';
  end if;
  return query select o.name,not exists(select 1 from public.organization_change_requests r where r.user_id=auth.uid() and r.status='pending')
    from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.user_id=auth.uid() and m.status='active' and o.status='active';
end;
$$;

create function public.submit_organization_transfer(p_code text,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; source public.organization_members%rowtype;
  quota securedesk_private.organization_code_attempts%rowtype; target_org uuid; selected_code public.organization_access_codes%rowtype;
  normalized text; description text; request_id uuid;
begin
  -- Serialize transfer mutations before existing per-identity locks. Small MVP workload.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('organization-transfer-workflow',0));
  actor:=securedesk_private.lock_registration_actor();
  if actor.app_role<>'client' or actor.account_status<>'active' then
    raise exception using errcode='42501',message='Active Client access is required';
  end if;
  select m.* into source from public.organization_members m join public.organizations o on o.id=m.organization_id
    where m.user_id=auth.uid() and m.status='active' and o.status='active' for update of m;
  if not found then raise exception using errcode='42501',message='Active Client membership is required'; end if;
  if exists(select 1 from public.organization_change_requests where user_id=auth.uid() and status='pending') then return 'already_pending'; end if;
  select * into quota from securedesk_private.organization_code_attempts where user_id=auth.uid() for update;
  if not found or quota.window_started_at<=clock_timestamp()-interval '15 minutes' then
    insert into securedesk_private.organization_code_attempts(user_id,window_started_at,attempts)
      values(auth.uid(),clock_timestamp(),1) on conflict(user_id) do update set window_started_at=excluded.window_started_at,attempts=1;
  elsif quota.attempts>=5 then return 'rate_limited';
  else update securedesk_private.organization_code_attempts set attempts=attempts+1 where user_id=auth.uid();
  end if;
  description:=nullif(btrim(p_reason),'');
  if char_length(description)>2000 or p_code is null or octet_length(p_code)>256 then return 'unavailable'; end if;
  normalized:=lower(btrim(p_code));
  if normalized !~ '^[0-9a-f]{64}$' then return 'unavailable'; end if;
  select c.organization_id into target_org from public.organization_access_codes c
    where c.code_hash=encode(extensions.digest(normalized,'sha256'),'hex');
  if target_org is null or target_org=source.organization_id then return 'unavailable'; end if;
  -- Lock both companies in stable order, then recheck current eligibility and code.
  perform 1 from public.organizations o where o.id in (source.organization_id,target_org) order by o.id for share;
  if exists(select 1 from public.organizations where id in (source.organization_id,target_org) and status<>'active') then return 'unavailable'; end if;
  select c.* into selected_code from public.organization_access_codes c where c.code_hash=encode(extensions.digest(normalized,'sha256'),'hex') for share;
  if not found or not selected_code.active or selected_code.expires_at<=clock_timestamp() then return 'unavailable'; end if;
  insert into public.organization_change_requests(user_id,from_organization_id,to_organization_id,source_membership_id,source_access_revision,access_code_id,reason)
    values(auth.uid(),source.organization_id,target_org,source.id,actor.access_revision,selected_code.id,description) returning id into request_id;
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
    values(source.organization_id,auth.uid(),'organization_transfer.requested','organization_change_request',request_id,'success'),
      (target_org,auth.uid(),'organization_transfer.requested','organization_change_request',request_id,'success');
  return 'submitted';
end;
$$;

create function public.review_organization_transfer(p_request_id uuid,p_expected_revision bigint,p_intent text,p_side text default null,p_reason text default null)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; request public.organization_change_requests%rowtype;
  target public.profiles%rowtype; source public.organization_members%rowtype;
  assignment public.organization_admin_assignments%rowtype; subject uuid; side_org uuid; reviewer_id uuid;
  complete boolean; decision_reason text; new_membership uuid; switch_at timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('organization-transfer-workflow',0));
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role not in ('admin','super_admin') then
    raise exception using errcode='42501',message='Transfer review is not available';
  end if;
  select r.* into request from public.organization_change_requests r where r.id=p_request_id;
  if not found or not (securedesk_private.can_administer_organization(request.from_organization_id)
    or securedesk_private.can_administer_organization(request.to_organization_id)) then
    raise exception using errcode='42501',message='Transfer review is not available';
  end if;
  subject:=request.user_id;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||subject::text,0));
  select p.* into target from public.profiles p where p.id=subject for update;
  select r.* into request from public.organization_change_requests r where r.id=p_request_id for update;
  if request.status<>'pending' or p_expected_revision is null or request.revision<>p_expected_revision then
    raise exception using errcode='40001',message='Transfer changed; reload before reviewing';
  end if;
  if p_intent is null or p_intent not in ('approve','reject') then raise exception using errcode='22023',message='Invalid transfer decision'; end if;
  if p_intent='approve' and (p_side is null or (actor.app_role='super_admin' and p_side<>'super_admin')
    or (actor.app_role='admin' and p_side not in ('source','destination'))) then
    raise exception using errcode='42501',message='Transfer review is not available';
  end if;
  -- Lock consent actors BEFORE org rows, matching role/assignment mutation lock order.
  -- Transfer mutex prevents opposite consent lock orders across concurrent transfer reviews.
  if p_intent='approve' and actor.app_role='admin' then
    for reviewer_id in select distinct c.actor_user_id from public.organization_change_approvals c
      where c.request_id=request.id order by c.actor_user_id loop
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||reviewer_id::text,0));
      perform 1 from public.profiles p join auth.users u on u.id=p.id where p.id=reviewer_id for share of p,u;
    end loop;
  end if;
  perform 1 from public.organizations o where o.id in (request.from_organization_id,request.to_organization_id) order by o.id for update;
  -- Recheck scope under org locks; revocation routines lock the same org rows.
  if not (securedesk_private.can_administer_organization(request.from_organization_id)
    or securedesk_private.can_administer_organization(request.to_organization_id)) then
    raise exception using errcode='42501',message='Transfer review is not available';
  end if;
  if p_intent='reject' then
    decision_reason:=securedesk_private.required_registration_text(jsonb_build_object('reason',p_reason),'reason',2000);
    update public.organization_change_requests set status='rejected',reviewed_by=auth.uid(),reviewed_at=clock_timestamp(),rejection_reason=decision_reason where id=request.id;
    insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
      values(request.from_organization_id,auth.uid(),'organization_transfer.rejected','organization_change_request',request.id,'success'),
        (request.to_organization_id,auth.uid(),'organization_transfer.rejected','organization_change_request',request.id,'success');
    return 'rejected';
  end if;
  if target.app_role<>'client' or target.account_status<>'active' or target.access_revision<>request.source_access_revision then
    raise exception using errcode='22023',message='The source account or membership has changed';
  end if;
  perform securedesk_private.require_eligible_access_target(subject);
  if exists(select 1 from public.organizations where id in (request.from_organization_id,request.to_organization_id) and status<>'active') then
    raise exception using errcode='22023',message='Both companies must be active';
  end if;
  select m.* into source from public.organization_members m where m.id=request.source_membership_id
    and m.user_id=subject and m.organization_id=request.from_organization_id and m.status='active' for update;
  if not found then raise exception using errcode='22023',message='The source account or membership has changed'; end if;
  perform 1 from public.projects where organization_id=request.to_organization_id and is_general_support and status='active' for share;
  if not found then
    raise exception using errcode='22023',message='An active destination General Support project is required';
  end if;
  if actor.app_role='admin' then
    side_org:=case p_side when 'source' then request.from_organization_id else request.to_organization_id end;
    if not securedesk_private.can_administer_organization(side_org) then
      raise exception using errcode='42501',message='Transfer review is not available';
    end if;
    select a.* into assignment from public.organization_admin_assignments a where a.organization_id=side_org and a.admin_user_id=auth.uid() and a.active for share;
    if not found then raise exception using errcode='42501',message='Transfer review is not available'; end if;
    insert into public.organization_change_approvals(request_id,side,actor_user_id,actor_access_revision,assignment_id,assignment_revision)
      values(request.id,p_side,auth.uid(),actor.access_revision,assignment.id,assignment.revision) on conflict do nothing;
    insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
      values(side_org,auth.uid(),'organization_transfer.consent','organization_change_request',request.id,'success');
    complete:=exists(select 1 from public.organization_change_approvals c where c.request_id=request.id and c.side='source' and securedesk_private.transfer_consent_valid(c.id))
      and exists(select 1 from public.organization_change_approvals c where c.request_id=request.id and c.side='destination' and securedesk_private.transfer_consent_valid(c.id));
  else complete:=true;
  end if;
  if not complete then
    update public.organization_change_requests set updated_at=now() where id=request.id;
    return 'awaiting_other_company';
  end if;
  switch_at:=greatest(clock_timestamp(),source.joined_at);
  update public.organization_members set status='ended',ended_at=switch_at where id=source.id;
  insert into public.organization_members(organization_id,user_id,approved_by,approved_at,joined_at)
    values(request.to_organization_id,subject,auth.uid(),switch_at,switch_at) returning id into new_membership;
  update public.organization_change_requests set status='approved',reviewed_by=auth.uid(),reviewed_at=switch_at where id=request.id;
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(request.from_organization_id,auth.uid(),'organization_transfer.completed','organization_change_request',request.id,'success',jsonb_build_object('membership_id',source.id,'side','source')),
      (request.to_organization_id,auth.uid(),'organization_transfer.completed','organization_change_request',request.id,'success',jsonb_build_object('membership_id',new_membership,'side','destination'));
  return 'approved';
end;
$$;

create function public.organization_transfer_requests(p_status text default 'pending',p_offset integer default 0)
returns table(id uuid,revision text,status text,reason text,rejection_reason text,created_at timestamptz,reviewed_at timestamptz,
  full_name text,email text,source_name text,destination_name text,source_approved boolean,destination_approved boolean,
  can_approve_source boolean,can_approve_destination boolean,can_complete boolean,can_reject boolean)
language plpgsql stable security definer set search_path='' as $$
declare actor_role text;
begin
  actor_role:=securedesk_private.active_actor_role();
  if auth.role() is distinct from 'authenticated' or coalesce(actor_role,'') not in ('client','admin','super_admin') then
    raise exception using errcode='42501',message='Transfer requests are not available';
  end if;
  if p_status is null or p_status not in ('pending','reviewed','all') or p_offset is null or p_offset not between 0 and 249975 then
    raise exception using errcode='22023',message='Invalid transfer filters';
  end if;
  return query select r.id,r.revision::text,r.status,r.reason,r.rejection_reason,r.created_at,r.reviewed_at,
    case when actor_role in ('admin','super_admin') then p.full_name end,
    case when actor_role in ('admin','super_admin') then u.email::text end,
    case when actor_role in ('admin','super_admin') or securedesk_private.can_read_organization(r.from_organization_id) then source.name end,
    case when actor_role in ('admin','super_admin') or securedesk_private.can_read_organization(r.to_organization_id) then dest.name end,
    case when r.status='pending' then exists(select 1 from public.organization_change_approvals c where c.request_id=r.id and c.side='source' and securedesk_private.transfer_consent_valid(c.id)) else r.status='approved' end,
    case when r.status='pending' then exists(select 1 from public.organization_change_approvals c where c.request_id=r.id and c.side='destination' and securedesk_private.transfer_consent_valid(c.id)) else r.status='approved' end,
    r.status='pending' and actor_role='admin' and securedesk_private.can_administer_organization(r.from_organization_id),
    r.status='pending' and actor_role='admin' and securedesk_private.can_administer_organization(r.to_organization_id),
    r.status='pending' and actor_role='super_admin',
    r.status='pending' and actor_role in ('admin','super_admin')
    from public.organization_change_requests r join public.profiles p on p.id=r.user_id join auth.users u on u.id=p.id
    join public.organizations source on source.id=r.from_organization_id join public.organizations dest on dest.id=r.to_organization_id
    where ((actor_role='client' and r.user_id=auth.uid()) or (actor_role in ('admin','super_admin')
      and (securedesk_private.can_administer_organization(r.from_organization_id) or securedesk_private.can_administer_organization(r.to_organization_id))))
      and (p_status='all' or (p_status='pending' and r.status='pending') or (p_status='reviewed' and r.status<>'pending'))
    order by r.created_at desc,r.id limit 26 offset p_offset;
end;
$$;

revoke all on function public.own_organization_transfer_context(),public.submit_organization_transfer(text,text),
  public.review_organization_transfer(uuid,bigint,text,text,text),public.organization_transfer_requests(text,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.own_organization_transfer_context(),public.submit_organization_transfer(text,text),
  public.review_organization_transfer(uuid,bigint,text,text,text),public.organization_transfer_requests(text,integer) to authenticated;
