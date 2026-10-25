-- Add authorized pending-ticket queues; filter before pagination.
drop function public.ticket_list(uuid,text,integer);
create function public.ticket_list(p_organization_id uuid default null,p_status text default 'all',p_offset integer default 0,p_queue text default 'all')
returns table(id uuid,organization_id uuid,organization_name text,project_name text,title text,status text,priority text,revision text,created_at timestamptz,owner_name text,is_own boolean)
language plpgsql stable security definer set search_path='' as $$
declare role text;
begin
 role:=securedesk_private.active_actor_role();
 if auth.role() is distinct from 'authenticated' or role is null or (p_organization_id is not null and not securedesk_private.can_read_organization(p_organization_id)) then raise exception using errcode='42501',message='Tickets are unavailable'; end if;
 if p_status is null or p_status not in ('all','Open','Assigned','In Progress','Waiting for Client','Resolved','Closed') or p_offset is null or p_offset not between 0 and 249975 or p_queue is null or p_queue not in ('all','sharing','unassigned') then raise exception using errcode='22023',message='Invalid ticket filters'; end if;
 if (p_queue='unassigned' and role not in ('admin','super_admin')) or (p_queue='sharing' and role not in ('admin','super_admin','staff')) then raise exception using errcode='42501',message='Ticket queue is unavailable'; end if;
 return query select t.id,t.organization_id,o.name,p.name,t.title,t.status,t.priority,t.revision::text,t.created_at,owner.full_name,t.client_user_id=auth.uid()
 from public.tickets t join public.organizations o on o.id=t.organization_id join public.projects p on p.id=t.project_id left join public.profiles owner on owner.id=t.owner_staff_user_id
 where (p_organization_id is null or t.organization_id=p_organization_id) and (p_status='all' or t.status=p_status) and securedesk_private.can_read_ticket(t.id)
 and (p_queue='all' or (p_queue='unassigned' and t.status='Open') or (p_queue='sharing' and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid())) and exists(select 1 from public.ticket_participant_requests r where r.ticket_id=t.id and r.status='pending')))
 order by t.created_at desc,t.id limit 26 offset p_offset;
end; $$;
revoke all on function public.ticket_list(uuid,text,integer,text) from public,anon,authenticated,service_role;
grant execute on function public.ticket_list(uuid,text,integer,text) to authenticated;
-- Promoting a collaborator to owner replaces that explicit collaborator role.
do $$ declare definition text; begin
 select pg_get_functiondef('public.manage_ticket(uuid,uuid,bigint,bigint,text,text,text)'::regprocedure) into definition;
 definition:=replace(definition,'update public.tickets set owner_staff_user_id=candidate,','update public.ticket_collaborators set active=false where ticket_id=t.id and staff_user_id=candidate and active; update public.tickets set owner_staff_user_id=candidate,');
 execute definition;
end; $$;
