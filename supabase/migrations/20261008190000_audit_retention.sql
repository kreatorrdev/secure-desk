-- Phase 5: scoped audit DTOs, ticket business activity, audited global retention and owner maintenance.
create table public.platform_settings (
 key text primary key check(key='audit_retention_days'),
 id uuid not null unique default gen_random_uuid(),
 value integer not null default 365 check(value between 1 and 3650),
 revision bigint not null default 1 check(revision>0),
 updated_by uuid references public.profiles(id),updated_at timestamptz not null default clock_timestamp()
);
insert into public.platform_settings(key) values('audit_retention_days');
alter table public.platform_settings enable row level security;
revoke all on public.platform_settings from public,anon,authenticated,service_role;
grant select on public.platform_settings to authenticated;
create policy platform_settings_sa_read on public.platform_settings for select to authenticated using((select securedesk_private.active_actor_role())='super_admin');

create function securedesk_private.can_read_audit_organization(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(securedesk_private.active_actor_role()='super_admin',false) or
  (securedesk_private.active_actor_role()='admin' and exists(select 1 from public.organizations o join public.organization_admin_assignments a on a.organization_id=o.id where o.id=target and o.status in ('pending','active','inactive') and a.admin_user_id=auth.uid() and a.active));
$$;
revoke all on function securedesk_private.can_read_audit_organization(uuid) from public,anon,authenticated,service_role;
grant execute on function securedesk_private.can_read_audit_organization(uuid) to authenticated;
alter policy audit_logs_read_scope on public.audit_logs using((select securedesk_private.active_actor_role())='super_admin' or (organization_id is not null and securedesk_private.can_read_audit_organization(organization_id)));
create index audit_logs_created_id on public.audit_logs(created_at desc,id desc);
create index audit_logs_ticket_activity on public.audit_logs(target_id,created_at desc,id desc) where target_type='ticket';

-- Never return arbitrary metadata, free-text reasons, email addresses or codes in a general audit DTO.
create function securedesk_private.audit_safe_metadata(m jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object(
  'value',case when m->>'value' in ('Open','Assigned','In Progress','Waiting for Client','Resolved','Closed','Low','Medium','High','Critical') then m->'value' end,
  'on_behalf',case when jsonb_typeof(m->'on_behalf')='boolean' then m->'on_behalf' end,
  'previous_revision',case when m->>'previous_revision' ~ '^[0-9]{1,18}$' then m->'previous_revision' end,
  'close_kind',case when m->>'close_kind' in ('auto_close','client_acceptance','admin_exception','accept','admin_close') then m->'close_kind' end,
  'previous_days',case when m->>'previous_days' ~ '^[0-9]{1,4}$' then m->'previous_days' end,
  'retention_days',case when m->>'retention_days' ~ '^[0-9]{1,4}$' then m->'retention_days' end,
  'removed_count',case when m->>'removed_count' ~ '^[0-9]{1,6}$' then m->'removed_count' end));
$$;
revoke all on function securedesk_private.audit_safe_metadata(jsonb) from public,anon,authenticated,service_role;

create function public.audit_list(p_organization_id uuid default null,p_event_type text default null,p_outcome text default null,p_before_at timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor_role text; result jsonb;
begin
 actor_role:=securedesk_private.active_actor_role();
 if auth.role() is distinct from 'authenticated' or actor_role is null or actor_role not in ('admin','super_admin') then raise exception using errcode='42501',message='Audit is unavailable'; end if;
 if p_organization_id is not null and not securedesk_private.can_read_audit_organization(p_organization_id) then raise exception using errcode='42501',message='Audit is unavailable'; end if;
 if (p_event_type is not null and p_event_type !~ '^[a-z][a-z0-9_.]{0,99}$') or (p_outcome is not null and p_outcome not in ('success','failure')) or (p_before_at is null)<>(p_before_id is null) then raise exception using errcode='22023',message='Invalid audit filter'; end if;
 select coalesce(jsonb_agg(x order by x.created_at desc,x.id desc),'[]'::jsonb) into result from (
  select l.id,l.organization_id,o.name as organization_name,l.event_type,l.target_type,l.target_id,l.outcome,l.created_at,
   case when l.actor_user_id is null then case when l.metadata_redacted->>'actor_kind'='system' then 'System' else 'No user account' end else coalesce(p.full_name,'Unavailable account') end as actor_name,
   securedesk_private.audit_safe_metadata(l.metadata_redacted) as details
  from public.audit_logs l left join public.organizations o on o.id=l.organization_id left join public.profiles p on p.id=l.actor_user_id
  where (actor_role='super_admin' or (l.organization_id is not null and securedesk_private.can_read_audit_organization(l.organization_id)))
   and (p_organization_id is null or l.organization_id=p_organization_id) and (p_event_type is null or l.event_type=p_event_type) and (p_outcome is null or l.outcome=p_outcome)
   and (p_before_at is null or (l.created_at,l.id)<(p_before_at,p_before_id)) order by l.created_at desc,l.id desc limit 26
 ) x;
 return result;
end; $$;

create function public.ticket_activity(p_organization_id uuid,p_ticket_id uuid,p_before_at timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.role() is distinct from 'authenticated' or not securedesk_private.can_read_ticket(p_ticket_id) or not exists(select 1 from public.tickets where id=p_ticket_id and organization_id=p_organization_id) then raise exception using errcode='42501',message='Ticket activity is unavailable'; end if;
 if (p_before_at is null)<>(p_before_id is null) then raise exception using errcode='22023',message='Invalid activity cursor'; end if;
 select coalesce(jsonb_agg(x order by x.created_at desc,x.id desc),'[]'::jsonb) into result from (
  select l.id,l.event_type,l.created_at,case when l.actor_user_id is null then 'System' else coalesce(p.full_name,'Unavailable account') end as actor_name,
   securedesk_private.audit_safe_metadata(l.metadata_redacted) as details
  from public.audit_logs l left join public.profiles p on p.id=l.actor_user_id
  where l.organization_id=p_organization_id and ((l.target_type='ticket' and l.target_id=p_ticket_id) or (l.target_type='attachment' and exists(select 1 from public.attachments a where a.id=l.target_id and a.ticket_id=p_ticket_id and a.organization_id=p_organization_id and a.state='ready'))) and l.outcome='success'
   and l.event_type in ('ticket.created','ticket.owner','ticket.status','ticket.priority','ticket.add_collaborator','ticket.remove_collaborator','ticket.comment_added','ticket.comment_edited','ticket.sharing_requested','ticket.sharing_approve','ticket.sharing_reject','ticket.sharing_revoked','ticket.reopen_requested','ticket.reopen_approve','ticket.reopen_reject','ticket.solution_accepted','ticket.admin_closed','ticket.auto_closed','ticket.attachment_uploaded')
   and (p_before_at is null or (l.created_at,l.id)<(p_before_at,p_before_id)) order by l.created_at desc,l.id desc limit 26
 ) x;
 return result;
end; $$;

create function public.audit_retention_settings() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'authenticated' or securedesk_private.active_actor_role() is distinct from 'super_admin' then raise exception using errcode='42501',message='Retention settings are unavailable'; end if;
 return (select jsonb_build_object('days',s.value,'revision',s.revision::text,'access_revision',p.access_revision::text,'updated_at',s.updated_at) from public.platform_settings s join public.profiles p on p.id=auth.uid() where s.key='audit_retention_days');
end; $$;

create function public.set_audit_retention(p_days integer,p_expected_revision bigint,p_expected_access_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; setting public.platform_settings%rowtype;
begin
 actor:=securedesk_private.lock_registration_actor();
 if actor.account_status<>'active' or actor.app_role<>'super_admin' then
  -- Authoritative denied RPC attempt; bounded to one event per verified actor per minute.
  if not exists(select 1 from public.audit_logs where actor_user_id=actor.id and event_type='security.audit_retention_denied' and created_at>clock_timestamp()-interval '1 minute') then
   insert into public.audit_logs(actor_user_id,event_type,target_type,target_id,outcome) select actor.id,'security.audit_retention_denied','platform_setting',id,'failure' from public.platform_settings where key='audit_retention_days';
  end if;
  return jsonb_build_object('saved',false,'code','forbidden');
 end if;
 if p_expected_access_revision is null or actor.access_revision<>p_expected_access_revision then raise exception using errcode='40001',message='Administrator access has changed'; end if;
 if p_days is null or p_days not between 1 and 3650 or p_expected_revision is null or p_expected_revision<1 then raise exception using errcode='22023',message='Retention must be from 1 to 3650 days'; end if;
 select * into setting from public.platform_settings where key='audit_retention_days' for update;
 if setting.revision<>p_expected_revision then raise exception using errcode='40001',message='Retention settings have changed'; end if;
 if setting.value=p_days then return jsonb_build_object('saved',true,'changed',false); end if;
 update public.platform_settings set value=p_days,revision=revision+1,updated_by=actor.id,updated_at=clock_timestamp() where key=setting.key;
 insert into public.audit_logs(actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
  values(actor.id,'audit.retention_changed','platform_setting',setting.id,'success',jsonb_build_object('previous_days',setting.value,'retention_days',p_days));
 return jsonb_build_object('saved',true,'changed',true);
end; $$;

-- Keep the shared business-history guard untouched. Only audit_logs receives the retention exception.
create function securedesk_private.guard_audit_retention() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='DELETE' and current_user='postgres' and session_user='postgres' and nullif(current_setting('request.jwt.claims',true),'') is null
  and current_setting('securedesk_private.audit_retention_running',true)='on'
  and old.created_at<nullif(current_setting('securedesk_private.audit_retention_cutoff',true),'')::timestamptz then return old; end if;
 raise exception using errcode='23514',message='Audit history cannot be rewritten or deleted directly';
end; $$;
revoke all on function securedesk_private.guard_audit_retention() from public,anon,authenticated,service_role;
drop trigger audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only before update or delete on public.audit_logs for each row execute function securedesk_private.guard_audit_retention();

create function securedesk_private.purge_expired_audit(p_batch integer default 10000) returns integer
language plpgsql security invoker set search_path='' set lock_timeout='2s' as $$
declare setting public.platform_settings%rowtype; cutoff timestamptz; removed integer;
begin
 if current_user<>'postgres' or session_user<>'postgres' or nullif(current_setting('request.jwt.claims',true),'') is not null then raise exception using errcode='42501',message='A direct maintenance session is required'; end if;
 if p_batch is null or p_batch not between 1 and 10000 then raise exception using errcode='22023',message='Invalid audit batch'; end if;
 if not pg_try_advisory_xact_lock(1935959147,6) then return 0; end if;
 select * into setting from public.platform_settings where key='audit_retention_days' for share;
 cutoff:=clock_timestamp()-setting.value*interval '24 hours';
 perform set_config('securedesk_private.audit_retention_running','on',true);
 perform set_config('securedesk_private.audit_retention_cutoff',cutoff::text,true);
 with candidates as(select id from public.audit_logs where created_at<cutoff order by created_at,id limit p_batch for update skip locked),deleted as(delete from public.audit_logs a using candidates c where a.id=c.id and a.created_at<cutoff returning a.id)
 select count(*)::integer into removed from deleted;
 perform set_config('securedesk_private.audit_retention_running','off',true);
 if removed>0 then
  insert into public.audit_logs(event_type,target_type,target_id,outcome,metadata_redacted) values('audit.retention_purged','platform_setting',setting.id,'success',jsonb_build_object('actor_kind','system','retention_days',setting.value,'removed_count',removed));
 end if;
 -- Operational job history is separate: only these SecureDesk jobs, completed runs older than 30 days.
 delete from cron.job_run_details d using cron.job j where d.jobid=j.jobid and j.username='postgres' and j.jobname in ('securedesk-ticket-auto-close','securedesk-audit-retention') and d.end_time<clock_timestamp()-interval '720 hours';
 return removed;
end; $$;
revoke all on function securedesk_private.purge_expired_audit(integer) from public,anon,authenticated,service_role;
revoke all on function public.audit_list(uuid,text,text,timestamptz,uuid),public.ticket_activity(uuid,uuid,timestamptz,uuid),public.audit_retention_settings(),public.set_audit_retention(integer,bigint,bigint) from public,anon,authenticated,service_role;
grant execute on function public.audit_list(uuid,text,text,timestamptz,uuid),public.ticket_activity(uuid,uuid,timestamptz,uuid),public.audit_retention_settings(),public.set_audit_retention(integer,bigint,bigint) to authenticated;
select cron.schedule('securedesk-audit-retention','15 3 * * *',$job$set statement_timeout='30s';select securedesk_private.purge_expired_audit(10000);$job$);