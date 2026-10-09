-- Phase 4: bounded, authorized read DTOs, choice searches and role-based dashboard.
create function public.ticket_options(p_organization_id uuid,p_kind text,p_search text default '',p_ticket_id uuid default null,p_offset integer default 0)
returns table(id uuid,label text) language plpgsql stable security definer set search_path='' as $$
declare role text; t public.tickets%rowtype;
begin
 role:=securedesk_private.active_actor_role();
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_organization(p_organization_id) then raise exception using errcode='42501',message='Ticket choices are unavailable'; end if;
 if p_search is null or char_length(p_search)>100 or p_offset is null or p_offset not between 0 and 249975 then raise exception using errcode='22023',message='Invalid choice search'; end if;
 if p_kind='projects' then
  return query select p.id,p.name from public.projects p where p.organization_id=p_organization_id and p.status='active' and position(lower(btrim(p_search)) in lower(p.name))>0 order by p.is_general_support desc,p.name,p.id limit 26 offset p_offset;
  return;
 end if;
 if p_kind='clients' then
  if role not in ('admin','super_admin','staff') then raise exception using errcode='42501',message='Client choices are unavailable'; end if;
 elsif p_kind in ('staff','share') then
  select * into t from public.tickets where tickets.id=p_ticket_id and organization_id=p_organization_id;
  if not found or not securedesk_private.can_read_ticket(p_ticket_id) then raise exception using errcode='42501',message='Ticket choices are unavailable'; end if;
  if p_kind='staff' and not(securedesk_private.can_administer_organization(p_organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid())) then raise exception using errcode='42501',message='Staff choices are unavailable'; end if;
  if p_kind='share' and not(role='client' and t.client_user_id=auth.uid()) then raise exception using errcode='42501',message='Sharing choices are unavailable'; end if;
 else raise exception using errcode='22023',message='Invalid choice kind'; end if;
 return query select p.id,p.full_name from public.profiles p where securedesk_private.eligible_ticket_user(p_organization_id,p.id,case when p_kind='staff' then 'staff' else 'client' end)
 and (p_kind<>'share' or p.id<>auth.uid()) and position(lower(btrim(p_search)) in lower(p.full_name))>0 order by p.full_name,p.id limit 26 offset p_offset;
end; $$;
create function public.ticket_list(p_organization_id uuid default null,p_status text default 'all',p_offset integer default 0)
returns table(id uuid,organization_id uuid,organization_name text,project_name text,title text,status text,priority text,revision text,created_at timestamptz,owner_name text,is_own boolean)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'authenticated' or securedesk_private.active_actor_role() is null or (p_organization_id is not null and not securedesk_private.can_read_organization(p_organization_id)) then raise exception using errcode='42501',message='Tickets are unavailable'; end if;
 if p_status is null or p_status not in ('all','Open','Assigned','In Progress','Waiting for Client','Resolved','Closed') or p_offset is null or p_offset not between 0 and 249975 then raise exception using errcode='22023',message='Invalid ticket filters'; end if;
 return query select t.id,t.organization_id,o.name,p.name,t.title,t.status,t.priority,t.revision::text,t.created_at,owner.full_name,t.client_user_id=auth.uid()
 from public.tickets t join public.organizations o on o.id=t.organization_id join public.projects p on p.id=t.project_id left join public.profiles owner on owner.id=t.owner_staff_user_id
 where (p_organization_id is null or t.organization_id=p_organization_id) and (p_status='all' or t.status=p_status) and securedesk_private.can_read_ticket(t.id)
 order by t.created_at desc,t.id limit 26 offset p_offset;
end; $$;
create function public.ticket_detail(p_organization_id uuid,p_ticket_id uuid,p_comment_offset integer default 0,p_people_offset integer default 0,p_request_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare t public.tickets%rowtype; role text; can_manage boolean; can_share_review boolean; active_org boolean; result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_ticket(p_ticket_id) then raise exception using errcode='42501',message='Ticket is unavailable'; end if;
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id;
 if not found then raise exception using errcode='42501',message='Ticket is unavailable'; end if;
 if p_comment_offset is null or p_comment_offset not between 0 and 249975 or p_people_offset is null or p_people_offset not between 0 and 249975 or p_request_offset is null or p_request_offset not between 0 and 249975 then raise exception using errcode='22023',message='Invalid ticket page'; end if;
 role:=securedesk_private.active_actor_role();
 select status='active' into active_org from public.organizations where id=t.organization_id;
 can_share_review:=active_org and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid()));
 can_manage:=can_share_review and t.status<>'Closed';
 result:=to_jsonb(t)||jsonb_build_object('revision',t.revision::text,'organization_name',(select name from public.organizations where id=t.organization_id),'project_name',(select name from public.projects where id=t.project_id),
 'client_name',(select full_name from public.profiles where id=t.client_user_id),'creator_name',(select full_name from public.profiles where id=t.created_by_user_id),'owner_name',(select full_name from public.profiles where id=t.owner_staff_user_id),
 'can_manage',can_manage,'can_assign',can_manage and role in ('admin','super_admin') and t.status<>'Resolved','can_comment',active_org,'can_request_sharing',active_org and role='client' and t.client_user_id=auth.uid(),'can_review_sharing',can_share_review);
 return result||jsonb_build_object(
 'comments',coalesce((select jsonb_agg(x order by x.created_at,x.id) from (select c.id,c.body,c.author_user_id,p.full_name as author_name,c.revision::text,c.created_at,c.edited_at,active_org and c.author_user_id=auth.uid() and now()<c.created_at+interval '15 minutes' as can_edit,
 coalesce((select jsonb_agg(r order by r.edited_at desc,r.id) from (select r.id,r.previous_body,r.previous_revision::text,r.edited_at from public.ticket_comment_revisions r where r.comment_id=c.id order by r.edited_at desc,r.id limit 25) r),'[]'::jsonb) as revisions
 from public.ticket_comments c join public.profiles p on p.id=c.author_user_id where c.ticket_id=t.id order by c.created_at,c.id limit 26 offset p_comment_offset) x),'[]'::jsonb),
 'collaborators',coalesce((select jsonb_agg(x order by x.name,x.id) from (select c.staff_user_id as id,p.full_name as name,securedesk_private.eligible_ticket_user(t.organization_id,c.staff_user_id,'staff') as available from public.ticket_collaborators c join public.profiles p on p.id=c.staff_user_id where c.ticket_id=t.id and c.active order by p.full_name,c.staff_user_id limit 26 offset p_people_offset) x),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(x order by x.name,x.id) from (select c.client_user_id as id,p.full_name as name,securedesk_private.eligible_ticket_user(t.organization_id,c.client_user_id,'client') as available from public.ticket_participants c join public.profiles p on p.id=c.client_user_id where c.ticket_id=t.id and c.active order by p.full_name,c.client_user_id limit 26 offset p_people_offset) x),'[]'::jsonb),
 'sharing_requests',coalesce((select jsonb_agg(x order by x.created_at desc,x.id) from (select r.id,r.candidate_client_user_id,p.full_name as candidate_name,r.status,r.revision::text,r.rejection_reason,r.created_at from public.ticket_participant_requests r join public.profiles p on p.id=r.candidate_client_user_id where r.ticket_id=t.id and (can_share_review or (role='client' and t.client_user_id=auth.uid())) order by r.created_at desc,r.id limit 26 offset p_request_offset) x),'[]'::jsonb));
end; $$;
create function public.workspace_dashboard() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare role text; ticket_counts jsonb; queues jsonb;
begin
 role:=securedesk_private.active_actor_role();
 if auth.role() is distinct from 'authenticated' or role is null then raise exception using errcode='42501',message='Dashboard is unavailable'; end if;
 select coalesce(jsonb_object_agg(s.status,s.total),'{}'::jsonb) into ticket_counts from (select t.status,count(*) as total from public.tickets t where securedesk_private.can_read_ticket(t.id) group by t.status) s;
 queues:=jsonb_build_object('sharing',(select count(*) from public.ticket_participant_requests r join public.tickets t on t.id=r.ticket_id where r.status='pending' and securedesk_private.can_read_ticket(t.id) and (securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid()))));
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
revoke all on function public.ticket_options(uuid,text,text,uuid,integer),public.ticket_list(uuid,text,integer),public.ticket_detail(uuid,uuid,integer,integer,integer),public.workspace_dashboard() from public,anon,authenticated,service_role;
grant execute on function public.ticket_options(uuid,text,text,uuid,integer),public.ticket_list(uuid,text,integer),public.ticket_detail(uuid,uuid,integer,integer,integer),public.workspace_dashboard() to authenticated;
-- Sharing changes access without rewriting final Closed ticket data.
do $$ declare definition text; begin
 select pg_get_functiondef('public.review_ticket_participant(uuid,uuid,uuid,bigint,bigint,text,text,text)'::regprocedure) into definition;
 definition:=replace(definition,'update public.tickets set revision=revision where id=t.id;','if t.status<>''Closed'' then update public.tickets set revision=revision where id=t.id; end if;');
 execute definition;
end; $$;
