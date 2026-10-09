-- US-08/09: controlled roles and organization assignments; no direct table-write grants.
-- Revisions guard old forms after a later revoke/regrant or role change.
alter table public.profiles add column access_revision bigint not null default 1 check(access_revision>0);
alter table public.staff_organization_assignments add column revision bigint not null default 1 check(revision>0);
alter table public.organization_admin_assignments add column revision bigint not null default 1 check(revision>0);
create function securedesk_private.advance_access_revision() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  new.access_revision:=old.access_revision+case when new.app_role is distinct from old.app_role
    or new.account_status is distinct from old.account_status then 1 else 0 end;
  return new;
end;
$$;
create function securedesk_private.advance_assignment_revision() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  new.revision:=old.revision+1; return new;
end;
$$;
revoke all on function securedesk_private.advance_access_revision(),securedesk_private.advance_assignment_revision()
  from public,anon,authenticated,service_role;
create trigger profiles_access_revision before update on public.profiles for each row execute function securedesk_private.advance_access_revision();
create trigger staff_assignment_revision before update on public.staff_organization_assignments for each row execute function securedesk_private.advance_assignment_revision();
create trigger admin_assignment_revision before update on public.organization_admin_assignments for each row execute function securedesk_private.advance_assignment_revision();

-- Reuse registration target serialization before organization/assignment locks.
create function securedesk_private.lock_access_target(target_user uuid,expected_revision bigint)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare target public.profiles%rowtype;
begin
  if target_user is null or expected_revision is null or expected_revision<1 or target_user=auth.uid() then
    raise exception using errcode='42501',message='Access change is not available';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||target_user::text,0));
  select p.* into target from public.profiles p where p.id=target_user for update;
  if not found or target.access_revision<>expected_revision or target.app_role='super_admin' then
    raise exception using errcode='42501',message='Access change is not available';
  end if;
  return target;
end;
$$;
create function securedesk_private.require_eligible_access_target(target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform 1 from auth.users u where u.id=target_user and u.email_confirmed_at is not null
    and not coalesce(u.is_anonymous,false) and u.deleted_at is null
    and (u.banned_until is null or u.banned_until<=now()) for share;
  if not found then raise exception using errcode='22023',message='A confirmed eligible account is required'; end if;
end;
$$;
-- Revocation may remove access in any org state; new grants require an active organization.
create function securedesk_private.lock_access_organization(target_org uuid,granting boolean) returns void
language plpgsql security definer set search_path='' as $$
declare org_status text;
begin
  select o.status into org_status from public.organizations o where o.id=target_org for update;
  if not found then raise exception using errcode='42501',message='Access change is not available'; end if;
  if securedesk_private.active_actor_role() is distinct from 'super_admin' then
    perform 1 from public.organization_admin_assignments a where a.organization_id=target_org and a.admin_user_id=auth.uid() and a.active for share;
    if not found then raise exception using errcode='42501',message='Access change is not available'; end if;
  end if;
  if granting and org_status<>'active' then raise exception using errcode='22023',message='Assignment requires an active organization'; end if;
end;
$$;
revoke all on function securedesk_private.lock_access_target(uuid,bigint),securedesk_private.require_eligible_access_target(uuid),
  securedesk_private.lock_access_organization(uuid,boolean) from public,anon,authenticated,service_role;

-- Future Staff/Admin use the same signup without gaining a Client membership or company.
create function public.approve_privileged_registration(p_request_id uuid,p_role text,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; request public.registration_requests%rowtype; reason text;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role<>'super_admin' then raise exception using errcode='42501',message='Super Admin access is required'; end if;
  if p_role is null or p_role not in ('staff','admin') then raise exception using errcode='22023',message='Choose Staff or Admin'; end if;
  reason:=securedesk_private.required_registration_text(jsonb_build_object('reason',p_reason),'reason',2000);
  request:=securedesk_private.lock_pending_registration(p_request_id);
  if request.target_organization_id is not null then raise exception using errcode='22023',message='Privileged registration requires an unrouted request'; end if;
  perform securedesk_private.validate_new_client(request.user_id);
  update public.profiles set app_role=p_role,account_status='active' where id=request.user_id;
  update public.registration_requests set status='approved',reviewed_by=auth.uid(),reviewed_at=now() where id=p_request_id;
  insert into public.audit_logs(actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(auth.uid(),'registration.privileged_approved','registration_request',p_request_id,'success',
      jsonb_build_object('user_id',request.user_id,'attempt_number',request.attempt_number,'role',p_role,'reason',reason));
  return p_request_id;
end;
$$;

-- Changed role disables all old assignments. A demoted Client has no company access.
-- Active Client membership requires a separate explicit membership transition.
create function public.change_account_role(p_user_id uuid,p_expected_access_revision bigint,p_new_role text,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; target public.profiles%rowtype; reason text; staff_revoked integer; admins_revoked integer;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role<>'super_admin' then raise exception using errcode='42501',message='Super Admin access is required'; end if;
  if p_new_role is null or p_new_role not in ('client','staff','admin') then raise exception using errcode='22023',message='Invalid account role'; end if;
  reason:=securedesk_private.required_registration_text(jsonb_build_object('reason',p_reason),'reason',2000);
  target:=securedesk_private.lock_access_target(p_user_id,p_expected_access_revision);
  if target.account_status<>'active' then raise exception using errcode='42501',message='Access change is not available'; end if;
  -- Revoking a privileged role remains possible even when its owner is banned/deleted.
  if p_new_role<>'client' then perform securedesk_private.require_eligible_access_target(p_user_id); end if;
  if exists(select 1 from public.organization_members where user_id=p_user_id and status='active') then
    raise exception using errcode='22023',message='Active Client membership requires a separate transition';
  end if;
  if target.app_role=p_new_role then return p_user_id; end if;
  update public.staff_organization_assignments set active=false,can_create_project=false where staff_user_id=p_user_id and (active or can_create_project);
  get diagnostics staff_revoked=row_count;
  update public.organization_admin_assignments set active=false where admin_user_id=p_user_id and active;
  get diagnostics admins_revoked=row_count;
  update public.profiles set app_role=p_new_role where id=p_user_id;
  insert into public.audit_logs(actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(auth.uid(),'account.role_changed','profile',p_user_id,'success',jsonb_build_object(
      'previous_role',target.app_role,'role',p_new_role,'reason',reason,'staff_assignments_revoked',staff_revoked,'admin_assignments_revoked',admins_revoked));
  return p_user_id;
end;
$$;

create function public.set_staff_organization_assignment(p_organization_id uuid,p_staff_user_id uuid,
  p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_active boolean,p_can_create_project boolean,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; target public.profiles%rowtype; assignment public.staff_organization_assignments%rowtype;
  reason text; previous_active boolean; previous_permission boolean;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role not in ('super_admin','admin') then raise exception using errcode='42501',message='Administrator access is required'; end if;
  if p_active is null or p_can_create_project is null or (not p_active and p_can_create_project) then raise exception using errcode='22023',message='Invalid assignment permissions'; end if;
  reason:=securedesk_private.required_registration_text(jsonb_build_object('reason',p_reason),'reason',2000);
  target:=securedesk_private.lock_access_target(p_staff_user_id,p_expected_access_revision);
  if target.app_role<>'staff' then raise exception using errcode='42501',message='Access change is not available'; end if;
  perform securedesk_private.lock_access_organization(p_organization_id,p_active);
  if p_active then
    if target.account_status<>'active' then raise exception using errcode='42501',message='Access change is not available'; end if;
    perform securedesk_private.require_eligible_access_target(p_staff_user_id);
  end if;
  select s.* into assignment from public.staff_organization_assignments s where s.organization_id=p_organization_id and s.staff_user_id=p_staff_user_id for update;
  if found then
    if p_expected_assignment_revision is null or assignment.revision<>p_expected_assignment_revision then
      raise exception using errcode='42501',message='Assignment changed; reload before trying again';
    end if;
    if assignment.active=p_active and assignment.can_create_project=p_can_create_project then return assignment.id; end if;
    previous_active:=assignment.active; previous_permission:=assignment.can_create_project;
    update public.staff_organization_assignments set active=p_active,can_create_project=p_can_create_project,assigned_by=auth.uid() where id=assignment.id;
  else
    if p_expected_assignment_revision is not null or not p_active then raise exception using errcode='42501',message='Assignment changed; reload before trying again'; end if;
    previous_active:=false; previous_permission:=false;
    insert into public.staff_organization_assignments(organization_id,staff_user_id,assigned_by,can_create_project)
      values(p_organization_id,p_staff_user_id,auth.uid(),p_can_create_project) returning * into assignment;
  end if;
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(p_organization_id,auth.uid(),'staff.assignment_changed','staff_assignment',assignment.id,'success',jsonb_build_object(
      'user_id',p_staff_user_id,'previous_active',previous_active,'active',p_active,
      'previous_can_create_project',previous_permission,'can_create_project',p_can_create_project,'reason',reason));
  return assignment.id;
end;
$$;

create function public.set_organization_admin_assignment(p_organization_id uuid,p_admin_user_id uuid,
  p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_active boolean,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; target public.profiles%rowtype; assignment public.organization_admin_assignments%rowtype;
  reason text; previous_active boolean;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role<>'super_admin' then raise exception using errcode='42501',message='Super Admin access is required'; end if;
  if p_active is null then raise exception using errcode='22023',message='Invalid assignment permissions'; end if;
  reason:=securedesk_private.required_registration_text(jsonb_build_object('reason',p_reason),'reason',2000);
  target:=securedesk_private.lock_access_target(p_admin_user_id,p_expected_access_revision);
  if target.app_role<>'admin' then raise exception using errcode='42501',message='Access change is not available'; end if;
  perform securedesk_private.lock_access_organization(p_organization_id,false);
  if p_active and exists(select 1 from public.organizations where id=p_organization_id and status='inactive') then
    raise exception using errcode='22023',message='Admin assignment requires a pending or active organization';
  end if;
  if p_active then
    if target.account_status<>'active' then raise exception using errcode='42501',message='Access change is not available'; end if;
    perform securedesk_private.require_eligible_access_target(p_admin_user_id);
  end if;
  select a.* into assignment from public.organization_admin_assignments a where a.organization_id=p_organization_id and a.admin_user_id=p_admin_user_id for update;
  if found then
    if p_expected_assignment_revision is null or assignment.revision<>p_expected_assignment_revision then raise exception using errcode='42501',message='Assignment changed; reload before trying again'; end if;
    if assignment.active=p_active then return assignment.id; end if;
    previous_active:=assignment.active;
    update public.organization_admin_assignments set active=p_active,assigned_by=auth.uid() where id=assignment.id;
  else
    if p_expected_assignment_revision is not null or not p_active then raise exception using errcode='42501',message='Assignment changed; reload before trying again'; end if;
    previous_active:=false;
    insert into public.organization_admin_assignments(organization_id,admin_user_id,assigned_by) values(p_organization_id,p_admin_user_id,auth.uid()) returning * into assignment;
  end if;
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(p_organization_id,auth.uid(),'admin.assignment_changed','admin_assignment',assignment.id,'success',
      jsonb_build_object('user_id',p_admin_user_id,'previous_active',previous_active,'active',p_active,'reason',reason));
  return assignment.id;
end;
$$;
revoke all on function public.approve_privileged_registration(uuid,text,text),public.change_account_role(uuid,bigint,text,text),
  public.set_staff_organization_assignment(uuid,uuid,bigint,bigint,boolean,boolean,text),
  public.set_organization_admin_assignment(uuid,uuid,bigint,bigint,boolean,text) from public,anon,authenticated,service_role;
grant execute on function public.approve_privileged_registration(uuid,text,text),public.change_account_role(uuid,bigint,text,text),
  public.set_staff_organization_assignment(uuid,uuid,bigint,bigint,boolean,boolean,text),
  public.set_organization_admin_assignment(uuid,uuid,bigint,bigint,boolean,text) to authenticated;
