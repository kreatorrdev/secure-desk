-- Development-only helper, loaded into the current psql session, never a migration/RPC.
-- The wrapper checks the local Docker target. This SQL alone cannot prove locality.
create function pg_temp.bootstrap_super_admin(target_email text, apply_change boolean default false)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare
  selected_user auth.users%rowtype;
  selected_profile public.profiles%rowtype;
  selected_request public.registration_requests%rowtype;
  normalized_email text := lower(btrim(target_email));
begin
  if current_user <> 'postgres' then
    raise exception using errcode='42501', message='Bootstrap requires the local database owner';
  end if;
  if normalized_email is null or normalized_email = '' or apply_change is null then
    raise exception using errcode='22023', message='An exact account email and explicit mode are required';
  end if;

  -- Serialize setup attempts and block competing trusted role/request/assignment writes.
  perform pg_catalog.pg_advisory_xact_lock(734291, 1);
  lock table public.profiles, public.registration_requests in share row exclusive mode;
  lock table public.organization_members, public.staff_organization_assignments,
    public.organization_admin_assignments in share mode;
  if exists (select 1 from public.profiles where app_role='super_admin') then
    raise exception using errcode='22023', message='A Super Admin already exists; first setup is closed';
  end if;
  if (select count(*) from auth.users where lower(email)=normalized_email) <> 1 then
    raise exception using errcode='22023', message='Expected exactly one registered account for this email';
  end if;
  select * into selected_user from auth.users where lower(email)=normalized_email for update;
  if selected_user.email_confirmed_at is null or coalesce(selected_user.is_anonymous,false)
    or selected_user.deleted_at is not null or selected_user.banned_until > now() then
    raise exception using errcode='22023', message='The account must have a confirmed email and be eligible for login';
  end if;
  select * into selected_profile from public.profiles where id=selected_user.id for update;
  if not found or selected_profile.app_role <> 'client' or selected_profile.account_status <> 'pending' then
    raise exception using errcode='22023', message='Expected a client/pending profile for first setup';
  end if;
  if (select count(*) from public.registration_requests where user_id=selected_user.id) <> 1 then
    raise exception using errcode='22023', message='Expected exactly one first registration request';
  end if;
  select * into selected_request from public.registration_requests where user_id=selected_user.id for update;
  if selected_request.attempt_number <> 1 or selected_request.status <> 'pending'
    or selected_request.target_organization_id is not null or selected_request.reviewed_by is not null
    or selected_request.reviewed_at is not null or selected_request.rejection_reason is not null then
    raise exception using errcode='22023', message='Expected an unrouted pending first request';
  end if;
  if exists (select 1 from public.organization_members where user_id=selected_user.id)
    or exists (select 1 from public.staff_organization_assignments where staff_user_id=selected_user.id)
    or exists (select 1 from public.organization_admin_assignments where admin_user_id=selected_user.id) then
    raise exception using errcode='22023', message='The first setup account must have no membership or assignment history';
  end if;

  if apply_change then
    update public.profiles set app_role='super_admin', account_status='active' where id=selected_user.id;
    -- Trusted owner bootstrap, not a permission granted to the registrant for self-approval.
    -- reviewed_by refers to the newly initialized administrator; development docs record the owner procedure.
    update public.registration_requests set status='approved', reviewed_by=selected_user.id,
      reviewed_at=now() where id=selected_request.id;
  end if;
  return pg_catalog.jsonb_build_object('email', normalized_email, 'email_confirmed',true,
    'eligible',true, 'applied',apply_change,
    'role',case when apply_change then 'super_admin' else 'client' end,
    'state',case when apply_change then 'active' else 'pending' end,
    'request_state',case when apply_change then 'approved' else 'pending' end);
end;
$function$;
revoke all on function pg_temp.bootstrap_super_admin(text, boolean)
  from public, anon, authenticated, service_role;
