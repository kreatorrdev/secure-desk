-- Read-only DTOs for controlled access forms. Mutation guards and table grants stay unchanged.
create function securedesk_private.access_organization_visible(target_org uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.organizations o where o.id=target_org and (
    securedesk_private.active_actor_role()='super_admin' or (
      securedesk_private.active_actor_role()='admin' and exists(select 1 from public.organization_admin_assignments a
        where a.organization_id=o.id and a.admin_user_id=auth.uid() and a.active))));
$$;
revoke all on function securedesk_private.access_organization_visible(uuid) from public,anon,authenticated,service_role;

create function public.admin_access_organizations(p_search text default '',p_organization_id uuid default null)
returns table(id uuid,name text,status text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or coalesce(securedesk_private.active_actor_role(),'') not in ('super_admin','admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  if p_search is null or char_length(p_search)>200 then raise exception using errcode='22023',message='Invalid company search'; end if;
  return query select o.id,o.name,o.status from public.organizations o
    where securedesk_private.access_organization_visible(o.id) and (p_organization_id is null or o.id=p_organization_id) and position(lower(btrim(p_search)) in lower(o.name))>0
    order by lower(o.name),o.id limit 101;
end;
$$;

create function public.admin_access_target(p_email text,p_organization_id uuid default null)
returns table(id uuid,full_name text,email text,app_role text,account_status text,auth_eligible boolean,access_revision text,
  latest_request jsonb,has_active_membership boolean,staff_assignment jsonb,admin_assignment jsonb,
  can_approve_privileged boolean,can_change_role boolean,can_grant_staff boolean,can_revoke_staff boolean,
  can_grant_admin boolean,can_revoke_admin boolean)
language plpgsql stable security definer set search_path='' as $$
declare actor_role text; org_status text;
begin
  actor_role:=securedesk_private.active_actor_role();
  if auth.role() is distinct from 'authenticated' or coalesce(actor_role,'') not in ('super_admin','admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  if p_email is null or char_length(btrim(p_email)) not between 3 and 254
    or btrim(p_email)!~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception using errcode='22023',message='Enter an exact email address';
  end if;
  if p_organization_id is not null then
    if not securedesk_private.access_organization_visible(p_organization_id) then
      raise exception using errcode='42501',message='Company access is not available';
    end if;
    select o.status into org_status from public.organizations o where o.id=p_organization_id;
  elsif actor_role<>'super_admin' then
    raise exception using errcode='42501',message='Choose an assigned company';
  end if;
  return query
  with target as (
    select p.*,u.email::text as verified_email,
      (u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and u.deleted_at is null
        and (u.banned_until is null or u.banned_until<=now())) as eligible,
      exists(select 1 from public.organization_members m where m.user_id=p.id and m.status='active') as active_member,
      (exists(select 1 from public.organization_members m where m.user_id=p.id)
        or exists(select 1 from public.staff_organization_assignments s where s.staff_user_id=p.id)
        or exists(select 1 from public.organization_admin_assignments a where a.admin_user_id=p.id)) as has_history
    from public.profiles p join auth.users u on u.id=p.id where lower(u.email)=lower(btrim(p_email))
  ), detail as (
    select t.*,r.id as request_id,r.attempt_number,r.company_name_text,r.message,r.phone as request_phone,r.created_at as request_created,
      (t.id<>auth.uid() and t.app_role='client' and t.account_status='pending' and t.eligible and not t.has_history
        and r.status='pending' and r.target_organization_id is null) as approvable,
      s.id as staff_id,s.active as staff_active,s.can_create_project,s.revision as staff_revision,
      a.id as admin_id,a.active as admin_active,a.revision as admin_revision
    from target t
    left join lateral(select req.* from public.registration_requests req where req.user_id=t.id order by req.attempt_number desc limit 1) r on true
    left join public.staff_organization_assignments s on s.staff_user_id=t.id and s.organization_id=p_organization_id
    left join public.organization_admin_assignments a on a.admin_user_id=t.id and a.organization_id=p_organization_id
    where actor_role='super_admin' or (t.app_role='staff' and t.account_status='active' and t.eligible) or s.id is not null
  )
  select d.id,d.full_name,d.verified_email,d.app_role,d.account_status,d.eligible,d.access_revision::text,
    case when actor_role='super_admin' and d.app_role='client' and d.account_status='pending' then
      jsonb_build_object('id',d.request_id,'attempt_number',d.attempt_number,'company_name',d.company_name_text,
        'message',d.message,'phone',d.request_phone,'created_at',d.request_created) else null end,
    (actor_role='super_admin' and d.active_member),
    case when d.staff_id is null then null else jsonb_build_object('id',d.staff_id,'active',d.staff_active,
      'can_create_project',d.can_create_project,'revision',d.staff_revision::text) end,
    case when actor_role<>'super_admin' or d.admin_id is null then null else jsonb_build_object('id',d.admin_id,'active',d.admin_active,'revision',d.admin_revision::text) end,
    coalesce(actor_role='super_admin' and d.approvable,false),
    (actor_role='super_admin' and d.id<>auth.uid() and d.app_role<>'super_admin' and d.account_status='active'
      and not d.active_member and (d.eligible or d.app_role in ('staff','admin'))),
    coalesce(d.id<>auth.uid() and d.app_role='staff' and d.account_status='active' and d.eligible and org_status='active',false),
    (d.id<>auth.uid() and d.app_role='staff' and d.staff_id is not null and (d.staff_active or d.can_create_project)),
    coalesce(actor_role='super_admin' and d.id<>auth.uid() and d.app_role='admin' and d.account_status='active'
      and d.eligible and org_status in ('pending','active'),false),
    (actor_role='super_admin' and d.id<>auth.uid() and d.app_role='admin' and d.admin_id is not null and d.admin_active)
  from detail d order by d.id limit 1;
end;
$$;
revoke all on function public.admin_access_organizations(text,uuid),public.admin_access_target(text,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.admin_access_organizations(text,uuid),public.admin_access_target(text,uuid) to authenticated;
