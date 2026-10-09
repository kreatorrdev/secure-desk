-- Transactional local seed tests: retained demo data and history are restored by ROLLBACK.
-- Temporarily mask any retained Super Admin only inside this transaction so first-setup
-- success remains testable after initialization. Other sessions cannot see this change.
begin;
set local lock_timeout='5s';
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select extensions.no_plan();
\ir support/local-super-admin-bootstrap.inc
select pg_catalog.pg_advisory_xact_lock(734291,1);
update public.profiles set app_role='client' where app_role='super_admin';


insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000001','bootstrap-1@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 1","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000002','bootstrap-2@securedesk.example.invalid',null,'{"full_name":"Bootstrap Fixture 2","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000003','bootstrap-3@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 3","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000004','bootstrap-4@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 4","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000005','bootstrap-5@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 5","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000006','bootstrap-6@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 6","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000007','bootstrap-7@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 7","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000008','bootstrap-8@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 8","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000009','bootstrap-9@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 9","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000010','bootstrap-10@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 10","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000011','bootstrap-11@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 11","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000012','bootstrap-12@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 12","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000013','bootstrap-13@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 13","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('90000000-0000-4000-8000-000000000014','bootstrap-14@securedesk.example.invalid',now(),'{"full_name":"Bootstrap Fixture 14","phone":"+12025550701","company_name":"Fictional Bootstrap","message":"Preserve this submitted snapshot."}');

insert into public.organizations (id,name,description,address,email,phone,status) values ('90000000-0000-4000-8000-000000000090','Bootstrap Fixture Org','Fictional','Example address','bootstrap-org@securedesk.example.invalid','+12025550700','active');

create temporary table bootstrap_snapshot as select id,user_id,attempt_number,company_name_text,message,phone,created_at from public.registration_requests where user_id='90000000-0000-4000-8000-000000000001';

select extensions.ok((select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',false)->>'applied'='false'), 'preview validates eligibility without applying');

select extensions.ok((select app_role='client' and account_status='pending' from public.profiles where id='90000000-0000-4000-8000-000000000001'), 'preview leaves role and account state pending');

select extensions.ok((select status='pending' and reviewed_by is null from public.registration_requests where user_id='90000000-0000-4000-8000-000000000001'), 'preview leaves request unreviewed');

set local role anon;

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true)$check$, '42501', null::text, 'anon cannot execute the owner bootstrap');

reset role;

set local role authenticated;

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true)$check$, '42501', null::text, 'authenticated cannot execute the owner bootstrap');

reset role;

set local role service_role;

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true)$check$, '42501', null::text, 'service_role cannot execute the owner bootstrap');

reset role;

grant execute on function pg_temp.bootstrap_super_admin(text,boolean) to authenticated;
set local role authenticated;

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true)$check$, '42501', 'Bootstrap requires the local database owner', 'owner identity is checked even if EXECUTE was accidentally granted');

reset role;
revoke execute on function pg_temp.bootstrap_super_admin(text,boolean) from authenticated;

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin(null,true)$check$, '22023', null::text, 'missing email rejected');

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('missing@securedesk.example.invalid',true)$check$, '22023', null::text, 'unknown identity rejected');

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',null)$check$, '22023', null::text, 'unknown mode rejected');

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-2@securedesk.example.invalid',true)$check$, '22023', null::text, 'unconfirmed email rejected');

update auth.users set is_anonymous=true where id='90000000-0000-4000-8000-000000000003';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-3@securedesk.example.invalid',true)$check$, '22023', null::text, 'actual anonymous identity rejected');

update public.profiles set account_status='active' where id='90000000-0000-4000-8000-000000000004';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-4@securedesk.example.invalid',true)$check$, '22023', null::text, 'already active Client cannot use first setup');

update public.profiles set account_status='rejected' where id='90000000-0000-4000-8000-000000000005';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-5@securedesk.example.invalid',true)$check$, '22023', null::text, 'rejected profile rejected');

update public.profiles set app_role='staff' where id='90000000-0000-4000-8000-000000000006';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-6@securedesk.example.invalid',true)$check$, '22023', null::text, 'Staff profile rejected');

insert into public.registration_requests (user_id,attempt_number,company_name_text,message,phone,status,reviewed_by,reviewed_at,rejection_reason) values ('90000000-0000-4000-8000-000000000007',2,'Fictional','Second request','+12025550701','rejected','90000000-0000-4000-8000-000000000001',now(),'Fixture reason');

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-7@securedesk.example.invalid',true)$check$, '22023', null::text, 'request history with multiple attempts rejected');

update public.registration_requests set target_organization_id='90000000-0000-4000-8000-000000000090' where user_id='90000000-0000-4000-8000-000000000008';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-8@securedesk.example.invalid',true)$check$, '22023', null::text, 'routed request rejected');

update public.registration_requests set status='approved',reviewed_by='90000000-0000-4000-8000-000000000001',reviewed_at=now() where user_id='90000000-0000-4000-8000-000000000009';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-9@securedesk.example.invalid',true)$check$, '22023', null::text, 'already reviewed request rejected');

insert into public.organization_members (organization_id,user_id,approved_by,status,ended_at) values ('90000000-0000-4000-8000-000000000090','90000000-0000-4000-8000-000000000010','90000000-0000-4000-8000-000000000001','ended',now());

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-10@securedesk.example.invalid',true)$check$, '22023', null::text, 'ended membership history still blocks setup');

insert into public.staff_organization_assignments (organization_id,staff_user_id,assigned_by,active) values ('90000000-0000-4000-8000-000000000090','90000000-0000-4000-8000-000000000011','90000000-0000-4000-8000-000000000001',false);

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-11@securedesk.example.invalid',true)$check$, '22023', null::text, 'inactive Staff assignment blocks setup');

insert into public.organization_admin_assignments (organization_id,admin_user_id,assigned_by,active) values ('90000000-0000-4000-8000-000000000090','90000000-0000-4000-8000-000000000012','90000000-0000-4000-8000-000000000001',false);

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-12@securedesk.example.invalid',true)$check$, '22023', null::text, 'inactive Admin assignment blocks setup');

update auth.users set banned_until=now()+interval '1 day' where id='90000000-0000-4000-8000-000000000013';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-13@securedesk.example.invalid',true)$check$, '22023', null::text, 'banned account rejected');

update auth.users set deleted_at=now() where id='90000000-0000-4000-8000-000000000014';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-14@securedesk.example.invalid',true)$check$, '22023', null::text, 'deleted identity rejected');

select extensions.ok((select count(*)=0 from public.profiles where id::text like '90000000-%' and app_role='super_admin'), 'invalid setup attempts created no Super Admin');

select extensions.ok((select app_role='client' and account_status='pending' from public.profiles where id='90000000-0000-4000-8000-000000000001'), 'unauthorized attempts preserved the chosen target');

create function pg_temp.reject_bootstrap_review() returns trigger language plpgsql as $$
begin raise exception using errcode='P0001',message='Injected test review failure'; end;
$$;
create trigger bootstrap_test_review_failure before update on public.registration_requests
  for each row execute function pg_temp.reject_bootstrap_review();

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true)$check$, 'P0001', 'Injected test review failure', 'failure of request approval rolls back profile promotion');

select extensions.ok((select app_role='client' and account_status='pending' from public.profiles where id='90000000-0000-4000-8000-000000000001'), 'failed approval leaves no partial privileged profile');

select extensions.ok((select status='pending' and reviewed_by is null from public.registration_requests where user_id='90000000-0000-4000-8000-000000000001'), 'failed approval leaves no partial review');

drop trigger bootstrap_test_review_failure on public.registration_requests;

create temporary table bootstrap_result as select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true) as summary;

select extensions.ok((select summary->>'role'='super_admin' and summary->>'state'='active' and summary->>'applied'='true' from bootstrap_result), 'eligible owner setup succeeds');

select extensions.ok((select app_role='super_admin' and account_status='active' from public.profiles where id='90000000-0000-4000-8000-000000000001'), 'setup stores the active Super Admin role');

select extensions.ok((select status='approved' and reviewed_by='90000000-0000-4000-8000-000000000001' and reviewed_at is not null and rejection_reason is null from public.registration_requests where user_id='90000000-0000-4000-8000-000000000001'), 'setup closes the first request with review metadata');

select extensions.ok((select count(*)=1 from public.registration_requests where user_id='90000000-0000-4000-8000-000000000001'), 'setup retains exactly one request');

select extensions.ok((select not exists (select * from bootstrap_snapshot except select id,user_id,attempt_number,company_name_text,message,phone,created_at from public.registration_requests where user_id='90000000-0000-4000-8000-000000000001')), 'submitted registration snapshot stays unchanged');

select extensions.ok((select email_confirmed_at is not null and encrypted_password is null from auth.users where id='90000000-0000-4000-8000-000000000001'), 'setup does not create a password or alter Auth confirmation');

select extensions.ok((select not exists(select 1 from public.organization_members where user_id='90000000-0000-4000-8000-000000000001') and not exists(select 1 from public.staff_organization_assignments where staff_user_id='90000000-0000-4000-8000-000000000001') and not exists(select 1 from public.organization_admin_assignments where admin_user_id='90000000-0000-4000-8000-000000000001')), 'global Super Admin needs no tenant membership or assignment');

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-1@securedesk.example.invalid',true)$check$, '22023', null::text, 'same account cannot bootstrap twice');

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-2@securedesk.example.invalid',true)$check$, '22023', null::text, 'existing Super Admin closes first setup for other identities');

update public.profiles set account_status='pending' where id='90000000-0000-4000-8000-000000000001';

select extensions.throws_ok($check$select pg_temp.bootstrap_super_admin('bootstrap-2@securedesk.example.invalid',true)$check$, '22023', null::text, 'inactive Super Admin also keeps first setup closed');

update public.profiles set account_status='active' where id='90000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"90000000-0000-4000-8000-000000000001","is_anonymous":false}',true);

select extensions.ok((select securedesk_private.active_actor_role()='super_admin'), 'existing RLS helpers recognize confirmed active Super Admin');

select extensions.ok((select count(*)=1 from public.organizations where id='90000000-0000-4000-8000-000000000090'), 'Super Admin reads unassigned organization through RLS');

select extensions.ok((select count(*)=14 from public.registration_requests where user_id::text like '90000000-%' and attempt_number=1), 'Super Admin reads global pending and reviewed first requests');

select extensions.throws_ok($check$update public.profiles set app_role='super_admin' where id='90000000-0000-4000-8000-000000000002'$check$, '42501', null::text, 'Super Admin API session still has no direct role UPDATE');

select extensions.throws_ok($check$update public.registration_requests set status='approved' where user_id='90000000-0000-4000-8000-000000000002'$check$, '42501', null::text, 'Super Admin API session still has no direct review UPDATE');

reset role;

select extensions.throws_ok($check$update public.registration_requests set status='pending',reviewed_by=null,reviewed_at=null where user_id='90000000-0000-4000-8000-000000000001'$check$, '23514', null::text, 'bootstrap review cannot be reopened by rewriting history');

select extensions.finish();
rollback;
