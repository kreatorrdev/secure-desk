-- SecureDesk v1.0: organization scopes, before registration/admin write workflows.
-- Only read access is enabled here. All application writes stay closed.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint organizations_name_not_blank check (btrim(name) <> ''),
  description text not null constraint organizations_description_not_blank check (btrim(description) <> ''),
  industry text constraint organizations_industry_not_blank check (industry is null or btrim(industry) <> ''),
  address text not null constraint organizations_address_not_blank check (btrim(address) <> ''),
  email text not null constraint organizations_email_not_blank check (btrim(email) <> ''),
  phone text not null constraint organizations_phone_not_blank check (btrim(phone) <> ''),
  contact_person text constraint organizations_contact_not_blank check (contact_person is null or btrim(contact_person) <> ''),
  status text not null default 'pending'
    constraint organizations_status_allowed check (status in ('pending', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A row represents one approved membership episode, not a pending join request.
-- Ended episodes are retained, including a later return to the same organization.
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  user_id uuid not null references public.profiles (id),
  status text not null default 'active'
    constraint organization_members_status_allowed check (status in ('active', 'ended')),
  approved_by uuid not null references public.profiles (id),
  approved_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_join_after_approval check (joined_at >= approved_at),
  constraint organization_members_end_state check (
    (status = 'active' and ended_at is null)
    or (status = 'ended' and ended_at is not null and ended_at >= joined_at)
  )
);
create unique index organization_members_one_active_per_user
  on public.organization_members (user_id) where status = 'active';
create index organization_members_org_user_idx on public.organization_members (organization_id, user_id);
create index organization_members_user_history_idx on public.organization_members (user_id, joined_at);
create index organization_members_approved_by_idx on public.organization_members (approved_by);

create table public.staff_organization_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  staff_user_id uuid not null references public.profiles (id),
  assigned_by uuid not null references public.profiles (id),
  active boolean not null default true,
  can_create_project boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_organization_assignments_org_user_unique unique (organization_id, staff_user_id)
);
create index staff_organization_assignments_active_user_idx
  on public.staff_organization_assignments (staff_user_id, organization_id) where active;
create index staff_organization_assignments_assigned_by_idx on public.staff_organization_assignments (assigned_by);

create table public.organization_admin_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  admin_user_id uuid not null references public.profiles (id),
  assigned_by uuid not null references public.profiles (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_admin_assignments_org_user_unique unique (organization_id, admin_user_id)
);
create index organization_admin_assignments_active_user_idx
  on public.organization_admin_assignments (admin_user_id, organization_id) where active;
create index organization_admin_assignments_assigned_by_idx on public.organization_admin_assignments (assigned_by);

create function securedesk_private.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function securedesk_private.touch_updated_at() from public, anon, authenticated, service_role;
create trigger organizations_updated_at before update on public.organizations
  for each row execute function securedesk_private.touch_updated_at();
create trigger organization_members_updated_at before update on public.organization_members
  for each row execute function securedesk_private.touch_updated_at();
create trigger staff_organization_assignments_updated_at before update on public.staff_organization_assignments
  for each row execute function securedesk_private.touch_updated_at();
create trigger organization_admin_assignments_updated_at before update on public.organization_admin_assignments
  for each row execute function securedesk_private.touch_updated_at();

-- Helpers read as the DB owner to avoid recursive RLS between organizations and assignments.
-- Caller identity is auth.uid(); neither caller-supplied user IDs nor editable JWT role metadata are used.
-- This schema is outside the Data API exposed schemas. Helpers only read and return a role/boolean.
create function securedesk_private.active_actor_role()
returns text language sql stable security definer set search_path = ''
as $$
  select p.app_role from public.profiles p
  where p.id = (select auth.uid()) and p.account_status = 'active'
    and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false';
$$;

create function securedesk_private.can_read_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = target_organization_id
      and (
        securedesk_private.active_actor_role() = 'super_admin'
        or (o.status = 'active' and case securedesk_private.active_actor_role()
          when 'client' then exists (
            select 1 from public.organization_members m
            where m.organization_id = o.id and m.user_id = (select auth.uid()) and m.status = 'active'
          )
          when 'staff' then exists (
            select 1 from public.staff_organization_assignments s
            where s.organization_id = o.id and s.staff_user_id = (select auth.uid()) and s.active
          )
          when 'admin' then exists (
            select 1 from public.organization_admin_assignments a
            where a.organization_id = o.id and a.admin_user_id = (select auth.uid()) and a.active
          )
          else false
        end)
      )
  );
$$;

create function securedesk_private.can_administer_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = target_organization_id
      and (
        securedesk_private.active_actor_role() = 'super_admin'
        or (o.status = 'active' and securedesk_private.active_actor_role() = 'admin' and exists (
          select 1 from public.organization_admin_assignments a
          where a.organization_id = o.id and a.admin_user_id = (select auth.uid()) and a.active
        ))
      )
  );
$$;

revoke all on function securedesk_private.active_actor_role(),
  securedesk_private.can_read_organization(uuid), securedesk_private.can_administer_organization(uuid)
  from public, anon, authenticated, service_role;
grant usage on schema securedesk_private to authenticated;
grant execute on function securedesk_private.active_actor_role(),
  securedesk_private.can_read_organization(uuid), securedesk_private.can_administer_organization(uuid)
  to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.staff_organization_assignments enable row level security;
alter table public.organization_admin_assignments enable row level security;
revoke all on table public.organizations, public.organization_members,
  public.staff_organization_assignments, public.organization_admin_assignments
  from public, anon, authenticated, service_role;
grant select on table public.organizations, public.organization_members,
  public.staff_organization_assignments, public.organization_admin_assignments to authenticated;

create policy organizations_read_scope on public.organizations for select to authenticated
  using (securedesk_private.can_read_organization(id));

-- Admins read assignments/membership history in their scope. Other users read only their own active link.
create policy organization_members_read_scope on public.organization_members for select to authenticated
  using (
    securedesk_private.can_administer_organization(organization_id)
    or (user_id = (select auth.uid()) and status = 'active'
      and (select securedesk_private.active_actor_role()) = 'client'
      and securedesk_private.can_read_organization(organization_id))
  );
create policy staff_organization_assignments_read_scope on public.staff_organization_assignments for select to authenticated
  using (
    securedesk_private.can_administer_organization(organization_id)
    or (staff_user_id = (select auth.uid()) and active
      and (select securedesk_private.active_actor_role()) = 'staff'
      and securedesk_private.can_read_organization(organization_id))
  );
create policy organization_admin_assignments_read_scope on public.organization_admin_assignments for select to authenticated
  using (securedesk_private.can_administer_organization(organization_id));

-- No INSERT/UPDATE/DELETE policies or grants, including for an authenticated business Super Admin.
-- Scoped write routines will validate target roles/approval/audit in a later migration.
-- Non-super-admin access to pending/inactive organizations remains closed until the approval/archive workflows.
-- General Support creation is deferred to the atomic organization approval flow; no projects exist yet.
