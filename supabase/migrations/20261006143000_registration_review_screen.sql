-- Read-only UI accessors. Existing review mutations and table grants remain unchanged.
begin;
create function public.current_account_role() returns text
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then
    raise exception using errcode='42501',message='A verified account is required';
  end if;
  return securedesk_private.active_actor_role();
end;
$$;

create function public.admin_registration_organizations(p_search text default '')
returns table (id uuid,name text,description text,address text,email text,phone text,status text,industry text,contact_person text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or coalesce(securedesk_private.active_actor_role(),'') not in ('admin','super_admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  if p_search is null or length(p_search)>200 then
    raise exception using errcode='22023',message='Invalid company search';
  end if;
  return query select o.id,o.name,o.description,o.address,o.email,o.phone,o.status,o.industry,o.contact_person
    from public.organizations o where o.status in ('pending','active')
      and securedesk_private.registration_review_allowed(o.id)
      and position(lower(trim(p_search)) in lower(o.name))>0
    order by lower(o.name),o.id limit 101;
end;
$$;

create function public.admin_registration_queue(p_view text default 'pending',p_limit integer default 11,p_offset integer default 0)
returns table (id uuid,attempt_number integer,full_name text,email text,email_confirmed boolean,
  company_name_text text,message text,phone text,target_organization_id uuid,organization_name text,organization_status text,organization_details jsonb,
  status text,rejection_reason text,reviewed_at timestamptz,created_at timestamptz,can_review boolean,can_approve boolean)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or coalesce(securedesk_private.active_actor_role(),'') not in ('admin','super_admin') then
    raise exception using errcode='42501',message='Administrator access is required';
  end if;
  if p_view is null or p_view not in ('pending','reviewed') or p_limit is null or p_limit not between 1 and 100
    or p_offset is null or p_offset not between 0 and 100000 then
    raise exception using errcode='22023',message='Invalid review page';
  end if;
  return query select r.id,r.attempt_number,p.full_name,u.email::text,u.email_confirmed_at is not null,
    r.company_name_text,r.message,r.phone,r.target_organization_id,o.name,o.status,case when o.id is null then null else jsonb_build_object('id',o.id,'name',o.name,'status',o.status,'address',o.address,'email',o.email,'phone',o.phone,'description',o.description,'industry',o.industry,'contact_person',o.contact_person) end,
    r.status,r.rejection_reason,r.reviewed_at,r.created_at,
    (r.status='pending' and p.app_role='client' and p.account_status='pending'
      and r.attempt_number=(select max(last.attempt_number) from public.registration_requests last where last.user_id=r.user_id)),
    (r.status='pending' and p.app_role='client' and p.account_status='pending'
      and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<=now()))
    from public.registration_requests r join public.profiles p on p.id=r.user_id join auth.users u on u.id=p.id
    left join public.organizations o on o.id=r.target_organization_id
    where securedesk_private.registration_review_allowed(r.target_organization_id)
      and ((p_view='pending' and r.status='pending') or (p_view='reviewed' and r.status in ('approved','rejected')))
    order by case when p_view='reviewed' then r.reviewed_at end desc,r.created_at,r.id limit p_limit offset p_offset;
end;
$$;

revoke all on function public.current_account_role(),public.admin_registration_organizations(text),public.admin_registration_queue(text,integer,integer) from public,anon,authenticated,service_role;
grant execute on function public.current_account_role(),public.admin_registration_organizations(text),public.admin_registration_queue(text,integer,integer) to authenticated;
commit;

