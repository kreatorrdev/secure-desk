-- Phase 3: scoped active projects, General Support and explicit project-writing permission.
alter table public.projects add column revision bigint not null default 1 check(revision>0);
create index projects_org_display on public.projects(organization_id,status,is_general_support desc,name,id);
create index projects_creator on public.projects(created_by_user_id);
create function securedesk_private.guard_project_identity() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if (new.id,new.organization_id,new.created_by_user_id,new.created_at,new.is_general_support)
    is distinct from (old.id,old.organization_id,old.created_by_user_id,old.created_at,old.is_general_support) then
    raise exception using errcode='22023',message='Project identity and company cannot change';
  end if;
  return new;
end;
$$;
revoke all on function securedesk_private.guard_project_identity() from public,anon,authenticated,service_role;
create trigger project_identity before update on public.projects for each row execute function securedesk_private.guard_project_identity();
create trigger project_revision before update on public.projects for each row execute function securedesk_private.advance_assignment_revision();

-- Match existing role/assignment lock order: actor identity, org, then assignment.
create function securedesk_private.lock_project_writer(target_org uuid,expected_access bigint,expected_assignment bigint)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; org_status text; assignment_revision bigint;
begin
  actor:=securedesk_private.lock_registration_actor();
  if actor.account_status<>'active' or actor.app_role not in ('super_admin','admin','staff') then
    raise exception using errcode='42501',message='Project writing is not available';
  end if;
  if actor.app_role='admin' and not exists(select 1 from public.organization_admin_assignments where organization_id=target_org and admin_user_id=auth.uid() and active)
    or actor.app_role='staff' and not exists(select 1 from public.staff_organization_assignments where organization_id=target_org and staff_user_id=auth.uid() and active and can_create_project) then
    raise exception using errcode='42501',message='Project writing is not available';
  end if;
  if expected_access is null or expected_access<1 or actor.access_revision<>expected_access then
    raise exception using errcode='40001',message='Project permission has changed';
  end if;
  select status into org_status from public.organizations where id=target_org for update;
  if not found then raise exception using errcode='42501',message='Project writing is not available'; end if;
  if actor.app_role='admin' then
    select revision into assignment_revision from public.organization_admin_assignments where organization_id=target_org and admin_user_id=auth.uid() and active for share;
    if not found then raise exception using errcode='42501',message='Project writing is not available'; end if;
  elsif actor.app_role='staff' then
    select revision into assignment_revision from public.staff_organization_assignments where organization_id=target_org and staff_user_id=auth.uid() and active and can_create_project for share;
    if not found then raise exception using errcode='42501',message='Project writing is not available'; end if;
  end if;
  if actor.app_role='super_admin' then
    if expected_assignment is not null then raise exception using errcode='22023',message='Invalid project permission version'; end if;
  elsif expected_assignment is null or expected_assignment<1 or assignment_revision<>expected_assignment then
    raise exception using errcode='40001',message='Project permission has changed';
  end if;
  if org_status<>'active' then raise exception using errcode='22023',message='An active company is required'; end if;
  return actor;
end;
$$;
revoke all on function securedesk_private.lock_project_writer(uuid,bigint,bigint) from public,anon,authenticated,service_role;

create function public.organization_project_context(p_organization_id uuid)
returns table(organization_name text,organization_status text,can_create boolean,access_revision text,assignment_revision text)
language plpgsql stable security definer set search_path='' as $$
declare actor public.profiles%rowtype; assignment_version bigint;
begin
  if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_organization(p_organization_id) then
    raise exception using errcode='42501',message='Projects are not available';
  end if;
  select * into actor from public.profiles where id=auth.uid();
  if actor.app_role='admin' then select revision into assignment_version from public.organization_admin_assignments where organization_id=p_organization_id and admin_user_id=auth.uid() and active;
  elsif actor.app_role='staff' then select revision into assignment_version from public.staff_organization_assignments where organization_id=p_organization_id and staff_user_id=auth.uid() and active and can_create_project;
  end if;
  return query select o.name,o.status,o.status='active' and (actor.app_role='super_admin' or assignment_version is not null),actor.access_revision::text,assignment_version::text
    from public.organizations o where o.id=p_organization_id;
end;
$$;
create function public.organization_projects(p_organization_id uuid,p_status text default 'active',p_offset integer default 0)
returns table(id uuid,revision text,name text,description text,status text,is_general_support boolean,created_at timestamptz,updated_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_organization(p_organization_id) then
    raise exception using errcode='42501',message='Projects are not available';
  end if;
  if p_status is null or p_status not in ('active','inactive','all') or p_offset is null or p_offset not between 0 and 249975 then
    raise exception using errcode='22023',message='Invalid project filters';
  end if;
  if p_status<>'active' and not securedesk_private.can_administer_organization(p_organization_id) then
    raise exception using errcode='42501',message='Projects are not available';
  end if;
  return query select p.id,p.revision::text,p.name,p.description,p.status,p.is_general_support,p.created_at,p.updated_at
    from public.projects p where p.organization_id=p_organization_id and (p_status='all' or p.status=p_status)
    order by p.is_general_support desc,p.name,p.id limit 26 offset p_offset;
end;
$$;
create function public.create_organization_project(p_organization_id uuid,p_project_id uuid,p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_details jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; project_name text; project_description text; existing public.projects%rowtype;
begin
  actor:=securedesk_private.lock_project_writer(p_organization_id,p_expected_access_revision,p_expected_assignment_revision);
  if p_project_id is null or jsonb_typeof(p_details) is distinct from 'object'
    or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('name','description')) then
    raise exception using errcode='22023',message='Invalid project details';
  end if;
  project_name:=securedesk_private.required_registration_text(p_details,'name',200);
  project_description:=securedesk_private.required_registration_text(p_details,'description',4000);
  if lower(project_name)='general support' then raise exception using errcode='22023',message='General Support is created automatically'; end if;
  select * into existing from public.projects where id=p_project_id;
  if found then
    if existing.organization_id=p_organization_id and existing.created_by_user_id=auth.uid() and not existing.is_general_support
      and existing.name=project_name and existing.description=project_description and existing.status='active' then return existing.id; end if;
    raise exception using errcode='40001',message='This project submission has changed';
  end if;
  insert into public.projects(id,organization_id,name,description,created_by_user_id)
    values(p_project_id,p_organization_id,project_name,project_description,auth.uid());
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
    values(p_organization_id,auth.uid(),'project.created','project',p_project_id,'success');
  return p_project_id;
end;
$$;
create function public.update_organization_project(p_organization_id uuid,p_project_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_details jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; project public.projects%rowtype; project_name text; project_description text;
begin
  actor:=securedesk_private.lock_project_writer(p_organization_id,p_expected_access_revision,p_expected_assignment_revision);
  select * into project from public.projects where id=p_project_id and organization_id=p_organization_id for update;
  if not found then raise exception using errcode='42501',message='Project writing is not available'; end if;
  if p_expected_revision is null or p_expected_revision<1 or project.revision<>p_expected_revision then
    raise exception using errcode='40001',message='Project has changed; reload before editing';
  end if;
  if project.status<>'active' then raise exception using errcode='22023',message='Only active projects can be edited'; end if;
  if jsonb_typeof(p_details) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('name','description')) then
    raise exception using errcode='22023',message='Invalid project details';
  end if;
  project_name:=securedesk_private.required_registration_text(p_details,'name',200);
  project_description:=securedesk_private.required_registration_text(p_details,'description',4000);
  if (project.is_general_support and project_name<>'General Support') or (not project.is_general_support and lower(project_name)='general support') then
    raise exception using errcode='22023',message='General Support name is reserved';
  end if;
  if project.name=project_name and project.description=project_description then return project.id; end if;
  update public.projects set name=project_name,description=project_description where id=project.id;
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
    values(p_organization_id,auth.uid(),'project.updated','project',project.id,'success',jsonb_build_object('previous_revision',project.revision,'revision',project.revision+1));
  return project.id;
end;
$$;
revoke all on function public.organization_project_context(uuid),public.organization_projects(uuid,text,integer),
  public.create_organization_project(uuid,uuid,bigint,bigint,jsonb),public.update_organization_project(uuid,uuid,bigint,bigint,bigint,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.organization_project_context(uuid),public.organization_projects(uuid,text,integer),
  public.create_organization_project(uuid,uuid,bigint,bigint,jsonb),public.update_organization_project(uuid,uuid,bigint,bigint,bigint,jsonb) to authenticated;
