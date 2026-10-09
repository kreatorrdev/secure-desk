-- SecureDesk: email signup creates its pending profile and first request in the Auth transaction.
create function securedesk_private.required_registration_text(data jsonb, field_name text, maximum_length integer)
returns text language plpgsql security invoker set search_path = ''
as $$
declare value text;
begin
  if jsonb_typeof(data -> field_name) is distinct from 'string' then
    raise exception using errcode='22023', message='Registration field must be text: ' || field_name;
  end if;
  value := regexp_replace(data ->> field_name, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  if value = '' or char_length(value) > maximum_length then
    raise exception using errcode='22023', message='Registration field is empty or too long: ' || field_name;
  end if;
  return value;
end;
$$;
revoke all on function securedesk_private.required_registration_text(jsonb,text,integer)
  from public, anon, authenticated, service_role, supabase_auth_admin;

create function securedesk_private.handle_auth_registration()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  registered_name text;
  registered_phone text;
  registered_company text;
  registered_message text;
begin
  if coalesce(new.is_anonymous, false) or new.email is null or btrim(new.email) = '' then
    raise exception using errcode='22023', message='SecureDesk registration requires a permanent email identity';
  end if;
  if jsonb_typeof(new.raw_user_meta_data) is distinct from 'object' then
    raise exception using errcode='22023', message='SecureDesk registration data is required';
  end if;
  registered_name := securedesk_private.required_registration_text(new.raw_user_meta_data, 'full_name', 120);
  registered_phone := securedesk_private.required_registration_text(new.raw_user_meta_data, 'phone', 40);
  registered_company := securedesk_private.required_registration_text(new.raw_user_meta_data, 'company_name', 200);
  registered_message := securedesk_private.required_registration_text(new.raw_user_meta_data, 'message', 4000);

  insert into public.profiles (id,full_name,phone,app_role,account_status)
    values (new.id,registered_name,registered_phone,'client','pending');
  insert into public.registration_requests
    (user_id,attempt_number,company_name_text,message,phone,target_organization_id,status)
    values (new.id,1,registered_company,registered_message,registered_phone,null,'pending');
  return new;
end;
$$;
revoke all on function securedesk_private.handle_auth_registration()
  from public, anon, authenticated, service_role, supabase_auth_admin;
create trigger securedesk_auth_user_registered after insert on auth.users
  for each row execute function securedesk_private.handle_auth_registration();

-- Real organization privileges require both business approval and confirmed Auth email.
-- Existing policy helpers call this function; grants remain unchanged.
create or replace function securedesk_private.active_actor_role()
returns text language sql stable security definer set search_path = ''
as $$
  select p.app_role from public.profiles p
  join auth.users u on u.id=p.id
  where p.id=(select auth.uid()) and p.account_status='active'
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
    and coalesce((select auth.jwt())->>'is_anonymous','false')='false';
$$;

-- No public RPC or privileged app key. Identity comes only from NEW.id, roles/status are constants.
-- UPDATE of user metadata/email does not rerun signup or change profile/request snapshots.
-- Email confirmation permits login, but pending still blocks all private organization data.
