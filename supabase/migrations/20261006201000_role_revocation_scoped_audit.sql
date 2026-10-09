-- Complete each affected organization audit when a global role change revokes assignments.
-- Earlier applied migrations stay unchanged. Same role guards, revisions, lock order and grants.
create or replace function public.change_account_role(p_user_id uuid,p_expected_access_revision bigint,p_new_role text,p_reason text)
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
  with revoked as (
    update public.staff_organization_assignments set active=false,can_create_project=false
      where staff_user_id=p_user_id and (active or can_create_project) returning id,organization_id
  )
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    select organization_id,auth.uid(),'staff.assignment_revoked_by_role_change','staff_assignment',id,'success',
      jsonb_build_object('user_id',p_user_id,'active',false,'can_create_project',false,'reason',reason) from revoked;
  get diagnostics staff_revoked=row_count;
  with revoked as (
    update public.organization_admin_assignments set active=false where admin_user_id=p_user_id and active returning id,organization_id
  )
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    select organization_id,auth.uid(),'admin.assignment_revoked_by_role_change','admin_assignment',id,'success',
      jsonb_build_object('user_id',p_user_id,'active',false,'reason',reason) from revoked;
  get diagnostics admins_revoked=row_count;
  update public.profiles set app_role=p_new_role where id=p_user_id;
  insert into public.audit_logs(actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(auth.uid(),'account.role_changed','profile',p_user_id,'success',jsonb_build_object(
      'previous_role',target.app_role,'role',p_new_role,'reason',reason,'staff_assignments_revoked',staff_revoked,'admin_assignments_revoked',admins_revoked));
  return p_user_id;
end;
$$;
