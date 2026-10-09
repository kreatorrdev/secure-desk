-- Phase 4: tenant invariants and controlled ticket work. No direct application writes.
create table public.tickets (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 project_id uuid not null, client_user_id uuid not null references public.profiles(id), created_by_user_id uuid not null references public.profiles(id), owner_staff_user_id uuid references public.profiles(id),
 title text not null check(btrim(title)<>'' and char_length(title)<=200), description text not null check(btrim(description)<>'' and char_length(description)<=8000),
 status text not null default 'Open' check(status in ('Open','Assigned','In Progress','Waiting for Client','Resolved','Closed')),
 priority text not null default 'Medium' check(priority in ('Low','Medium','High','Critical')),
 resolved_at timestamptz, closed_at timestamptz, close_reason text, revision bigint not null default 1 check(revision>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), foreign key(organization_id,project_id) references public.projects(organization_id,id),
 check(status not in ('Assigned','In Progress','Waiting for Client','Resolved') or owner_staff_user_id is not null),
 check((status in ('Resolved','Closed'))=(resolved_at is not null)), check((status='Closed')=(closed_at is not null and close_reason is not null)),
 check(status='Closed' or (closed_at is null and close_reason is null)), check(close_reason is null or (btrim(close_reason)<>'' and char_length(close_reason)<=2000)),
 check(resolved_at is null or resolved_at>=created_at), check(closed_at is null or closed_at>=resolved_at)
);
create index tickets_org_work on public.tickets(organization_id,status,priority,created_at desc,id);
create index tickets_client on public.tickets(client_user_id,organization_id,created_at desc,id);
create index tickets_owner on public.tickets(owner_staff_user_id,status);
create index tickets_project on public.tickets(project_id);
create index tickets_creator on public.tickets(created_by_user_id);
create table public.ticket_collaborators (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, ticket_id uuid not null,
 staff_user_id uuid not null references public.profiles(id), added_by_user_id uuid not null references public.profiles(id),
 active boolean not null default true, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(ticket_id,staff_user_id), foreign key(organization_id,ticket_id) references public.tickets(organization_id,id)
);
create index ticket_collaborators_staff on public.ticket_collaborators(staff_user_id,ticket_id) where active;
create index ticket_collaborators_parent on public.ticket_collaborators(organization_id,ticket_id);
create index ticket_collaborators_actor on public.ticket_collaborators(added_by_user_id);
create function securedesk_private.guard_ticket_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.id,new.organization_id,new.project_id,new.client_user_id,new.created_by_user_id,new.created_at) is distinct from (old.id,old.organization_id,old.project_id,old.client_user_id,old.created_by_user_id,old.created_at) then raise exception using errcode='22023',message='Ticket identity cannot change'; end if;
 if old.status='Closed' and new is distinct from old then raise exception using errcode='22023',message='Closed is final'; end if;
 if new.status<>old.status and not ((old.status='Open' and new.status='Assigned') or (old.status='Assigned' and new.status in ('Open','In Progress')) or (old.status='In Progress' and new.status in ('Waiting for Client','Resolved')) or (old.status='Waiting for Client' and new.status in ('In Progress','Resolved')) or (old.status='Resolved' and new.status in ('Assigned','Closed'))) then raise exception using errcode='22023',message='Invalid ticket status transition'; end if;
 return new;
end; $$;
revoke all on function securedesk_private.guard_ticket_identity() from public,anon,authenticated,service_role;
create trigger ticket_identity before update on public.tickets for each row execute function securedesk_private.guard_ticket_identity();
create trigger ticket_revision before update on public.tickets for each row execute function securedesk_private.advance_assignment_revision();
create trigger ticket_updated before update on public.tickets for each row execute function securedesk_private.touch_updated_at();
create trigger ticket_collaborator_revision before update on public.ticket_collaborators for each row execute function securedesk_private.advance_assignment_revision();
create trigger ticket_collaborator_updated before update on public.ticket_collaborators for each row execute function securedesk_private.touch_updated_at();
create function securedesk_private.eligible_ticket_user(target_org uuid,target_user uuid,target_role text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=target_user and p.app_role=target_role and p.account_status='active' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now()) and case target_role
 when 'client' then exists(select 1 from public.organization_members m where m.user_id=p.id and m.organization_id=target_org and m.status='active')
 when 'staff' then exists(select 1 from public.staff_organization_assignments s where s.staff_user_id=p.id and s.organization_id=target_org and s.active) else false end);
$$;
create function securedesk_private.can_read_ticket(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tickets t where t.id=target and securedesk_private.can_read_organization(t.organization_id) and case securedesk_private.active_actor_role()
 when 'super_admin' then true when 'admin' then securedesk_private.can_administer_organization(t.organization_id) when 'client' then t.client_user_id=auth.uid()
 when 'staff' then t.owner_staff_user_id=auth.uid() or exists(select 1 from public.ticket_collaborators c where c.ticket_id=t.id and c.staff_user_id=auth.uid() and c.active) else false end);
$$;
revoke all on function securedesk_private.eligible_ticket_user(uuid,uuid,text),securedesk_private.can_read_ticket(uuid) from public,anon,authenticated,service_role;
grant execute on function securedesk_private.can_read_ticket(uuid) to authenticated;
alter table public.tickets enable row level security;
alter table public.ticket_collaborators enable row level security;
revoke all on public.tickets,public.ticket_collaborators from public,anon,authenticated,service_role;
grant select on public.tickets,public.ticket_collaborators to authenticated;
create policy ticket_read on public.tickets for select to authenticated using(securedesk_private.can_read_ticket(id));
create policy ticket_collaborator_read on public.ticket_collaborators for select to authenticated using(securedesk_private.can_read_ticket(ticket_id));
create function securedesk_private.lock_ticket_actor(target_org uuid,expected_access bigint,expected_scope text) returns public.profiles language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; current_scope text; org_status text;
begin
 actor:=securedesk_private.lock_registration_actor();
 if not securedesk_private.can_read_organization(target_org) then raise exception using errcode='42501',message='Ticket access is unavailable'; end if;
 if expected_access is null or actor.access_revision<>expected_access then raise exception using errcode='40001',message='Ticket permissions changed'; end if;
 select status into org_status from public.organizations where id=target_org for update;
 if org_status is distinct from 'active' then raise exception using errcode='22023',message='An active company is required'; end if;
 if actor.app_role='client' then select id::text into current_scope from public.organization_members where organization_id=target_org and user_id=auth.uid() and status='active' for share;
 elsif actor.app_role='staff' then select revision::text into current_scope from public.staff_organization_assignments where organization_id=target_org and staff_user_id=auth.uid() and active for share;
 elsif actor.app_role='admin' then select revision::text into current_scope from public.organization_admin_assignments where organization_id=target_org and admin_user_id=auth.uid() and active for share; end if;
 if not securedesk_private.can_read_organization(target_org) then raise exception using errcode='42501',message='Ticket access is unavailable'; end if;
 if current_scope is distinct from expected_scope then raise exception using errcode='40001',message='Ticket permissions changed'; end if;
 return actor;
end; $$;
revoke all on function securedesk_private.lock_ticket_actor(uuid,bigint,text) from public,anon,authenticated,service_role;
create function public.ticket_context(p_organization_id uuid) returns table(organization_name text,organization_status text,access_revision text,scope_revision text,can_create boolean) language plpgsql stable security definer set search_path='' as $$
declare actor public.profiles%rowtype; scope_version text;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_organization(p_organization_id) then raise exception using errcode='42501',message='Ticket access is unavailable'; end if;
 select * into actor from public.profiles where id=auth.uid();
 if actor.app_role='client' then select id::text into scope_version from public.organization_members where organization_id=p_organization_id and user_id=auth.uid() and status='active';
 elsif actor.app_role='staff' then select revision::text into scope_version from public.staff_organization_assignments where organization_id=p_organization_id and staff_user_id=auth.uid() and active;
 elsif actor.app_role='admin' then select revision::text into scope_version from public.organization_admin_assignments where organization_id=p_organization_id and admin_user_id=auth.uid() and active; end if;
 return query select o.name,o.status,actor.access_revision::text,scope_version,o.status='active' from public.organizations o where o.id=p_organization_id;
end; $$;
create function public.create_ticket(p_organization_id uuid,p_ticket_id uuid,p_project_id uuid,p_client_user_id uuid,p_expected_access_revision bigint,p_expected_scope text,p_details jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; existing public.tickets%rowtype; ticket_title text; ticket_description text;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 if p_ticket_id is null or jsonb_typeof(p_details) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('title','description')) then raise exception using errcode='22023',message='Invalid ticket details'; end if;
 if actor.app_role='client' and p_client_user_id is distinct from auth.uid() then raise exception using errcode='42501',message='Ticket access is unavailable'; end if;
 if not securedesk_private.eligible_ticket_user(p_organization_id,p_client_user_id,'client') then raise exception using errcode='42501',message='An approved company Client is required'; end if;
 perform 1 from public.projects where id=p_project_id and organization_id=p_organization_id and status='active' for share;
 if not found then raise exception using errcode='42501',message='An active company project is required'; end if;
 ticket_title:=securedesk_private.required_registration_text(p_details,'title',200); ticket_description:=securedesk_private.required_registration_text(p_details,'description',8000);
 select * into existing from public.tickets where id=p_ticket_id;
 if found then
  if existing.organization_id=p_organization_id and existing.project_id=p_project_id and existing.client_user_id=p_client_user_id and existing.created_by_user_id=auth.uid() and existing.title=ticket_title and existing.description=ticket_description then return existing.id; end if;
  raise exception using errcode='40001',message='Ticket submission changed';
 end if;
 insert into public.tickets(id,organization_id,project_id,client_user_id,created_by_user_id,title,description) values(p_ticket_id,p_organization_id,p_project_id,p_client_user_id,auth.uid(),ticket_title,ticket_description);
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values(p_organization_id,auth.uid(),'ticket.created','ticket',p_ticket_id,'success',jsonb_build_object('client_user_id',p_client_user_id,'on_behalf',p_client_user_id<>auth.uid()));
 return p_ticket_id;
end; $$;
create function public.manage_ticket(p_organization_id uuid,p_ticket_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_intent text,p_value text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; candidate uuid; is_admin boolean;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(p_ticket_id) then raise exception using errcode='42501',message='Ticket access is unavailable'; end if;
 if p_expected_revision is null or t.revision<>p_expected_revision then raise exception using errcode='40001',message='Ticket changed; reload before updating'; end if;
 if t.status='Closed' then raise exception using errcode='22023',message='Closed is final'; end if;
 is_admin:=securedesk_private.can_administer_organization(p_organization_id);
 if not is_admin and not(actor.app_role='staff' and t.owner_staff_user_id=auth.uid()) then raise exception using errcode='42501',message='Only the owner or company administrator can manage this ticket'; end if;
 if p_intent='owner' then
  if not is_admin then raise exception using errcode='42501',message='Only a company administrator can assign the owner'; end if;
  if t.status='Resolved' then raise exception using errcode='22023',message='Only tickets in work can be reassigned'; end if;
  candidate:=nullif(p_value,'')::uuid;
  if candidate is null and t.status not in ('Open','Assigned') then raise exception using errcode='22023',message='A ticket in progress needs an owner'; end if;
  if candidate is not null and not securedesk_private.eligible_ticket_user(p_organization_id,candidate,'staff') then raise exception using errcode='42501',message='An assigned company Staff member is required'; end if;
  if candidate is not distinct from t.owner_staff_user_id then return t.id; end if;
  update public.tickets set owner_staff_user_id=candidate,status=case when candidate is null then 'Open' when t.status='Open' then 'Assigned' else t.status end where id=t.id;
 elsif p_intent='priority' then
  if p_value is null or p_value not in ('Low','Medium','High','Critical') then raise exception using errcode='22023',message='Invalid priority'; end if;
  if p_value=t.priority then return t.id; end if;
  update public.tickets set priority=p_value where id=t.id;
 elsif p_intent='status' then
  -- Phase 5 owns acceptance, exceptional close and approved reopen.
  if p_value is null or not ((t.status='Assigned' and p_value='In Progress') or (t.status='In Progress' and p_value in ('Waiting for Client','Resolved')) or (t.status='Waiting for Client' and p_value in ('In Progress','Resolved'))) then raise exception using errcode='22023',message='Invalid ticket status transition'; end if;
  if not securedesk_private.eligible_ticket_user(p_organization_id,t.owner_staff_user_id,'staff') then raise exception using errcode='42501',message='An available owner is required'; end if;
  update public.tickets set status=p_value,resolved_at=case when p_value='Resolved' then clock_timestamp() else null end where id=t.id;
 elsif p_intent in ('add_collaborator','remove_collaborator') then
  candidate:=p_value::uuid;
  if candidate is null or candidate=t.owner_staff_user_id then raise exception using errcode='22023',message='Select an additional Staff collaborator'; end if;
  if p_intent='add_collaborator' then
   if not securedesk_private.eligible_ticket_user(p_organization_id,candidate,'staff') then raise exception using errcode='42501',message='An assigned company Staff member is required'; end if;
   if exists(select 1 from public.ticket_collaborators where ticket_id=t.id and staff_user_id=candidate and active) then return t.id; end if;
   insert into public.ticket_collaborators(organization_id,ticket_id,staff_user_id,added_by_user_id) values(p_organization_id,t.id,candidate,auth.uid()) on conflict(ticket_id,staff_user_id) do update set active=true;
  else
   update public.ticket_collaborators set active=false where ticket_id=t.id and staff_user_id=candidate and active;
   if not found then return t.id; end if;
  end if;
  update public.tickets set revision=revision where id=t.id;
 else raise exception using errcode='22023',message='Invalid ticket operation'; end if;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values(p_organization_id,auth.uid(),'ticket.'||p_intent,'ticket',t.id,'success',jsonb_build_object('previous_revision',t.revision,'value',p_value));
 return t.id;
end; $$;
revoke all on function public.ticket_context(uuid),public.create_ticket(uuid,uuid,uuid,uuid,bigint,text,jsonb),public.manage_ticket(uuid,uuid,bigint,bigint,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.ticket_context(uuid),public.create_ticket(uuid,uuid,uuid,uuid,bigint,text,jsonb),public.manage_ticket(uuid,uuid,bigint,bigint,text,text,text) to authenticated;
