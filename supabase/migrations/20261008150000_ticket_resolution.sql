-- Phase 5: original Client acceptance and reasoned, scoped reopen decisions.
-- Scheduled auto-close is a separate following step; no existing business rows are rewritten.
create table public.ticket_reopen_requests (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 ticket_id uuid not null,
 requested_by_user_id uuid not null references public.profiles(id),
 requester_membership_id uuid not null references public.organization_members(id),
 resolved_at timestamptz not null,
 ticket_revision bigint not null check(ticket_revision>0),
 reason text not null check(reason ~ '[^[:space:]]' and char_length(reason)<=2000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 revision bigint not null default 1 check(revision>0),
 reviewed_by_user_id uuid references public.profiles(id), reviewed_at timestamptz,
 rejection_reason text check(rejection_reason is null or (rejection_reason ~ '[^[:space:]]' and char_length(rejection_reason)<=1000)),
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(),
 foreign key(organization_id,ticket_id) references public.tickets(organization_id,id),
 check(created_at>=resolved_at), check(reviewed_at is null or reviewed_at>=created_at),
 check((status='pending' and reviewed_by_user_id is null and reviewed_at is null and rejection_reason is null)
    or (status='approved' and reviewed_by_user_id is not null and reviewed_at is not null and rejection_reason is null)
    or (status='rejected' and reviewed_by_user_id is not null and reviewed_at is not null and rejection_reason is not null))
);
create unique index ticket_reopen_one_pending on public.ticket_reopen_requests(ticket_id) where status='pending';
create index ticket_reopen_history on public.ticket_reopen_requests(organization_id,ticket_id,created_at desc,id);
create index ticket_reopen_requester on public.ticket_reopen_requests(requested_by_user_id);
create index ticket_reopen_membership on public.ticket_reopen_requests(requester_membership_id);
create index ticket_reopen_reviewer on public.ticket_reopen_requests(reviewed_by_user_id);

create function securedesk_private.guard_ticket_reopen_identity() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' then
  if not exists(select 1 from public.tickets t join public.organization_members m on m.id=new.requester_membership_id
     where t.id=new.ticket_id and t.organization_id=new.organization_id and t.client_user_id=new.requested_by_user_id
       and m.organization_id=new.organization_id and m.user_id=new.requested_by_user_id and m.status='active'
       and t.status='Resolved' and t.resolved_at=new.resolved_at and t.revision=new.ticket_revision) then
   raise exception using errcode='22023',message='Invalid reopen parent';
  end if;
 else
  if (new.id,new.organization_id,new.ticket_id,new.requested_by_user_id,new.requester_membership_id,new.resolved_at,new.ticket_revision,new.reason,new.created_at)
   is distinct from (old.id,old.organization_id,old.ticket_id,old.requested_by_user_id,old.requester_membership_id,old.resolved_at,old.ticket_revision,old.reason,old.created_at) then
   raise exception using errcode='22023',message='Reopen identity cannot change';
  end if;
  if old.status<>'pending' or new.status not in ('approved','rejected') then
   raise exception using errcode='22023',message='A reopen decision is final';
  end if;
 end if;
 return new;
end; $$;
revoke all on function securedesk_private.guard_ticket_reopen_identity() from public,anon,authenticated,service_role;
create trigger ticket_reopen_identity before insert or update on public.ticket_reopen_requests for each row execute function securedesk_private.guard_ticket_reopen_identity();
create trigger ticket_reopen_revision before update on public.ticket_reopen_requests for each row execute function securedesk_private.advance_assignment_revision();
create trigger ticket_reopen_updated before update on public.ticket_reopen_requests for each row execute function securedesk_private.touch_updated_at();

-- A fixed 168-hour interval keeps the UTC deadline independent of session timezone/DST.
create function securedesk_private.ticket_reopen_window(resolution timestamptz,stamp timestamptz) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(stamp>=resolution and stamp<resolution+interval '168 hours',false);
$$;
create function securedesk_private.can_read_ticket_reopen(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ticket_reopen_requests r join public.tickets t on t.id=r.ticket_id
   where r.id=target and securedesk_private.can_read_ticket(t.id) and
    (r.requested_by_user_id=auth.uid() or securedesk_private.can_administer_organization(t.organization_id)
      or (securedesk_private.active_actor_role()='staff' and t.owner_staff_user_id=auth.uid())));
$$;
revoke all on function securedesk_private.ticket_reopen_window(timestamptz,timestamptz),securedesk_private.can_read_ticket_reopen(uuid) from public,anon,authenticated,service_role;
grant execute on function securedesk_private.can_read_ticket_reopen(uuid) to authenticated;
alter table public.ticket_reopen_requests enable row level security;
revoke all on public.ticket_reopen_requests from public,anon,authenticated,service_role;
grant select(id,organization_id,ticket_id,requested_by_user_id,resolved_at,reason,status,revision,reviewed_by_user_id,reviewed_at,rejection_reason,created_at,updated_at) on public.ticket_reopen_requests to authenticated;
create policy ticket_reopen_read on public.ticket_reopen_requests for select to authenticated using(securedesk_private.can_read_ticket_reopen(id));

create function public.request_ticket_reopen(p_organization_id uuid,p_ticket_id uuid,p_request_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; r public.ticket_reopen_requests%rowtype; reason text; membership uuid; stamp timestamptz;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(t.id) or actor.app_role<>'client' or t.client_user_id<>auth.uid() then
  raise exception using errcode='42501',message='Only the original Client can request continuation';
 end if;
 if t.status<>'Resolved' then raise exception using errcode='22023',message='Only a Resolved ticket can have a reopen request'; end if;
 reason:=btrim(p_reason);
 if p_request_id is null or reason is null or reason !~ '[^[:space:]]' or char_length(reason)>2000 then
  raise exception using errcode='22023',message='Describe the same continuing problem in 1 to 2000 characters';
 end if;
 select id into membership from public.organization_members where organization_id=t.organization_id and user_id=auth.uid() and status='active' for share;
 select * into r from public.ticket_reopen_requests where id=p_request_id;
 if found then
  if r.ticket_id=t.id and r.organization_id=t.organization_id and r.requested_by_user_id=auth.uid()
    and r.reason=reason and r.resolved_at=t.resolved_at and r.requester_membership_id=membership and r.ticket_revision=p_expected_revision then return r.id; end if;
  raise exception using errcode='40001',message='Reopen submission changed';
 end if;
 if p_expected_revision is null or t.revision<>p_expected_revision then raise exception using errcode='40001',message='Ticket changed'; end if;
 -- Read server time after the lock; waiting cannot extend the client's deadline.
 stamp:=clock_timestamp();
 if not securedesk_private.ticket_reopen_window(t.resolved_at,stamp) then raise exception using errcode='22023',message='The seven-day reopen window has ended'; end if;
 if exists(select 1 from public.ticket_reopen_requests where ticket_id=t.id and status='pending') then raise exception using errcode='40001',message='A reopen request is already pending'; end if;
 insert into public.ticket_reopen_requests(id,organization_id,ticket_id,requested_by_user_id,requester_membership_id,resolved_at,ticket_revision,reason,created_at)
  values(p_request_id,t.organization_id,t.id,auth.uid(),membership,t.resolved_at,t.revision,reason,stamp);
 update public.tickets set revision=revision where id=t.id;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
  values(t.organization_id,auth.uid(),'ticket.reopen_requested','ticket',t.id,'success',jsonb_build_object('request_id',p_request_id,'previous_revision',t.revision,'reason_present',true));
 return p_request_id;
end; $$;

create function public.review_ticket_reopen(p_organization_id uuid,p_ticket_id uuid,p_request_id uuid,p_expected_revision bigint,p_expected_request_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_intent text,p_reason text default null,p_owner_staff_user_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; r public.ticket_reopen_requests%rowtype; is_admin boolean; rejection_text text; owner_id uuid; stamp timestamptz;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(t.id) then raise exception using errcode='42501',message='Reopen decisions are unavailable'; end if;
 is_admin:=securedesk_private.can_administer_organization(t.organization_id);
 if not is_admin and not(actor.app_role='staff' and t.owner_staff_user_id=auth.uid()) then raise exception using errcode='42501',message='Only the owner or company administrator can review continuation'; end if;
 if p_expected_revision is null or t.revision<>p_expected_revision then raise exception using errcode='40001',message='Ticket changed'; end if;
 select * into r from public.ticket_reopen_requests where id=p_request_id and ticket_id=t.id and organization_id=t.organization_id for update;
 if not found then raise exception using errcode='42501',message='Reopen request is unavailable'; end if;
 if r.status<>'pending' or p_expected_request_revision is null or r.revision<>p_expected_request_revision then raise exception using errcode='40001',message='Reopen request changed'; end if;
 if t.status<>'Resolved' or r.resolved_at<>t.resolved_at then raise exception using errcode='22023',message='The original resolution is unavailable'; end if;
 if p_intent is null or p_intent not in ('approve','reject') then raise exception using errcode='22023',message='Invalid reopen decision'; end if;
 if p_intent='approve' then
  if p_reason is not null then raise exception using errcode='22023',message='An approval has no rejection reason'; end if;
  if not securedesk_private.eligible_ticket_user(t.organization_id,t.client_user_id,'client')
    or not exists(select 1 from public.organization_members where id=r.requester_membership_id and organization_id=t.organization_id and user_id=t.client_user_id and status='active') then
   raise exception using errcode='42501',message='The original Client membership is no longer available';
  end if;
  if not is_admin and p_owner_staff_user_id is not null and p_owner_staff_user_id<>t.owner_staff_user_id then raise exception using errcode='42501',message='Only a company administrator can assign a replacement owner'; end if;
  owner_id:=coalesce(p_owner_staff_user_id,t.owner_staff_user_id);
  if not securedesk_private.eligible_ticket_user(t.organization_id,owner_id,'staff') then raise exception using errcode='42501',message='An available company Staff owner is required'; end if;
 else
  if p_owner_staff_user_id is not null then raise exception using errcode='22023',message='A rejection cannot reassign the owner'; end if;
  rejection_text:=btrim(p_reason);
  if rejection_text is null or rejection_text !~ '[^[:space:]]' or char_length(rejection_text)>1000 then raise exception using errcode='22023',message='Enter a rejection reason of 1 to 1000 characters'; end if;
 end if;
 stamp:=clock_timestamp();
 update public.ticket_reopen_requests set status=case when p_intent='approve' then 'approved' else 'rejected' end,
  reviewed_by_user_id=auth.uid(),reviewed_at=stamp,rejection_reason=rejection_text where id=r.id;
 if p_intent='approve' then
  update public.ticket_collaborators set active=false where ticket_id=t.id and staff_user_id=owner_id and active;
  update public.tickets set status='Assigned',owner_staff_user_id=owner_id,resolved_at=null where id=t.id;
 elsif stamp>=t.resolved_at+interval '168 hours' then
  update public.tickets set status='Closed',closed_at=stamp,close_reason='Reopen request rejected after the original seven-day deadline.' where id=t.id;
 else
  update public.tickets set revision=revision where id=t.id;
 end if;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
  values(t.organization_id,auth.uid(),'ticket.reopen_'||p_intent,'ticket',t.id,'success',jsonb_build_object('request_id',r.id,'previous_revision',t.revision,'original_deadline',t.resolved_at+interval '168 hours','closed_after_deadline',p_intent='reject' and stamp>=t.resolved_at+interval '168 hours','owner_staff_user_id',owner_id,'reason_present',rejection_text is not null));
 return r.id;
end; $$;

create function public.close_resolved_ticket(p_organization_id uuid,p_ticket_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_intent text,p_reason text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; reason text; stamp timestamptz;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(t.id) then raise exception using errcode='42501',message='Closing is unavailable'; end if;
 if p_intent='accept' then
  if actor.app_role<>'client' or t.client_user_id<>auth.uid() then raise exception using errcode='42501',message='Only the original Client can accept the solution'; end if;
  if p_reason is not null then raise exception using errcode='22023',message='Acceptance has no administrative reason'; end if;
  reason:='Client accepted the solution.';
 elsif p_intent='admin_close' then
  if not securedesk_private.can_administer_organization(t.organization_id) then raise exception using errcode='42501',message='Only a company administrator can close exceptionally'; end if;
  reason:=btrim(p_reason);
  if reason is null or reason !~ '[^[:space:]]' or char_length(reason)>2000 then raise exception using errcode='22023',message='Enter an administrative reason of 1 to 2000 characters'; end if;
 else raise exception using errcode='22023',message='Invalid close operation'; end if;
 if p_expected_revision is null or t.revision<>p_expected_revision then raise exception using errcode='40001',message='Ticket changed'; end if;
 if t.status<>'Resolved' then raise exception using errcode='22023',message='Only a Resolved ticket can close'; end if;
 if exists(select 1 from public.ticket_reopen_requests where ticket_id=t.id and status='pending') then raise exception using errcode='22023',message='Decide the pending reopen request before closing'; end if;
 stamp:=clock_timestamp();
 update public.tickets set status='Closed',closed_at=stamp,close_reason=reason where id=t.id;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
  values(t.organization_id,auth.uid(),case when p_intent='accept' then 'ticket.solution_accepted' else 'ticket.admin_closed' end,'ticket',t.id,'success',jsonb_build_object('previous_revision',t.revision,'close_kind',p_intent,'reason_present',true));
 return t.id;
end; $$;

-- A separate bounded DTO leaves the existing ticket_detail contract intact.
create function public.ticket_resolution(p_organization_id uuid,p_ticket_id uuid,p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare t public.tickets%rowtype; role text; active_org boolean; original_client boolean; reviewer boolean; pending boolean; stamp timestamptz; history jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_ticket(p_ticket_id) then raise exception using errcode='42501',message='Resolution is unavailable'; end if;
 select * into t from public.tickets where id=p_ticket_id and organization_id=p_organization_id;
 if not found then raise exception using errcode='42501',message='Resolution is unavailable'; end if;
 if p_offset is null or p_offset not between 0 and 249975 then raise exception using errcode='22023',message='Invalid resolution page'; end if;
 role:=securedesk_private.active_actor_role(); stamp:=clock_timestamp();
 select status='active' into active_org from public.organizations where id=t.organization_id;
 original_client:=role='client' and t.client_user_id=auth.uid();
 reviewer:=securedesk_private.can_administer_organization(t.organization_id) or (role='staff' and t.owner_staff_user_id=auth.uid());
 select exists(select 1 from public.ticket_reopen_requests where ticket_id=t.id and status='pending') into pending;
 if original_client or reviewer then
  select coalesce(jsonb_agg(x order by x.created_at desc,x.id),'[]'::jsonb) into history from
   (select r.id,r.reason,r.status,r.revision::text,r.resolved_at,r.created_at,r.reviewed_at,r.rejection_reason,
    (select full_name from public.profiles where id=r.requested_by_user_id) as requester_name,
    (select full_name from public.profiles where id=r.reviewed_by_user_id) as reviewer_name
    from public.ticket_reopen_requests r where r.ticket_id=t.id order by r.created_at desc,r.id limit 26 offset p_offset) x;
 else history:='[]'::jsonb; end if;
 return jsonb_build_object('deadline',case when t.resolved_at is not null then t.resolved_at+interval '168 hours' end,
  'can_accept',active_org and original_client and t.status='Resolved' and not pending,
  'can_request_reopen',active_org and original_client and t.status='Resolved' and not pending and securedesk_private.ticket_reopen_window(t.resolved_at,stamp),
  'can_review_reopen',active_org and reviewer and t.status='Resolved' and pending,
  'can_admin_close',active_org and securedesk_private.can_administer_organization(t.organization_id) and t.status='Resolved' and not pending,
  'can_reassign_reopen',active_org and securedesk_private.can_administer_organization(t.organization_id) and t.status='Resolved' and pending,
  'has_pending_reopen',pending,'server_time',stamp,'requests',history);
end; $$;
revoke all on function public.request_ticket_reopen(uuid,uuid,uuid,bigint,bigint,text,text),public.review_ticket_reopen(uuid,uuid,uuid,bigint,bigint,bigint,text,text,text,uuid),public.close_resolved_ticket(uuid,uuid,bigint,bigint,text,text,text),public.ticket_resolution(uuid,uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.request_ticket_reopen(uuid,uuid,uuid,bigint,bigint,text,text),public.review_ticket_reopen(uuid,uuid,uuid,bigint,bigint,bigint,text,text,text,uuid),public.close_resolved_ticket(uuid,uuid,bigint,bigint,text,text,text),public.ticket_resolution(uuid,uuid,integer) to authenticated;