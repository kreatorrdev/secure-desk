-- Minimal read-only roster. Original profile/table grants and write routines stay unchanged.
create function public.admin_organization_people(
  p_organization_id uuid,
  p_kind text default 'client',
  p_status text default 'active',
  p_offset integer default 0
)
returns table (
  id uuid, full_name text, email text, link_status text,
  since timestamptz, ended_at timestamptz, updated_at timestamptz,
  can_create_project boolean, has_current_access boolean
)
language plpgsql stable security definer set search_path='' as $$
declare organization_status text;
begin
  -- Scope is checked before parameters or identities; foreign and missing orgs are alike.
  if auth.role() is distinct from 'authenticated'
    or coalesce(securedesk_private.active_actor_role(),'') not in ('super_admin','admin')
    or not securedesk_private.can_administer_organization(p_organization_id) then
    raise exception using errcode='42501',message='Organization people are not available';
  end if;
  if p_kind is null or p_kind not in ('client','staff','admin')
    or p_status is null or p_status not in ('active','inactive','all')
    or p_offset is null or p_offset not between 0 and 249950 then
    raise exception using errcode='22023',message='Invalid people filter';
  end if;
  select o.status into organization_status from public.organizations o where o.id=p_organization_id;

  return query
  with links as (
    select m.id,m.user_id,m.status='active' as active,m.status as state,
      m.joined_at as since,m.ended_at,m.updated_at,null::boolean as project_permission
    from public.organization_members m
    where p_kind='client' and m.organization_id=p_organization_id
    union all
    select s.id,s.staff_user_id,s.active,case when s.active then 'active' else 'revoked' end,
      s.created_at,null::timestamptz,s.updated_at,s.can_create_project
    from public.staff_organization_assignments s
    where p_kind='staff' and s.organization_id=p_organization_id
    union all
    select a.id,a.admin_user_id,a.active,case when a.active then 'active' else 'revoked' end,
      a.created_at,null::timestamptz,a.updated_at,null::boolean
    from public.organization_admin_assignments a
    where p_kind='admin' and a.organization_id=p_organization_id
  ), people as (
    select l.*,p.full_name,u.email::text as person_email,
      (l.active and organization_status='active' and p.app_role=p_kind and p.account_status='active'
        and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
        and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())) as current_access
    from links l join public.profiles p on p.id=l.user_id join auth.users u on u.id=p.id
    where p_status='all' or (p_status='active' and l.active) or (p_status='inactive' and not l.active)
  )
  select r.id,r.full_name,r.person_email,r.state,r.since,r.ended_at,r.updated_at,
    case when p_kind='staff' then r.project_permission and r.current_access else null end,
    r.current_access
  from people r order by lower(r.full_name),r.user_id,r.id
  limit 26 offset p_offset;
end;
$$;
revoke all on function public.admin_organization_people(uuid,text,text,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.admin_organization_people(uuid,text,text,integer) to authenticated;
