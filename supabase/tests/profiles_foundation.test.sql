-- Fictional local fixtures only. ROLLBACK removes every test account/profile.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select extensions.plan(33);
-- Signup bridge stays enabled; these fictional identities create their own pending profiles/requests.
insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','alice@securedesk.example.invalid',now(),'{"app_role":"super_admin","account_status":"active","full_name":"Test Alice","phone":"+12025550101","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('10000000-0000-4000-8000-000000000002','bob@securedesk.example.invalid',now(),'{"full_name":"Test Bob","phone":"+12025550102","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('10000000-0000-4000-8000-000000000003','staff@securedesk.example.invalid',now(),'{"full_name":"Test Staff","phone":"+12025550103","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('10000000-0000-4000-8000-000000000004','admin@securedesk.example.invalid',now(),'{"full_name":"Test Admin","phone":"+12025550104","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('10000000-0000-4000-8000-000000000005','superadmin@securedesk.example.invalid',now(),'{"full_name":"Test Super Admin","phone":"+12025550105","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}');
-- Default client/pending profile was created by Auth INSERT.
-- Fixture-only trusted role/status changes after signup.
update public.profiles p set full_name=v.full_name,phone=v.phone,app_role=v.app_role,account_status=v.account_status
from (values
 ('10000000-0000-4000-8000-000000000002','Test Bob','+12025550102','client','active'),
 ('10000000-0000-4000-8000-000000000003','Test Staff','+12025550103','staff','active'),
 ('10000000-0000-4000-8000-000000000004','Test Admin','+12025550104','admin','active'),
 ('10000000-0000-4000-8000-000000000005','Test Super Admin','+12025550105','super_admin','active')
) as v(id,full_name,phone,app_role,account_status) where p.id=v.id::uuid;

select extensions.is((select app_role from public.profiles where id='10000000-0000-4000-8000-000000000001'), 'client', 'user metadata cannot assign the initial business role');

select extensions.is((select account_status from public.profiles where id='10000000-0000-4000-8000-000000000001'), 'pending', 'a new profile starts pending despite user metadata');

select extensions.ok((select relrowsecurity from pg_class where oid='public.profiles'::regclass), 'profile RLS is enabled');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true); end $$;

select extensions.is((select account_status from public.profiles where id='10000000-0000-4000-8000-000000000001'), 'pending', 'pending user can read own account state');

select extensions.is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000002'), 0, 'pending user cannot read another profile');

select extensions.throws_ok($sql$select full_name from public.profiles where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'pending API exposes only the allowed status fields');

select extensions.throws_ok($sql$select app_role from public.profiles where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'business role is not exposed by this initial status-only API');

select extensions.throws_ok($sql$update public.profiles set app_role='super_admin' where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'client cannot promote itself');

select extensions.throws_ok($sql$update public.profiles set account_status='active' where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'client cannot approve itself');

select extensions.throws_ok($sql$insert into public.profiles (id, full_name, phone, app_role) values ('10000000-0000-4000-8000-000000000006', 'Forged Admin', '+12025550106', 'super_admin')$sql$, '42501', null::text, 'client cannot create a privileged profile');

select extensions.throws_ok($sql$delete from public.profiles where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'client cannot delete its profile');

set local role anon;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated"}', true); end $$;

select extensions.throws_ok($sql$select id, account_status from public.profiles$sql$, '42501', null::text, 'signed-out requests cannot read profiles');

select extensions.throws_ok($sql$insert into public.profiles (id, full_name, phone) values ('10000000-0000-4000-8000-000000000006', 'Visitor', '+12025550106')$sql$, '42501', null::text, 'signed-out requests cannot insert profiles');

select extensions.throws_ok($sql$update public.profiles set account_status='active' where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'signed-out requests cannot update profiles');

select extensions.throws_ok($sql$delete from public.profiles where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'signed-out requests cannot delete profiles');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated"}', true); end $$;

select extensions.is((select count(*)::integer from public.profiles), 0, 'authenticated database role without a user identity sees nothing');

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","user_metadata":{"app_role":"super_admin","account_status":"active"}}', true); end $$;

select extensions.is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000002'), 0, 'forged role metadata grants no other-profile access');

select extensions.throws_ok($sql$update public.profiles set app_role='admin' where id='10000000-0000-4000-8000-000000000001'$sql$, '42501', null::text, 'forged role metadata cannot grant update permissions');

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","is_anonymous":true}', true); end $$;

select extensions.is((select count(*)::integer from public.profiles), 0, 'an anonymous Auth identity cannot read profile status');

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true); end $$;

select extensions.is((select account_status from public.profiles where id='10000000-0000-4000-8000-000000000002'), 'active', 'approved client can read own account state');

select extensions.is((select count(*)::integer from public.profiles where id='10000000-0000-4000-8000-000000000001'), 0, 'approved client cannot read another profile');

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}', true); end $$;

select extensions.is((select count(*)::integer from public.profiles), 1, 'staff only has own-status access in this foundation');

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}', true); end $$;

select extensions.is((select count(*)::integer from public.profiles), 1, 'organization admin only has own-status access in this foundation');

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated"}', true); end $$;

select extensions.is((select count(*)::integer from public.profiles), 1, 'super admin only has own-status access in this foundation');

select extensions.throws_ok($sql$update public.profiles set app_role='admin' where id='10000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'scoped administrative mutations are not granted by a client API');

reset role;

select extensions.is((select app_role from public.profiles where id='10000000-0000-4000-8000-000000000001'), 'client', 'failed escalations leave the stored role unchanged');

select extensions.is((select account_status from public.profiles where id='10000000-0000-4000-8000-000000000001'), 'pending', 'failed self-approval leaves the stored state unchanged');

select extensions.throws_ok($sql$insert into public.profiles (id, full_name, phone) values ('10000000-0000-4000-8000-000000000099', 'Missing Identity', '+12025550109')$sql$, '23503', null::text, 'profile requires an existing Auth identity');

select extensions.throws_ok($sql$update public.profiles set app_role='owner' where id='10000000-0000-4000-8000-000000000001'$sql$, '23514', null::text, 'undefined business roles are rejected');

select extensions.throws_ok($sql$update public.profiles set account_status='approved_by_me' where id='10000000-0000-4000-8000-000000000001'$sql$, '23514', null::text, 'undefined account states are rejected');

select extensions.throws_ok($sql$update public.profiles set full_name='   ' where id='10000000-0000-4000-8000-000000000001'$sql$, '23514', null::text, 'blank registration name is rejected');

select extensions.throws_ok($sql$update public.profiles set phone='   ' where id='10000000-0000-4000-8000-000000000001'$sql$, '23514', null::text, 'blank contact phone is rejected');

update public.profiles set account_status='rejected', updated_at='2000-01-01' where id='10000000-0000-4000-8000-000000000002';

select extensions.ok((select updated_at >= created_at from public.profiles where id='10000000-0000-4000-8000-000000000002'), 'controlled updates refresh the timestamp');

select * from extensions.finish();
rollback;
