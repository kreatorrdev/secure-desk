-- Phase 5, step 1: private ticket attachment metadata and controlled publication.
-- Existing proposal attachments remain intact. Exactly one tenant-bound parent is required.
alter table public.attachments
 alter column project_proposal_id drop not null,
 alter column proposal_revision drop not null,
 add column ticket_id uuid,
 add column ticket_revision bigint check(ticket_revision>0),
 add column actor_ticket_scope text,
 add constraint attachments_ticket_parent foreign key(organization_id,ticket_id) references public.tickets(organization_id,id),
 add constraint attachments_exact_parent check(
  (project_proposal_id is not null and ticket_id is null and proposal_revision is not null and ticket_revision is null and actor_ticket_scope is null)
  or (project_proposal_id is null and ticket_id is not null and proposal_revision is null and ticket_revision is not null and actor_ticket_scope is not null)),
 drop constraint attachments_check1,
 add constraint attachments_parent_path check(storage_path=organization_id::text||'/'||coalesce(project_proposal_id,ticket_id)::text||'/'||id::text);
create index attachments_ticket_parent on public.attachments(organization_id,ticket_id,state,created_at,id) where ticket_id is not null;
grant select(ticket_id) on public.attachments to authenticated;
drop policy attachment_read on public.attachments;
create policy attachment_read on public.attachments for select to authenticated using(state='ready' and
 ((project_proposal_id is not null and securedesk_private.can_read_proposal(project_proposal_id))
 or (ticket_id is not null and securedesk_private.can_read_ticket(ticket_id))));

-- Bytes are accessed by a server-only Storage client after content validation and parent authorization.
-- No application-role Storage policy: direct upload/download/signing cannot bypass that boundary.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ticket-attachments','ticket-attachments',false,10485760,
 array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- This unexposed helper returns a versioned, live authorization snapshot for trusted completion.
-- Actor IDs are accepted only by the service-only completion path; reservation derives auth.uid().
create function securedesk_private.ticket_attachment_scope(target_ticket uuid,target_actor uuid)
returns text language sql stable security definer set search_path='' as $$
 select case p.app_role
 when 'super_admin' then 'super_admin'
 when 'admin' then (select 'admin:'||a.revision::text from public.organization_admin_assignments a where a.organization_id=t.organization_id and a.admin_user_id=p.id and a.active)
 when 'staff' then (select 'staff:'||s.revision::text||':'||case when t.owner_staff_user_id=p.id then 'owner' else
  (select 'collaborator:'||c.id::text||':'||c.revision::text from public.ticket_collaborators c where c.ticket_id=t.id and c.staff_user_id=p.id and c.active) end
  from public.staff_organization_assignments s where s.organization_id=t.organization_id and s.staff_user_id=p.id and s.active)
 when 'client' then (select 'client:'||m.id::text||':'||case when t.client_user_id=p.id then 'original' else
  (select 'participant:'||a.id::text||':'||a.revision::text from public.ticket_participants a where a.ticket_id=t.id and a.client_user_id=p.id and a.active) end
  from public.organization_members m where m.organization_id=t.organization_id and m.user_id=p.id and m.status='active') end
 from public.tickets t join public.organizations o on o.id=t.organization_id join public.profiles p on p.id=target_actor
 where t.id=target_ticket and o.status='active' and p.account_status='active';
$$;
revoke all on function securedesk_private.ticket_attachment_scope(uuid,uuid) from public,anon,authenticated,service_role;

create function public.reserve_ticket_attachment(p_organization_id uuid,p_ticket_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_scope text,p_name text,p_mime text,p_size integer)
returns table(id uuid,storage_path text) language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; t public.tickets%rowtype; attachment_id uuid:=gen_random_uuid(); actor_scope text;
begin
 actor:=securedesk_private.lock_ticket_actor(p_organization_id,p_expected_access_revision,p_expected_scope);
 select * into t from public.tickets where tickets.id=p_ticket_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_ticket(p_ticket_id) then raise exception using errcode='42501',message='Attachment upload is unavailable'; end if;
 if t.revision is distinct from p_expected_revision then raise exception using errcode='40001',message='Ticket has changed'; end if;
 actor_scope:=securedesk_private.ticket_attachment_scope(t.id,auth.uid());
 if actor_scope is null then raise exception using errcode='42501',message='Attachment upload is unavailable'; end if;
 if p_name is null or length(p_name) not between 1 and 200 or p_name ~ '[/\\[:cntrl:]]'
 or p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
 or p_size is null or p_size not between 1 and 10485760 then raise exception using errcode='22023',message='Invalid attachment'; end if;
 if (select count(*) from public.attachments where uploaded_by_user_id=auth.uid() and state='uploading' and expires_at>clock_timestamp())>=5 then raise exception using errcode='22023',message='Too many uploads in progress'; end if;
 insert into public.attachments(id,organization_id,ticket_id,uploaded_by_user_id,storage_path,original_name,mime_type,size_bytes,actor_access_revision,ticket_revision,actor_ticket_scope,expires_at)
 values(attachment_id,p_organization_id,t.id,auth.uid(),p_organization_id::text||'/'||t.id::text||'/'||attachment_id::text,p_name,p_mime,p_size,actor.access_revision,t.revision,actor_scope,clock_timestamp()+interval '15 minutes');
 return query select a.id,a.storage_path from public.attachments a where a.id=attachment_id;
end; $$;

create function public.complete_ticket_attachment(p_attachment_id uuid,p_actor_id uuid,p_sha256 text)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.attachments%rowtype; actor public.profiles%rowtype; t public.tickets%rowtype; org_status text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment completion is required'; end if;
 select * into a from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and ticket_id is not null;
 if not found then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 -- Same lock order as ticket actions: actor, organization, ticket, attachment.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||p_actor_id::text,0));
 select * into actor from public.profiles where id=p_actor_id for share;
 perform securedesk_private.require_eligible_access_target(p_actor_id);
 select status into org_status from public.organizations where id=a.organization_id for update;
 select * into t from public.tickets where id=a.ticket_id and organization_id=a.organization_id for update;
 if not found then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 select * into a from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and ticket_id=t.id for update;
 if not found then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 if actor.account_status is distinct from 'active' or actor.access_revision is distinct from a.actor_access_revision or org_status is distinct from 'active'
 or securedesk_private.ticket_attachment_scope(t.id,p_actor_id) is distinct from a.actor_ticket_scope
 then raise exception using errcode='42501',message='Attachment access has changed'; end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception using errcode='22023',message='Invalid attachment checksum'; end if;
 -- A retry after a lost successful response keeps the same file and one audit event.
 if a.state='ready' then
  if a.sha256=p_sha256 then return a.id; end if;
  raise exception using errcode='22023',message='Attachment checksum has changed';
 end if;
 if t.revision is distinct from a.ticket_revision or a.expires_at<=clock_timestamp() then raise exception using errcode='40001',message='Attachment reservation has changed or expired'; end if;
 update public.attachments set state='ready',sha256=p_sha256 where id=a.id;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
 values(a.organization_id,p_actor_id,'ticket.attachment_uploaded','attachment',a.id,'success',
 jsonb_build_object('ticket_id',t.id,'size_bytes',a.size_bytes,'mime_type',a.mime_type));
 return a.id;
end; $$;

create function public.abort_ticket_attachment(p_attachment_id uuid,p_actor_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare path text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment cleanup is required'; end if;
 -- DELETE waits for a concurrent completion and rechecks state; published bytes are never claimed.
 delete from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and ticket_id is not null and state='uploading' returning storage_path into path;
 return path;
end; $$;

create function public.ticket_attachments(p_organization_id uuid,p_ticket_id uuid,p_limit integer default 26,p_offset integer default 0)
returns table(id uuid,original_name text,mime_type text,size_bytes integer,created_at timestamptz,uploader_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_ticket(p_ticket_id)
 or not exists(select 1 from public.tickets t where t.id=p_ticket_id and t.organization_id=p_organization_id)
 then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 if p_limit is null or p_limit not between 1 and 100 or p_offset is null or p_offset<0 then raise exception using errcode='22023',message='Invalid attachment page'; end if;
 return query select a.id,a.original_name,a.mime_type,a.size_bytes,a.created_at,p.full_name from public.attachments a join public.profiles p on p.id=a.uploaded_by_user_id
 where a.organization_id=p_organization_id and a.ticket_id=p_ticket_id and a.state='ready' order by a.created_at,a.id limit p_limit offset p_offset;
end; $$;

create function public.ticket_attachment(p_organization_id uuid,p_ticket_id uuid,p_attachment_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_ticket(p_ticket_id) then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 select jsonb_build_object('id',a.id,'storage_path',a.storage_path,'original_name',a.original_name,'mime_type',a.mime_type,'size_bytes',a.size_bytes,'sha256',a.sha256)
 into result from public.attachments a where a.id=p_attachment_id and a.organization_id=p_organization_id and a.ticket_id=p_ticket_id and a.state='ready';
 if result is null then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 return result;
end; $$;

revoke all on function public.reserve_ticket_attachment(uuid,uuid,bigint,bigint,text,text,text,integer),public.ticket_attachments(uuid,uuid,integer,integer),public.ticket_attachment(uuid,uuid,uuid),public.complete_ticket_attachment(uuid,uuid,text),public.abort_ticket_attachment(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.reserve_ticket_attachment(uuid,uuid,bigint,bigint,text,text,text,integer),public.ticket_attachments(uuid,uuid,integer,integer),public.ticket_attachment(uuid,uuid,uuid) to authenticated;
grant execute on function public.complete_ticket_attachment(uuid,uuid,text),public.abort_ticket_attachment(uuid,uuid) to service_role;

-- The proposal service endpoints must reject the new ticket parent, even for Super Admin uploads.
create or replace function public.complete_proposal_attachment(p_attachment_id uuid,p_actor_id uuid,p_sha256 text)
returns uuid language plpgsql security definer set search_path='' as $$
declare attachment public.attachments%rowtype; actor public.profiles%rowtype; proposal public.project_proposals%rowtype; org_status text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment completion is required'; end if;
 select * into attachment from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and project_proposal_id is not null;
 if not found then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('registration:'||p_actor_id::text,0));
 select * into actor from public.profiles where id=p_actor_id for share;
 perform securedesk_private.require_eligible_access_target(p_actor_id);
 select status into org_status from public.organizations where id=attachment.organization_id for update;
 select * into proposal from public.project_proposals where id=attachment.project_proposal_id for update;
 select * into attachment from public.attachments where id=p_attachment_id for update;
 if actor.account_status<>'active' or actor.access_revision<>attachment.actor_access_revision or org_status<>'active'
 or proposal.status<>'pending' or proposal.revision<>attachment.proposal_revision or attachment.state<>'uploading' or attachment.expires_at<=now()
 or not (
 (actor.app_role='client' and proposal.proposed_by_user_id=p_actor_id and exists(select 1 from public.organization_members where organization_id=attachment.organization_id and user_id=p_actor_id and id=attachment.actor_membership_id and status='active'))
 or actor.app_role='super_admin'
 or (actor.app_role='admin' and exists(select 1 from public.organization_admin_assignments where organization_id=attachment.organization_id and admin_user_id=p_actor_id and revision=attachment.actor_assignment_revision and active))
 ) then raise exception using errcode='42501',message='Attachment access has changed'; end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then raise exception using errcode='22023',message='Invalid attachment checksum'; end if;
 update public.attachments set state='ready',sha256=p_sha256 where id=p_attachment_id;
 update public.project_proposals set updated_at=now() where id=proposal.id;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
 values(attachment.organization_id,p_actor_id,'proposal.attachment_uploaded','attachment',p_attachment_id,'success',jsonb_build_object('proposal_id',proposal.id,'size_bytes',attachment.size_bytes,'mime_type',attachment.mime_type));
 return p_attachment_id;
end; $$;

create or replace function public.abort_proposal_attachment(p_attachment_id uuid,p_actor_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare path text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment cleanup is required'; end if;
 delete from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and project_proposal_id is not null and state='uploading' returning storage_path into path;
 return path;
end; $$;
notify pgrst,'reload schema';
