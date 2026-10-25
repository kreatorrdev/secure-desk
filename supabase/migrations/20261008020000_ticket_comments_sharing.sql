-- Phase 4: public-to-ticket readers comments, revisions and explicitly approved Client sharing.
create table public.ticket_comments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, ticket_id uuid not null,
 author_user_id uuid not null references public.profiles(id), body text not null check(btrim(body)<>'' and char_length(body)<=8000),
 revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), edited_at timestamptz,
 unique(organization_id,id), foreign key(organization_id,ticket_id) references public.tickets(organization_id,id),
 check(edited_at is null or edited_at>=created_at)
);
create index ticket_comments_parent on public.ticket_comments(organization_id,ticket_id,created_at,id);
create index ticket_comments_author on public.ticket_comments(author_user_id);
create table public.ticket_comment_revisions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, comment_id uuid not null,
 editor_user_id uuid not null references public.profiles(id), previous_body text not null, previous_revision bigint not null,
 edited_at timestamptz not null default clock_timestamp(), foreign key(organization_id,comment_id) references public.ticket_comments(organization_id,id), unique(comment_id,previous_revision)
);
create index ticket_comment_revisions_parent on public.ticket_comment_revisions(organization_id,comment_id);
create index ticket_comment_revisions_editor on public.ticket_comment_revisions(editor_user_id);
create table public.ticket_participant_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, ticket_id uuid not null,
 requested_by_user_id uuid not null references public.profiles(id), candidate_client_user_id uuid not null references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reviewed_by_user_id uuid references public.profiles(id), reviewed_at timestamptz, rejection_reason text,
 revision bigint not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(organization_id,ticket_id) references public.tickets(organization_id,id),
 check((status='pending')=(reviewed_by_user_id is null and reviewed_at is null)),
 check(status='pending' or (reviewed_by_user_id is not null and reviewed_at is not null)),
 check((status='rejected')=(rejection_reason is not null)), check(rejection_reason is null or (btrim(rejection_reason)<>'' and char_length(rejection_reason)<=1000))
);
create unique index ticket_participant_requests_pending on public.ticket_participant_requests(ticket_id,candidate_client_user_id) where status='pending';
create index ticket_participant_requests_parent on public.ticket_participant_requests(organization_id,ticket_id,status);
create index ticket_participant_requests_requester on public.ticket_participant_requests(requested_by_user_id);
create index ticket_participant_requests_candidate on public.ticket_participant_requests(candidate_client_user_id);
create index ticket_participant_requests_reviewer on public.ticket_participant_requests(reviewed_by_user_id);
create table public.ticket_participants (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, ticket_id uuid not null,
 client_user_id uuid not null references public.profiles(id), approved_by_user_id uuid not null references public.profiles(id),
 active boolean not null default true, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(ticket_id,client_user_id), foreign key(organization_id,ticket_id) references public.tickets(organization_id,id)
);
create index ticket_participants_client on public.ticket_participants(client_user_id,ticket_id) where active;
create index ticket_participants_parent on public.ticket_participants(organization_id,ticket_id);
create index ticket_participants_approver on public.ticket_participants(approved_by_user_id);
create or replace function securedesk_private.can_read_ticket(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tickets t where t.id=target and securedesk_private.can_read_organization(t.organization_id) and case securedesk_private.active_actor_role()
 when 'super_admin' then true when 'admin' then securedesk_private.can_administer_organization(t.organization_id)
 when 'client' then t.client_user_id=auth.uid() or exists(select 1 from public.ticket_participants p where p.ticket_id=t.id and p.client_user_id=auth.uid() and p.active)
 when 'staff' then t.owner_staff_user_id=auth.uid() or exists(select 1 from public.ticket_collaborators c where c.ticket_id=t.id and c.staff_user_id=auth.uid() and c.active) else false end);
$$;
create function securedesk_private.guard_comment_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.id,new.organization_id,new.ticket_id,new.author_user_id,new.created_at) is distinct from (old.id,old.organization_id,old.ticket_id,old.author_user_id,old.created_at) then raise exception using errcode='22023',message='Comment identity cannot change'; end if;
 return new;
end; $$;
create function securedesk_private.guard_participant_request() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status<>'pending' or (new.id,new.organization_id,new.ticket_id,new.requested_by_user_id,new.candidate_client_user_id,new.created_at) is distinct from (old.id,old.organization_id,old.ticket_id,old.requested_by_user_id,old.candidate_client_user_id,old.created_at) then raise exception using errcode='22023',message='Sharing request history cannot change'; end if;
 return new;
end; $$;
revoke all on function securedesk_private.guard_comment_identity(),securedesk_private.guard_participant_request() from public,anon,authenticated,service_role;
create trigger comment_identity before update on public.ticket_comments for each row execute function securedesk_private.guard_comment_identity();
create trigger comment_revision before update on public.ticket_comments for each row execute function securedesk_private.advance_assignment_revision();
create trigger comment_no_delete before delete on public.ticket_comments for each row execute function securedesk_private.guard_audit_history();
create trigger comment_revisions_immutable before update or delete on public.ticket_comment_revisions for each row execute function securedesk_private.guard_audit_history();
create trigger participant_request_identity before update on public.ticket_participant_requests for each row execute function securedesk_private.guard_participant_request();
create trigger participant_request_no_delete before delete on public.ticket_participant_requests for each row execute function securedesk_private.guard_audit_history();
create trigger participant_request_revision before update on public.ticket_participant_requests for each row execute function securedesk_private.advance_assignment_revision();
create trigger participant_request_updated before update on public.ticket_participant_requests for each row execute function securedesk_private.touch_updated_at();
create trigger participant_revision before update on public.ticket_participants for each row execute function securedesk_private.advance_assignment_revision();
create trigger participant_updated before update on public.ticket_participants for each row execute function securedesk_private.touch_updated_at();
alter table public.ticket_comments enable row level security;
alter table public.ticket_comment_revisions enable row level security;
alter table public.ticket_participant_requests enable row level security;
alter table public.ticket_participants enable row level security;
revoke all on public.ticket_comments,public.ticket_comment_revisions,public.ticket_participant_requests,public.ticket_participants from public,anon,authenticated,service_role;
grant select on public.ticket_comments,public.ticket_comment_revisions,public.ticket_participant_requests,public.ticket_participants to authenticated;
create policy comment_read on public.ticket_comments for select to authenticated using(securedesk_private.can_read_ticket(ticket_id));
create policy comment_revision_read on public.ticket_comment_revisions for select to authenticated using(exists(select 1 from public.ticket_comments c where c.id=comment_id and securedesk_private.can_read_ticket(c.ticket_id)));
create policy participant_read on public.ticket_participants for select to authenticated using(securedesk_private.can_read_ticket(ticket_id));
-- Pending candidates and rejection details are visible only to requester and decision makers.
create policy participant_request_read on public.ticket_participant_requests for select to authenticated using(securedesk_private.can_read_ticket(ticket_id) and (requested_by_user_id=auth.uid() or securedesk_private.can_administer_organization(organization_id) or exists(select 1 from public.tickets t where t.id=ticket_id and t.owner_staff_user_id=auth.uid() and securedesk_private.active_actor_role()='staff')));
create function public.write_ticket_comment(p_organization_id uuid,p_ticket_id uuid,p_comment_id uuid,p_expected_comment_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; c public.ticket_comments%rowtype; text_body text; stamp timestamptz;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 if not securedesk_private.can_read_ticket(p_ticket_id) or not exists(select 1 from public.tickets where id=p_ticket_id and organization_id=p_organization_id) then raise exception using errcode='42501',message='Ticket access is unavailable'; end if;
 text_body:=btrim(p_body);
 if p_comment_id is null or text_body is null or text_body='' or char_length(text_body)>8000 then raise exception using errcode='22023',message='Enter a comment of 1 to 8000 characters'; end if;
 select * into c from public.ticket_comments where id=p_comment_id for update;
 if p_expected_comment_revision is null then
  if found then
   if c.ticket_id=p_ticket_id and c.organization_id=p_organization_id and c.author_user_id=auth.uid() and c.body=text_body then return c.id; end if;
   raise exception using errcode='40001',message='Comment submission changed';
  end if;
  insert into public.ticket_comments(id,organization_id,ticket_id,author_user_id,body) values(p_comment_id,p_organization_id,p_ticket_id,auth.uid(),text_body);
 else
  if not found or c.ticket_id<>p_ticket_id or c.organization_id<>p_organization_id or c.author_user_id<>auth.uid() then raise exception using errcode='42501',message='Comment editing is unavailable'; end if;
  if c.revision<>p_expected_comment_revision then raise exception using errcode='40001',message='Comment changed; reload before editing'; end if;
  stamp:=clock_timestamp();
  if stamp>=c.created_at+interval '15 minutes' then raise exception using errcode='22023',message='The 15-minute editing window has ended'; end if;
  if c.body=text_body then return c.id; end if;
  insert into public.ticket_comment_revisions(organization_id,comment_id,editor_user_id,previous_body,previous_revision,edited_at) values(p_organization_id,c.id,auth.uid(),c.body,c.revision,stamp);
  update public.ticket_comments set body=text_body,edited_at=stamp where id=c.id;
 end if;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values(p_organization_id,auth.uid(),case when p_expected_comment_revision is null then 'ticket.comment_added' else 'ticket.comment_edited' end,'ticket',p_ticket_id,'success',jsonb_build_object('comment_id',p_comment_id));
 return p_comment_id;
end; $$;
create function public.request_ticket_participant(p_organization_id uuid,p_ticket_id uuid,p_request_id uuid,p_candidate_client_id uuid,p_expected_access_revision bigint,p_expected_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; r public.ticket_participant_requests%rowtype;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(p_ticket_id) or actor.app_role<>'client' or t.client_user_id<>auth.uid() then raise exception using errcode='42501',message='Only the original Client can request sharing'; end if;
 if p_request_id is null or p_candidate_client_id is null or p_candidate_client_id=t.client_user_id then raise exception using errcode='22023',message='Select another Client in this company'; end if;
 if not securedesk_private.eligible_ticket_user(p_organization_id,p_candidate_client_id,'client') then raise exception using errcode='42501',message='An approved company Client is required'; end if;
 if exists(select 1 from public.ticket_participants where ticket_id=t.id and client_user_id=p_candidate_client_id and active) then raise exception using errcode='22023',message='This Client already has access'; end if;
 select * into r from public.ticket_participant_requests where id=p_request_id;
 if found then
  if r.ticket_id=t.id and r.requested_by_user_id=auth.uid() and r.candidate_client_user_id=p_candidate_client_id then return r.id; end if;
  raise exception using errcode='40001',message='Sharing submission changed';
 end if;
 if exists(select 1 from public.ticket_participant_requests where ticket_id=t.id and candidate_client_user_id=p_candidate_client_id and status='pending') then raise exception using errcode='40001',message='A sharing request is already pending'; end if;
 insert into public.ticket_participant_requests(id,organization_id,ticket_id,requested_by_user_id,candidate_client_user_id) values(p_request_id,p_organization_id,t.id,auth.uid(),p_candidate_client_id);
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values(p_organization_id,auth.uid(),'ticket.sharing_requested','ticket',t.id,'success',jsonb_build_object('request_id',p_request_id));
 return p_request_id;
end; $$;
create function public.review_ticket_participant(p_organization_id uuid,p_ticket_id uuid,p_request_id uuid,p_expected_request_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_intent text,p_reason text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; r public.ticket_participant_requests%rowtype; reason text;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(p_ticket_id) or not(securedesk_private.can_administer_organization(p_organization_id) or (actor.app_role='staff' and t.owner_staff_user_id=auth.uid())) then raise exception using errcode='42501',message='Sharing decisions are unavailable'; end if;
 select * into r from public.ticket_participant_requests where id=p_request_id and ticket_id=t.id and organization_id=p_organization_id for update;
 if not found then raise exception using errcode='42501',message='Sharing request is unavailable'; end if;
 if r.status<>'pending' or p_expected_request_revision is null or r.revision<>p_expected_request_revision then raise exception using errcode='40001',message='Sharing request changed'; end if;
 if p_intent is null or p_intent not in ('approve','reject') then raise exception using errcode='22023',message='Invalid sharing decision'; end if;
 if p_intent='approve' then
  if r.requested_by_user_id<>t.client_user_id or not securedesk_private.eligible_ticket_user(p_organization_id,t.client_user_id,'client') or not securedesk_private.eligible_ticket_user(p_organization_id,r.candidate_client_user_id,'client') then raise exception using errcode='42501',message='Both Clients must still belong to this company'; end if;
  insert into public.ticket_participants(organization_id,ticket_id,client_user_id,approved_by_user_id) values(p_organization_id,t.id,r.candidate_client_user_id,auth.uid()) on conflict(ticket_id,client_user_id) do update set active=true,approved_by_user_id=auth.uid();
 else
  reason:=btrim(p_reason);
  if reason is null or reason='' or char_length(reason)>1000 then raise exception using errcode='22023',message='Enter a rejection reason of 1 to 1000 characters'; end if;
 end if;
 update public.ticket_participant_requests set status=case when p_intent='approve' then 'approved' else 'rejected' end,reviewed_by_user_id=auth.uid(),reviewed_at=clock_timestamp(),rejection_reason=reason where id=r.id;
 update public.tickets set revision=revision where id=t.id;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values(p_organization_id,auth.uid(),'ticket.sharing_'||p_intent,'ticket',t.id,'success',jsonb_build_object('request_id',r.id,'client_user_id',r.candidate_client_user_id));
 return r.id;
end; $$;
create function public.revoke_ticket_participant(p_organization_id uuid,p_ticket_id uuid,p_client_user_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_scope text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(p_ticket_id) or not(securedesk_private.can_administer_organization(p_organization_id) or (actor.app_role='staff' and t.owner_staff_user_id=auth.uid())) then raise exception using errcode='42501',message='Sharing decisions are unavailable'; end if;
 if p_expected_revision is null or t.revision<>p_expected_revision then raise exception using errcode='40001',message='Ticket changed'; end if;
 update public.ticket_participants set active=false where ticket_id=t.id and client_user_id=p_client_user_id and active;
 if not found then return t.id; end if;
 -- Closed ticket identity is final, but access revocation is still allowed.
 if t.status<>'Closed' then update public.tickets set revision=revision where id=t.id; end if;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted) values(p_organization_id,auth.uid(),'ticket.sharing_revoked','ticket',t.id,'success',jsonb_build_object('client_user_id',p_client_user_id));
 return t.id;
end; $$;
revoke all on function public.write_ticket_comment(uuid,uuid,uuid,bigint,bigint,text,text),public.request_ticket_participant(uuid,uuid,uuid,uuid,bigint,text),public.review_ticket_participant(uuid,uuid,uuid,bigint,bigint,text,text,text),public.revoke_ticket_participant(uuid,uuid,uuid,bigint,bigint,text) from public,anon,authenticated,service_role;
grant execute on function public.write_ticket_comment(uuid,uuid,uuid,bigint,bigint,text,text),public.request_ticket_participant(uuid,uuid,uuid,uuid,bigint,text),public.review_ticket_participant(uuid,uuid,uuid,bigint,bigint,text,text,text),public.revoke_ticket_participant(uuid,uuid,uuid,bigint,bigint,text) to authenticated;
