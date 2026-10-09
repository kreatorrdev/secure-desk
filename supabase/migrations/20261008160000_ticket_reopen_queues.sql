-- Phase 5: bounded pending continuation work, using the same owner/admin scope as decisions.
create or replace function public.ticket_list(p_organization_id uuid default null,p_status text default 'all',p_offset integer default 0,p_queue text default 'all')
returns table(id uuid,organization_id uuid,organization_name text,project_name text,title text,status text,priority text,revision text,created_at timestamptz,owner_name text,is_own boolean)
language plpgsql stable security definer set search_path='' as $$
declare role text;
begin
 role:=securedesk_private.active_actor_role();
 if auth.role() is distinct from 'authenticated' or role is null or (p_organization_id is not null and not securedesk_private.can_read_organization(p_organization_id)) then raise exception using errcode='42501',message='Tickets are unavailable'; end if;
 if p_status is null or p_status not in ('all','Open','Assigned','In Progress','Waiting for Client','Resolved','Closed') or p_offset is null or p_offset not between 0 and 249975 or p_queue is null or p_queue not in ('all','sharing','unassigned','reopen') then raise exception using errcode='22023',message='Invalid ticket filters'; end if;
 if (p_queue='unassigned' and role not in ('admin','super_admin')) or (p_queue in ('sharing','reopen') and role not in ('admin','super_admin','staff')) then raise exception using errcode='42501',message='Ticket queue is unavailable'; end if;
 return query select t.id,t.organization_id,o.name,p.name,t.title,t.status,t.priority,t.revision::text,t.created_at,owner.full_name,t.client_user_id=auth.uid()
 from public.tickets t join public.organizations o on o.id=t.organization_id join public.projects p on p.id=t.project_id left join public.profiles owner on owner.id=t.owner_staff_user_id
 where (p_organization_id is null or t.organization_id=p_organization_id) and (p_status='all' or t.status=p_status) and securedesk_private.can_read_ticket(t.id)
 and (p_queue='all' or (p_queue='unassigned' and t.status='Open') or (p_queue='sharing' and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid())) and exists(select 1 from public.ticket_participant_requests r where r.ticket_id=t.id and r.status='pending')) or (p_queue='reopen' and t.status='Resolved' and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid())) and exists(select 1 from public.ticket_reopen_requests r where r.ticket_id=t.id and r.status='pending')))
 order by t.created_at desc,t.id limit 26 offset p_offset;
end; $$;

create or replace function public.workspace_dashboard() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare role text; ticket_counts jsonb; queues jsonb;
begin
 role:=securedesk_private.active_actor_role();
 if auth.role() is distinct from 'authenticated' or role is null then raise exception using errcode='42501',message='Dashboard is unavailable'; end if;
 select coalesce(jsonb_object_agg(s.status,s.total),'{}'::jsonb) into ticket_counts from (select t.status,count(*) as total from public.tickets t where securedesk_private.can_read_ticket(t.id) group by t.status) s;
 queues:=jsonb_build_object('sharing',(select count(*) from public.ticket_participant_requests r join public.tickets t on t.id=r.ticket_id where r.status='pending' and securedesk_private.can_read_ticket(t.id) and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid()))));
 if role in ('staff','admin','super_admin') then
  queues:=queues||jsonb_build_object('reopen',(select count(*) from public.ticket_reopen_requests r join public.tickets t on t.id=r.ticket_id where r.status='pending' and t.status='Resolved' and securedesk_private.can_read_ticket(t.id) and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid()))));
 end if;
 if role in ('admin','super_admin') then
  queues:=queues||jsonb_build_object('registrations',(select count(*) from public.registration_requests r where r.status='pending' and securedesk_private.registration_review_allowed(r.target_organization_id)),
  'proposals',(select count(*) from public.project_proposals p where p.status='pending' and securedesk_private.can_administer_organization(p.organization_id)),
  'transfers',(select count(*) from public.organization_change_requests r where r.status='pending' and (securedesk_private.can_administer_organization(r.from_organization_id) or securedesk_private.can_administer_organization(r.to_organization_id))),
  'unassigned_tickets',(select count(*) from public.tickets t where t.status='Open' and securedesk_private.can_administer_organization(t.organization_id)));
 elsif role='staff' then
  queues:=queues||jsonb_build_object('proposal_reviews',(select count(*) from public.project_proposals p where p.status='pending' and p.reviewer_staff_user_id=auth.uid() and securedesk_private.can_read_proposal(p.id)));
 end if;
 return jsonb_build_object('role',role,'ticket_counts',ticket_counts,'queues',queues,'projects',(select count(*) from public.projects p where p.status='active' and securedesk_private.can_read_organization(p.organization_id)),
 'project_preview',coalesce((select jsonb_agg(x) from (select p.id,p.organization_id,p.name,o.name as organization_name from public.projects p join public.organizations o on o.id=p.organization_id where p.status='active' and securedesk_private.can_read_organization(p.organization_id) order by p.is_general_support desc,p.name,p.id limit 6) x),'[]'::jsonb));
end; $$;

revoke all on function public.ticket_list(uuid,text,integer,text),public.workspace_dashboard() from public,anon,authenticated,service_role;
grant execute on function public.ticket_list(uuid,text,integer,text),public.workspace_dashboard() to authenticated;
