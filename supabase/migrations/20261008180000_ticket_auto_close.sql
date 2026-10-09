-- Phase 5: owner-only, database scheduled closure. No API/business-role execution.
create extension if not exists pg_cron with schema pg_catalog;
revoke all on schema cron from public,anon,authenticated,service_role;

create index tickets_resolution_deadline on public.tickets(resolved_at,id) where status='Resolved';
create function securedesk_private.ticket_auto_close_due(resolution timestamptz,stamp timestamptz) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(stamp>=resolution+interval '168 hours',false);
$$;
revoke all on function securedesk_private.ticket_auto_close_due(timestamptz,timestamptz) from public,anon,authenticated,service_role;

create function securedesk_private.auto_close_resolved_tickets(p_batch integer default 100) returns integer
language plpgsql security invoker set search_path='' set lock_timeout='2s' as $$
declare candidate record; t public.tickets%rowtype; org_status text; stamp timestamptz; affected integer; closed_count integer:=0;
begin
 -- A business Super Admin is not a scheduler. The private entry point requires a direct owner session.
 if current_user<>'postgres' or session_user<>'postgres' or nullif(current_setting('request.jwt.claims',true),'') is not null then
  raise exception using errcode='42501',message='A direct database scheduler session is required';
 end if;
 if p_batch is null or p_batch not between 1 and 1000 then raise exception using errcode='22023',message='Invalid auto-close batch'; end if;
 -- Transaction lock also covers manual owner runs; concurrent workers retry on the next tick.
 if not pg_try_advisory_xact_lock(1935959147,5) then return 0; end if;
 for candidate in
  select x.id,x.organization_id from public.tickets x join public.organizations o on o.id=x.organization_id
  where o.status='active' and x.status='Resolved' and x.resolved_at<=clock_timestamp()-interval '168 hours'
   and not exists(select 1 from public.ticket_reopen_requests r where r.ticket_id=x.id and r.status='pending')
  order by x.resolved_at,x.id limit p_batch*10
 loop
  exit when closed_count>=p_batch;
  -- Same parent lock order as human mutations: company, then ticket. Never wait for busy rows.
  select status into org_status from public.organizations where id=candidate.organization_id for share skip locked;
  if not found or org_status<>'active' then continue; end if;
  select * into t from public.tickets where id=candidate.id and organization_id=candidate.organization_id for update skip locked;
  if not found then continue; end if;
  stamp:=clock_timestamp();
  -- This fresh statement rechecks after locks, including requests committed since candidate selection.
  update public.tickets x set status='Closed',closed_at=stamp,close_reason='Automatically closed after the seven-day response window without a pending continuation request.'
   where x.id=t.id and x.status='Resolved' and securedesk_private.ticket_auto_close_due(x.resolved_at,stamp)
    and not exists(select 1 from public.ticket_reopen_requests r where r.ticket_id=x.id and r.status='pending');
  get diagnostics affected=row_count;
  if affected=0 then continue; end if;
  insert into public.audit_logs(organization_id,actor_user_id,event_type,target_type,target_id,outcome,metadata_redacted)
   values(t.organization_id,null,'ticket.auto_closed','ticket',t.id,'success',jsonb_build_object('actor_kind','system','close_kind','auto_close','previous_revision',t.revision,'original_deadline',t.resolved_at+interval '168 hours','reason','Seven-day response window elapsed without a pending continuation request.'));
  closed_count:=closed_count+1;
 end loop;
 return closed_count;
end; $$;
revoke all on function securedesk_private.auto_close_resolved_tickets(integer) from public,anon,authenticated,service_role;

-- Stable name makes scheduler installation repeatable. Statement timeout bounds a failed/busy run.
select cron.schedule('securedesk-ticket-auto-close','* * * * *',$job$set statement_timeout='30s';select securedesk_private.auto_close_resolved_tickets(100);$job$);