-- Enabled Auth bridge: never suspended in this suite. All fictional data rolls back.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select extensions.plan(48);

insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000001','bridge-1@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}');

select extensions.is((select count(*)::integer from public.profiles where id='70000000-0000-4000-8000-000000000001'), 1, 'Auth INSERT creates exactly one profile');

select extensions.is((select full_name from public.profiles where id='70000000-0000-4000-8000-000000000001'), 'Test Ana', 'registration trims the submitted name');

select extensions.is((select phone from public.profiles where id='70000000-0000-4000-8000-000000000001'), '+12025550301', 'registration trims the contact phone');

select extensions.is((select app_role from public.profiles where id='70000000-0000-4000-8000-000000000001'), 'client', 'privileged metadata cannot change the client default');

select extensions.is((select account_status from public.profiles where id='70000000-0000-4000-8000-000000000001'), 'pending', 'privileged metadata cannot activate the initial profile');

select extensions.is((select count(*)::integer from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 1, 'Auth INSERT creates exactly one first request');

select extensions.is((select attempt_number from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 1, 'caller attempt metadata cannot skip the first attempt');

select extensions.is((select status from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 'pending', 'first request starts pending');

select extensions.is((select company_name_text from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 'Test Company A', 'company text is captured and trimmed');

select extensions.is((select message from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 'Please review this fictional request.', 'message is captured and trimmed');

select extensions.ok((select target_organization_id is null and reviewed_by is null and reviewed_at is null and rejection_reason is null from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 'caller routing/review metadata grants no organizational approval');

-- Invalid inputs reject the Auth INSERT rather than leaving incomplete identities.

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'missing full_name aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":123,"phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'non-text full_name aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'missing phone aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":123,"company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'non-text phone aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'missing company_name aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":123,"message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'non-text company_name aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'missing message aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":123,"app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'non-text message aborts signup');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"\t\n   ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'whitespace-only name is rejected');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'name length is bounded');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"11111111111111111111111111111111111111111","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'phone length is bounded');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'company length is bounded');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'message length is bounded');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','[]')$sql$, '22023', null::text, 'non-object signup metadata is rejected');

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data,is_anonymous) values ('70000000-0000-4000-8000-000000000099','bridge-99@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}',true)$sql$, '22023', null::text, 'anonymous Auth insertion cannot create a business profile');

select extensions.throws_ok($sql$insert into auth.users (id,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000099','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '22023', null::text, 'email-less identity is rejected');

select extensions.is((select count(*)::integer from auth.users where id='70000000-0000-4000-8000-000000000099'), 0, 'invalid signup leaves no Auth row');

select extensions.is((select count(*)::integer from public.profiles where id='70000000-0000-4000-8000-000000000099'), 0, 'invalid signup leaves no profile');

select extensions.is((select count(*)::integer from public.registration_requests where user_id='70000000-0000-4000-8000-000000000099'), 0, 'invalid signup leaves no request');

-- A downstream failure after profile insertion must also roll back the whole signup.

create function pg_temp.reject_registration_fixture() returns trigger language plpgsql as $$ begin raise exception using errcode='23514',message='Fictional request failure'; end $$;

create trigger test_reject_initial_request before insert on public.registration_requests for each row execute function pg_temp.reject_registration_fixture();

select extensions.throws_ok($sql$insert into auth.users (id,email,raw_user_meta_data) values ('70000000-0000-4000-8000-000000000098','bridge-98@securedesk.example.invalid','{"full_name":"  Test Ana  ","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}')$sql$, '23514', null::text, 'request insert failure aborts the whole Auth transaction');

drop trigger test_reject_initial_request on public.registration_requests;

select extensions.is((select count(*)::integer from auth.users where id='70000000-0000-4000-8000-000000000098'), 0, 'downstream failure leaves no Auth row');

select extensions.is((select count(*)::integer from public.profiles where id='70000000-0000-4000-8000-000000000098'), 0, 'downstream failure rolls back the profile already inserted');

select extensions.is((select count(*)::integer from public.registration_requests where user_id='70000000-0000-4000-8000-000000000098'), 0, 'downstream failure leaves no request');

-- GoTrue uses its limited Auth DB role, without granting direct business table writes.

select extensions.ok(not has_table_privilege('supabase_auth_admin','public.profiles','INSERT'), 'Auth DB role has no direct profile INSERT privilege');

-- Actual GoTrue DB role execution is verified by the local HTTP Auth smoke test.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"70000000-0000-4000-8000-000000000001"}',true); end $$;

select extensions.throws_ok($sql$select securedesk_private.handle_auth_registration()$sql$, '42501', null::text, 'authenticated caller cannot invoke the signup trigger function');

select extensions.throws_ok($sql$insert into auth.users (id,email) values ('70000000-0000-4000-8000-000000000097','forged@securedesk.example.invalid')$sql$, '42501', null::text, 'authenticated caller cannot directly insert Auth identities');

reset role;

-- Email confirmation and business approval are both needed even after bad privileged data.

insert into public.organizations (id,name,description,address,email,phone,status) values ('80000000-0000-4000-8000-000000000001','Bridge Test Company','Fictional','Example address','bridge-company@securedesk.example.invalid','+12025550300','active');

insert into public.organization_members (organization_id,user_id,approved_by) values ('80000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001');

update public.profiles set account_status='active' where id='70000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"70000000-0000-4000-8000-000000000001"}',true); end $$;

select extensions.ok((select securedesk_private.active_actor_role()) is null, 'unconfirmed email gets no active business role despite active profile');

select extensions.is((select count(*)::integer from public.organizations where id='80000000-0000-4000-8000-000000000001'), 0, 'unconfirmed email cannot read an assigned organization');

reset role;

update auth.users set email_confirmed_at=now() where id='70000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"70000000-0000-4000-8000-000000000001"}',true); end $$;

select extensions.is((select securedesk_private.active_actor_role()), 'client', 'confirmed email and approved stored profile yield the Client role');

select extensions.is((select count(*)::integer from public.organizations where id='80000000-0000-4000-8000-000000000001'), 1, 'confirmed approved Client reads its member organization');

reset role;

update public.profiles set account_status='pending' where id='70000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"70000000-0000-4000-8000-000000000001"}',true); end $$;

select extensions.is((select count(*)::integer from public.organizations where id='80000000-0000-4000-8000-000000000001'), 0, 'confirmed email alone still gives no private business access');

reset role;

update public.profiles set app_role='super_admin',account_status='active' where id='70000000-0000-4000-8000-000000000001';
update auth.users set email_confirmed_at=null where id='70000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"70000000-0000-4000-8000-000000000001"}',true); end $$;

select extensions.is((select count(*)::integer from public.organizations where id='80000000-0000-4000-8000-000000000001'), 0, 'unconfirmed Super Admin profile has no global organization access');

reset role;

update auth.users set email_confirmed_at=now() where id='70000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"70000000-0000-4000-8000-000000000001","is_anonymous":true}',true); end $$;

select extensions.is((select count(*)::integer from public.organizations where id='80000000-0000-4000-8000-000000000001'), 0, 'anonymous Auth context remains denied despite confirmed privileged fixture');

reset role;

update public.profiles set app_role='client',account_status='pending' where id='70000000-0000-4000-8000-000000000001';

update auth.users set raw_user_meta_data='{"full_name":"Changed Later","phone":"  +12025550301  ","company_name":"  Test Company A  ","message":"  Please review this fictional request.  ","app_role":"super_admin","account_status":"active","target_organization_id":"80000000-0000-4000-8000-000000000001","attempt_number":99}' where id='70000000-0000-4000-8000-000000000001';

select extensions.is((select app_role from public.profiles where id='70000000-0000-4000-8000-000000000001'), 'client', 'later metadata update cannot change the stored role');

select extensions.is((select account_status from public.profiles where id='70000000-0000-4000-8000-000000000001'), 'pending', 'later metadata update cannot activate the stored profile');

select extensions.is((select full_name from public.profiles where id='70000000-0000-4000-8000-000000000001'), 'Test Ana', 'later metadata update does not rewrite registration snapshot');

select extensions.is((select count(*)::integer from public.registration_requests where user_id='70000000-0000-4000-8000-000000000001'), 1, 'metadata/email updates do not duplicate the first request');

select * from extensions.finish();
rollback;
