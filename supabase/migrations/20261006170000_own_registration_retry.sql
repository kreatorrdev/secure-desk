-- Own rejected-request details and an expected-attempt guard for the existing retry workflow.
begin;
create function public.own_registration_retry_details()
returns table (request_id uuid,company_name text,phone text,message text)
language plpgsql stable security definer set search_path='' as $$
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null
    or coalesce(auth.jwt()->>'is_anonymous','false') <> 'false'
    or not exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
      and not coalesce(u.is_anonymous,false) and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now())) then
    raise exception using errcode='42501',message='A verified account is required';
  end if;
  return query select r.id,r.company_name_text,r.phone,r.message
    from public.profiles p join lateral (
      select last.* from public.registration_requests last where last.user_id=p.id order by last.attempt_number desc limit 1
    ) r on true
    where p.id=auth.uid() and p.app_role='client' and p.account_status='rejected' and r.status='rejected'
      and not exists(select 1 from public.registration_requests pending where pending.user_id=p.id and pending.status='pending')
      and not exists(select 1 from public.organization_members m where m.user_id=p.id and m.status='active')
      and not exists(select 1 from public.staff_organization_assignments s where s.staff_user_id=p.id and s.active)
      and not exists(select 1 from public.organization_admin_assignments a where a.admin_user_id=p.id and a.active);
end;
$$;

create function public.resubmit_registration_form(p_expected_request_id uuid,p_company_name text,p_phone text,p_message text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.profiles%rowtype; latest_id uuid;
begin
  -- Serialize the same actor as the original retry/review routines. The comparison is atomic.
  actor:=securedesk_private.lock_registration_actor();
  if actor.app_role <> 'client' or actor.account_status <> 'rejected' then
    raise exception using errcode='42501',message='Registration retry is not available';
  end if;
  select r.id into latest_id from public.registration_requests r where r.user_id=auth.uid()
    order by r.attempt_number desc limit 1 for update;
  if p_expected_request_id is null or latest_id is distinct from p_expected_request_id then
    raise exception using errcode='42501',message='Registration retry is not available';
  end if;
  return public.resubmit_registration(p_company_name,p_phone,p_message);
end;
$$;
revoke all on function public.own_registration_retry_details(),public.resubmit_registration_form(uuid,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.own_registration_retry_details(),public.resubmit_registration_form(uuid,text,text,text) to authenticated;
commit;
