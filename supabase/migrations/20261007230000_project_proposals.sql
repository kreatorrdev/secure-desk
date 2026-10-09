-- Phase 3: private project proposals, assigned recommendation and scoped final decision.
create table public.project_proposals (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 proposed_by_user_id uuid not null references public.profiles(id),
 title text not null check(length(btrim(title)) between 1 and 200 and lower(btrim(title))<>'general support'),
 description text not null check(length(btrim(description)) between 1 and 4000),
 reason text not null check(length(btrim(reason)) between 1 and 4000),
 desired_deadline date not null,
 proposed_priority text not null check(proposed_priority in ('Low','Medium','High','Critical')),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 reviewer_staff_user_id uuid references public.profiles(id),
 reviewer_assignment_revision bigint,
 reviewer_access_revision bigint,
 recommendation text check(length(recommendation) between 1 and 4000),
 recommended_by_user_id uuid references public.profiles(id),
 recommended_at timestamptz,
 decided_by_admin_user_id uuid references public.profiles(id),
 decision_reason text check(length(decision_reason) between 1 and 4000),
 decided_at timestamptz,
 project_id uuid unique references public.projects(id),
 revision bigint not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,id),
 check((reviewer_staff_user_id is null and reviewer_assignment_revision is null and reviewer_access_revision is null)
   or (reviewer_staff_user_id is not null and reviewer_assignment_revision>0 and reviewer_access_revision>0)),
 check((recommendation is null and recommended_by_user_id is null and recommended_at is null)
   or (recommendation is not null and recommended_by_user_id is not null and recommended_at is not null)),
 check((status='pending' and decided_by_admin_user_id is null and decided_at is null and decision_reason is null and project_id is null)
   or (status='approved' and decided_by_admin_user_id is not null and decided_at is not null and project_id is not null)
   or (status='rejected' and decided_by_admin_user_id is not null and decided_at is not null and decision_reason is not null and project_id is null))
);
create index proposals_company_list on public.project_proposals(organization_id,created_at desc,id);
create index proposals_author on public.project_proposals(proposed_by_user_id);
create index proposals_reviewer on public.project_proposals(reviewer_staff_user_id);
create index proposals_decider on public.project_proposals(decided_by_admin_user_id);
create index proposals_recommender on public.project_proposals(recommended_by_user_id);
alter table public.project_proposals enable row level security;
revoke all on public.project_proposals from public,anon,authenticated,service_role;
grant select on public.project_proposals to authenticated;

create function securedesk_private.can_read_proposal(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.role()='authenticated' and exists (
 select 1 from public.project_proposals p
 where p.id=target and securedesk_private.can_read_organization(p.organization_id) and (
 securedesk_private.can_administer_organization(p.organization_id)
 or (p.proposed_by_user_id=auth.uid() and securedesk_private.active_actor_role() in ('client','admin','super_admin'))
 or (p.reviewer_staff_user_id=auth.uid() and securedesk_private.active_actor_role()='staff'
 and exists(select 1 from public.profiles u where u.id=auth.uid() and u.access_revision=p.reviewer_access_revision)
 and exists(select 1 from public.staff_organization_assignments a where a.organization_id=p.organization_id
 and a.staff_user_id=auth.uid() and a.active and a.revision=p.reviewer_assignment_revision))
 ));
$$;
revoke all on function securedesk_private.can_read_proposal(uuid) from public,anon,service_role;
grant execute on function securedesk_private.can_read_proposal(uuid) to authenticated;
create policy proposal_read on public.project_proposals for select to authenticated using(securedesk_private.can_read_proposal(id));
create function securedesk_private.guard_proposal_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.id,new.organization_id,new.proposed_by_user_id,new.title,new.description,new.reason,new.desired_deadline,new.proposed_priority,new.created_at)
 is distinct from (old.id,old.organization_id,old.proposed_by_user_id,old.title,old.description,old.reason,old.desired_deadline,old.proposed_priority,old.created_at)
 or old.status<>'pending' then raise exception using errcode='22023',message='Proposal identity and final decision cannot change'; end if;
 return new;
end; $$;
revoke all on function securedesk_private.guard_proposal_identity() from public,anon,authenticated,service_role;
create trigger proposal_identity before update on public.project_proposals for each row execute function securedesk_private.guard_proposal_identity();
create trigger proposal_revision before update on public.project_proposals for each row execute function securedesk_private.advance_assignment_revision();
create trigger proposal_updated before update on public.project_proposals for each row execute function securedesk_private.touch_updated_at();

-- Same identity -> organization -> assignment ordering as existing access/project mutations.
create function securedesk_private.lock_proposal_actor(target_org uuid,expected_access bigint,expected_assignment bigint,mode text)
returns public.profiles language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; org_status text; scope_revision bigint;
begin
 actor:=securedesk_private.lock_registration_actor();
 if actor.account_status<>'active' or actor.app_role not in ('client','staff','admin','super_admin')
 or not securedesk_private.can_read_organization(target_org)
 or (mode='submit' and actor.app_role='staff')
 or (mode='admin' and not securedesk_private.can_administer_organization(target_org)) then
 raise exception using errcode='42501',message='Proposal access is unavailable'; end if;
 if expected_access is null or actor.access_revision<>expected_access then
 raise exception using errcode='40001',message='Proposal permissions have changed'; end if;
 select status into org_status from public.organizations where id=target_org for update;
 if actor.app_role='client' then
  select 1 into scope_revision from public.organization_members where organization_id=target_org and user_id=auth.uid() and status='active' for share;
 elsif actor.app_role='staff' then
  select revision into scope_revision from public.staff_organization_assignments where organization_id=target_org and staff_user_id=auth.uid() and active for share;
 elsif actor.app_role='admin' then
  select revision into scope_revision from public.organization_admin_assignments where organization_id=target_org and admin_user_id=auth.uid() and active for share;
 end if;
 if not securedesk_private.can_read_organization(target_org) then raise exception using errcode='42501',message='Proposal access is unavailable'; end if;
 if actor.app_role in ('admin','staff') then
  if expected_assignment is null or scope_revision<>expected_assignment then raise exception using errcode='40001',message='Proposal assignment has changed'; end if;
 elsif expected_assignment is not null then raise exception using errcode='22023',message='Invalid proposal assignment'; end if;
 if org_status is distinct from 'active' then raise exception using errcode='22023',message='An active company is required'; end if;
 return actor;
end; $$;
revoke all on function securedesk_private.lock_proposal_actor(uuid,bigint,bigint,text) from public,anon,authenticated,service_role;

create function public.organization_proposal_context(p_organization_id uuid)
returns table(organization_name text,organization_status text,can_submit boolean,can_administer boolean,access_revision text,assignment_revision text)
language plpgsql stable security definer set search_path='' as $$
declare actor public.profiles%rowtype; scope_revision bigint;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_organization(p_organization_id) then raise exception using errcode='42501',message='Proposals are unavailable'; end if;
 select * into actor from public.profiles where id=auth.uid();
 if actor.app_role='admin' then select revision into scope_revision from public.organization_admin_assignments where organization_id=p_organization_id and admin_user_id=auth.uid() and active;
 elsif actor.app_role='staff' then select revision into scope_revision from public.staff_organization_assignments where organization_id=p_organization_id and staff_user_id=auth.uid() and active; end if;
 return query select o.name,o.status,o.status='active' and actor.app_role in ('client','admin','super_admin'),
 o.status='active' and securedesk_private.can_administer_organization(o.id),actor.access_revision::text,scope_revision::text
 from public.organizations o where o.id=p_organization_id;
end; $$;
create function public.organization_proposals(p_organization_id uuid,p_status text default 'all',p_offset integer default 0)
returns table(id uuid,title text,status text,proposed_priority text,desired_deadline date,created_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_organization(p_organization_id) then raise exception using errcode='42501',message='Proposals are unavailable'; end if;
 if p_status is null or p_status not in ('all','pending','approved','rejected') or p_offset is null or p_offset not between 0 and 249975 then raise exception using errcode='22023',message='Invalid proposal filters'; end if;
 return query select p.id,p.title,p.status,p.proposed_priority,p.desired_deadline,p.created_at
 from public.project_proposals p where p.organization_id=p_organization_id and securedesk_private.can_read_proposal(p.id)
 and (p_status='all' or p.status=p_status) order by p.created_at desc,p.id limit 26 offset p_offset;
end; $$;
create function public.organization_proposal(p_organization_id uuid,p_proposal_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_proposal(p_proposal_id) then raise exception using errcode='42501',message='Proposal is unavailable'; end if;
 select (to_jsonb(p)-'reviewer_access_revision'-'reviewer_assignment_revision')||jsonb_build_object('revision',p.revision::text,
 'author_name',u.full_name,'reviewer_name',r.full_name,
 'can_upload',o.status='active' and p.status='pending' and (p.proposed_by_user_id=auth.uid() or securedesk_private.can_administer_organization(p.organization_id)),
 'can_recommend',o.status='active' and p.status='pending' and (securedesk_private.can_administer_organization(p.organization_id) or (p.reviewer_staff_user_id=auth.uid() and securedesk_private.active_actor_role()='staff')))
 into result from public.project_proposals p join public.organizations o on o.id=p.organization_id join public.profiles u on u.id=p.proposed_by_user_id
 left join public.profiles r on r.id=p.reviewer_staff_user_id where p.id=p_proposal_id and p.organization_id=p_organization_id;
 if result is null then raise exception using errcode='42501',message='Proposal is unavailable'; end if;
 return result;
end; $$;
create function public.submit_project_proposal(p_organization_id uuid,p_proposal_id uuid,p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_details jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; title text; description text; reason text; deadline date; priority text; existing public.project_proposals%rowtype;
begin
 actor:=securedesk_private.lock_proposal_actor(p_organization_id,p_expected_access_revision,p_expected_assignment_revision,'submit');
 if p_proposal_id is null or jsonb_typeof(p_details) is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_details) k where k not in ('title','description','reason','desired_deadline','proposed_priority')) then raise exception using errcode='22023',message='Invalid proposal details'; end if;
 title:=securedesk_private.required_registration_text(p_details,'title',200);
 description:=securedesk_private.required_registration_text(p_details,'description',4000);
 reason:=securedesk_private.required_registration_text(p_details,'reason',4000);
 priority:=securedesk_private.required_registration_text(p_details,'proposed_priority',10);
 if lower(title)='general support' or priority not in ('Low','Medium','High','Critical')
 or jsonb_typeof(p_details->'desired_deadline') is distinct from 'string' or p_details->>'desired_deadline' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception using errcode='22023',message='Invalid proposal details'; end if;
 begin deadline:=(p_details->>'desired_deadline')::date; exception when others then raise exception using errcode='22023',message='Invalid proposal deadline'; end;
 select * into existing from public.project_proposals where id=p_proposal_id;
 if found then
 if existing.organization_id=p_organization_id and existing.proposed_by_user_id=auth.uid()
 and (existing.title,existing.description,existing.reason,existing.desired_deadline,existing.proposed_priority)=(title,description,reason,deadline,priority) then return existing.id; end if;
 raise exception using errcode='40001',message='Proposal submission has changed'; end if;
 insert into public.project_proposals(id,organization_id,proposed_by_user_id,title,description,reason,desired_deadline,proposed_priority)
 values(p_proposal_id,p_organization_id,auth.uid(),title,description,reason,deadline,priority);
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome)
 values(p_organization_id,auth.uid(),'proposal.submitted','project_proposal',p_proposal_id,'success');
 return p_proposal_id;
end; $$;
create function public.proposal_reviewers(p_organization_id uuid,p_search text default '')
returns table(user_id uuid,full_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_administer_organization(p_organization_id) then raise exception using errcode='42501',message='Reviewers are unavailable'; end if;
 if p_search is null or length(p_search)>100 then raise exception using errcode='22023',message='Invalid reviewer search'; end if;
 return query select p.id,p.full_name from public.staff_organization_assignments a join public.profiles p on p.id=a.staff_user_id
 join auth.users u on u.id=p.id where a.organization_id=p_organization_id and a.active and p.app_role='staff' and p.account_status='active'
 and u.email_confirmed_at is not null and not u.is_anonymous and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())
 and (p_search='' or position(lower(p_search) in lower(p.full_name))>0 or p.id::text=p_search) order by p.full_name,p.id limit 25;
end; $$;
create function public.review_project_proposal(p_organization_id uuid,p_proposal_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_intent text,p_reviewer_id uuid default null,p_text text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; proposal public.project_proposals%rowtype; reviewer_access bigint; reviewer_assignment bigint; result_project uuid; note text;
begin
 -- Reviewer profiles are read without taking a lock after org; access checks use saved live revisions.
 actor:=securedesk_private.lock_proposal_actor(p_organization_id,p_expected_access_revision,p_expected_assignment_revision,
 case when p_intent='recommend' then 'recommend' else 'admin' end);
 select * into proposal from public.project_proposals where id=p_proposal_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_proposal(p_proposal_id) then raise exception using errcode='42501',message='Proposal access is unavailable'; end if;
 if p_expected_revision is null or proposal.revision<>p_expected_revision then raise exception using errcode='40001',message='Proposal has changed'; end if;
 if proposal.status<>'pending' then raise exception using errcode='22023',message='Proposal decision is final'; end if;
 if p_intent is null or p_intent not in ('assign','recommend','approve','reject') then raise exception using errcode='22023',message='Invalid proposal review'; end if;
 note:=nullif(btrim(p_text),'');
 if note is not null and length(note)>4000 then raise exception using errcode='22023',message='Invalid proposal review text'; end if;
 if p_intent='assign' then
  if p_text is not null then raise exception using errcode='22023',message='Invalid reviewer assignment'; end if;
  if p_reviewer_id is not null then
   select u.access_revision,a.revision into reviewer_access,reviewer_assignment from public.profiles u
   join auth.users au on au.id=u.id join public.staff_organization_assignments a on a.staff_user_id=u.id
   where u.id=p_reviewer_id and u.app_role='staff' and u.account_status='active' and a.organization_id=p_organization_id and a.active
   and au.email_confirmed_at is not null and not au.is_anonymous and au.deleted_at is null and (au.banned_until is null or au.banned_until<=now());
   if not found then raise exception using errcode='22023',message='An eligible assigned Staff reviewer is required'; end if;
  end if;
  if (proposal.reviewer_staff_user_id,proposal.reviewer_access_revision,proposal.reviewer_assignment_revision) is not distinct from (p_reviewer_id,reviewer_access,reviewer_assignment) then return proposal.id; end if;
  update public.project_proposals set reviewer_staff_user_id=p_reviewer_id,reviewer_access_revision=reviewer_access,reviewer_assignment_revision=reviewer_assignment,
  recommendation=null,recommended_by_user_id=null,recommended_at=null where id=proposal.id;
 elsif p_intent='recommend' then
  if p_reviewer_id is not null or note is null or (actor.app_role='staff' and proposal.reviewer_staff_user_id<>auth.uid()) or actor.app_role='client' then raise exception using errcode='42501',message='Recommendation access is unavailable'; end if;
  update public.project_proposals set recommendation=note,recommended_by_user_id=auth.uid(),recommended_at=now() where id=proposal.id;
 else
  if p_reviewer_id is not null or (p_intent='reject' and note is null) then raise exception using errcode='22023',message='A rejection reason is required'; end if;
  if exists(select 1 from public.attachments where project_proposal_id=proposal.id and state='uploading' and expires_at>now()) then raise exception using errcode='40001',message='An attachment upload is still in progress'; end if;
  if p_intent='approve' then
   result_project:=gen_random_uuid();
   insert into public.projects(id,organization_id,name,description,created_by_user_id)
   values(result_project,p_organization_id,proposal.title,proposal.description,auth.uid());
   insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
   values(p_organization_id,auth.uid(),'project.created_from_proposal','project',result_project,'success',jsonb_build_object('proposal_id',proposal.id));
  end if;
  update public.project_proposals set status=case when p_intent='approve' then 'approved' else 'rejected' end,
  decided_by_admin_user_id=auth.uid(),decided_at=now(),decision_reason=note,project_id=result_project where id=proposal.id;
 end if;
 insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
 values(p_organization_id,auth.uid(),'proposal.'||p_intent,'project_proposal',proposal.id,'success',
 jsonb_build_object('previous_revision',proposal.revision,'revision',proposal.revision+1,'reviewer_id',case when p_intent='assign' then p_reviewer_id else null end,'project_id',result_project));
 return coalesce(result_project,proposal.id);
end; $$;

alter table public.project_proposals add constraint proposal_project_tenant foreign key(organization_id,project_id) references public.projects(organization_id,id);

-- Only proposal parents exist in Phase 3. Ticket parent/XOR is added with the ticket module.
create table public.attachments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 project_proposal_id uuid not null,
 uploaded_by_user_id uuid not null references public.profiles(id),
 storage_path text not null unique,
 original_name text not null check(length(original_name) between 1 and 200 and original_name !~ '[/\\[:cntrl:]]'),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
 size_bytes integer not null check(size_bytes between 1 and 10485760),
 sha256 text check(sha256 ~ '^[0-9a-f]{64}$'),
 state text not null default 'uploading' check(state in ('uploading','ready')),
 actor_access_revision bigint not null check(actor_access_revision>0),
 actor_assignment_revision bigint,
 actor_membership_id uuid references public.organization_members(id),
 proposal_revision bigint not null check(proposal_revision>0),
 expires_at timestamptz not null default now()+interval '15 minutes',
 created_at timestamptz not null default now(),
 foreign key(organization_id,project_proposal_id) references public.project_proposals(organization_id,id),
 check(state<>'ready' or sha256 is not null),
 check(storage_path=organization_id::text||'/'||project_proposal_id::text||'/'||id::text)
);
create index attachments_parent on public.attachments(project_proposal_id,state);
create index attachments_actor on public.attachments(uploaded_by_user_id);
alter table public.attachments enable row level security;
revoke all on public.attachments from public,anon,authenticated,service_role;
grant select(id,organization_id,project_proposal_id,uploaded_by_user_id,original_name,mime_type,size_bytes,created_at,state) on public.attachments to authenticated;
create policy attachment_read on public.attachments for select to authenticated using(state='ready' and securedesk_private.can_read_proposal(project_proposal_id));

-- Bucket is private with no user Storage policies: upload, download and signing cannot bypass the app validator.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('proposal-attachments','proposal-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
create function public.reserve_proposal_attachment(p_organization_id uuid,p_proposal_id uuid,p_expected_revision bigint,p_expected_access_revision bigint,p_expected_assignment_revision bigint,p_name text,p_mime text,p_size integer)
returns table(id uuid,storage_path text)
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; proposal public.project_proposals%rowtype; attachment_id uuid:=gen_random_uuid();
begin
 actor:=securedesk_private.lock_proposal_actor(p_organization_id,p_expected_access_revision,p_expected_assignment_revision,'upload');
 select * into proposal from public.project_proposals where project_proposals.id=p_proposal_id and organization_id=p_organization_id for update;
 if not found or not securedesk_private.can_read_proposal(p_proposal_id) or (proposal.proposed_by_user_id<>auth.uid() and not securedesk_private.can_administer_organization(p_organization_id)) then raise exception using errcode='42501',message='Attachment upload is unavailable'; end if;
 if proposal.revision is distinct from p_expected_revision then raise exception using errcode='40001',message='Proposal has changed'; end if;
 if proposal.status<>'pending' then raise exception using errcode='22023',message='Only pending proposals accept uploads'; end if;
 if p_name is null or length(p_name) not between 1 and 200 or p_name ~ '[/\\[:cntrl:]]'
 or p_mime is null or p_mime not in ('image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
 or p_size is null or p_size not between 1 and 10485760 then raise exception using errcode='22023',message='Invalid attachment'; end if;
 if (select count(*) from public.attachments where uploaded_by_user_id=auth.uid() and state='uploading' and expires_at>now())>=5 then raise exception using errcode='22023',message='Too many uploads in progress'; end if;
 insert into public.attachments(id,organization_id,project_proposal_id,uploaded_by_user_id,storage_path,original_name,mime_type,size_bytes,actor_access_revision,actor_assignment_revision,actor_membership_id,proposal_revision)
 values(attachment_id,p_organization_id,p_proposal_id,auth.uid(),p_organization_id::text||'/'||p_proposal_id::text||'/'||attachment_id::text,p_name,p_mime,p_size,actor.access_revision,p_expected_assignment_revision,(select m.id from public.organization_members m where m.organization_id=p_organization_id and m.user_id=auth.uid() and m.status='active'),proposal.revision);
 return query select a.id,a.storage_path from public.attachments a where a.id=attachment_id;
end; $$;
create function public.complete_proposal_attachment(p_attachment_id uuid,p_actor_id uuid,p_sha256 text)
returns uuid language plpgsql security definer set search_path='' as $$
declare attachment public.attachments%rowtype; actor public.profiles%rowtype; proposal public.project_proposals%rowtype; org_status text;
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment completion is required'; end if;
 select * into attachment from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id;
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
-- Compensation can only remove this actor's unfinished reservation; never a published attachment.
create function public.abort_proposal_attachment(p_attachment_id uuid,p_actor_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception using errcode='42501',message='Trusted attachment cleanup is required'; end if;
 delete from public.attachments where id=p_attachment_id and uploaded_by_user_id=p_actor_id and state='uploading';
end; $$;
create function public.proposal_attachment(p_organization_id uuid,p_proposal_id uuid,p_attachment_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_proposal(p_proposal_id) then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 select jsonb_build_object('id',a.id,'storage_path',a.storage_path,'original_name',a.original_name,'mime_type',a.mime_type,'size_bytes',a.size_bytes,'sha256',a.sha256)
 into result from public.attachments a where a.id=p_attachment_id and a.organization_id=p_organization_id and a.project_proposal_id=p_proposal_id and a.state='ready';
 if result is null then raise exception using errcode='42501',message='Attachment is unavailable'; end if;
 return result;
end; $$;

revoke all on function public.organization_proposal_context(uuid),public.organization_proposals(uuid,text,integer),public.organization_proposal(uuid,uuid),
public.submit_project_proposal(uuid,uuid,bigint,bigint,jsonb),public.proposal_reviewers(uuid,text),
public.review_project_proposal(uuid,uuid,bigint,bigint,bigint,text,uuid,text),public.reserve_proposal_attachment(uuid,uuid,bigint,bigint,bigint,text,text,integer),
public.proposal_attachment(uuid,uuid,uuid),public.complete_proposal_attachment(uuid,uuid,text),public.abort_proposal_attachment(uuid,uuid)
from public,anon,authenticated,service_role;
grant execute on function public.organization_proposal_context(uuid),public.organization_proposals(uuid,text,integer),public.organization_proposal(uuid,uuid),
public.submit_project_proposal(uuid,uuid,bigint,bigint,jsonb),public.proposal_reviewers(uuid,text),
public.review_project_proposal(uuid,uuid,bigint,bigint,bigint,text,uuid,text),public.reserve_proposal_attachment(uuid,uuid,bigint,bigint,bigint,text,text,integer),
public.proposal_attachment(uuid,uuid,uuid) to authenticated;
grant execute on function public.complete_proposal_attachment(uuid,uuid,text),public.abort_proposal_attachment(uuid,uuid) to service_role;
notify pgrst,'reload schema';
