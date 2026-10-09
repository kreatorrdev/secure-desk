-- SecureDesk v1.0: registration request history and status reads, before Auth submission/approval.
-- Email/password stay in Supabase Auth; this table never grants organization access.
create table public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  attempt_number integer not null default 1
    constraint registration_requests_attempt_positive check (attempt_number > 0),
  company_name_text text not null
    constraint registration_requests_company_not_blank check (btrim(company_name_text) <> ''),
  message text not null constraint registration_requests_message_not_blank check (btrim(message) <> ''),
  phone text not null constraint registration_requests_phone_not_blank check (btrim(phone) <> ''),
  -- Trusted routing to an existing organization; never a self-service membership selector.
  target_organization_id uuid references public.organizations (id),
  status text not null default 'pending'
    constraint registration_requests_status_allowed check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registration_requests_user_attempt_unique unique (user_id, attempt_number),
  constraint registration_requests_review_state check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null and rejection_reason is null)
    or (status = 'approved' and reviewed_by is not null and reviewed_at is not null and rejection_reason is null)
    or (status = 'rejected' and reviewed_by is not null and reviewed_at is not null
      and rejection_reason is not null and btrim(rejection_reason) <> '')
  ),
  constraint registration_requests_review_after_creation
    check (reviewed_at is null or reviewed_at >= created_at)
);
create unique index registration_requests_one_pending_per_user
  on public.registration_requests (user_id) where status = 'pending';
create index registration_requests_org_status_idx
  on public.registration_requests (target_organization_id, status, created_at);
create index registration_requests_reviewed_by_idx on public.registration_requests (reviewed_by);

-- Submitted content and completed decisions are retained. Retry creates another attempt/UUID.
-- Pending routing may be changed by a future trusted admin routine; reviewed routing is immutable.
create function securedesk_private.guard_registration_request_history()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception using errcode = '23514', message = 'Registration request history cannot be deleted directly';
  end if;
  if old.status in ('approved', 'rejected') then
    raise exception using errcode = '23514', message = 'A reviewed registration request cannot be rewritten or reopened';
  end if;
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
    or new.attempt_number is distinct from old.attempt_number
    or new.company_name_text is distinct from old.company_name_text
    or new.message is distinct from old.message or new.phone is distinct from old.phone
    or new.created_at is distinct from old.created_at then
    raise exception using errcode = '23514', message = 'Submitted registration content is immutable; create a new attempt after rejection';
  end if;
  return new;
end;
$$;
revoke all on function securedesk_private.guard_registration_request_history()
  from public, anon, authenticated, service_role;
create trigger registration_requests_guard_history before update or delete on public.registration_requests
  for each row execute function securedesk_private.guard_registration_request_history();
create trigger registration_requests_updated_at before update on public.registration_requests
  for each row execute function securedesk_private.touch_updated_at();

alter table public.registration_requests enable row level security;
revoke all on table public.registration_requests from public, anon, authenticated, service_role;
-- The initial API exposes status/history fields only, including to administrative DB sessions.
-- Scoped review detail reads and mutation routines are implemented with the later approval workflow.
grant select (id, user_id, attempt_number, status, rejection_reason, created_at, reviewed_at)
  on public.registration_requests to authenticated;
create policy registration_requests_read_status_scope
on public.registration_requests for select to authenticated
using (
  coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
  and (
    user_id = (select auth.uid())
    or (select securedesk_private.active_actor_role()) = 'super_admin'
    or (target_organization_id is not null
      and securedesk_private.can_administer_organization(target_organization_id))
  )
);

-- No client INSERT/UPDATE/DELETE. The one-pending index is not permission to submit a request.
-- Auth/retry must validate the confirmed identity, permitted account state and next attempt number.
-- Approval must validate the reviewer/scope and atomically activate the appropriate membership/assignment.
-- Pending/unrouted requests default to Super Admin review scope, never automatic company-name matching.
