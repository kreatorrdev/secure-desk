-- SQL identity/role tests, not a browser login test. All fixtures/decisions roll back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select extensions.no_plan();

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000001','review-1@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 1","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000002','review-2@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 2","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000003','review-3@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 3","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000004','review-4@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 4","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000005','review-5@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 5","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000006','review-6@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 6","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000007','review-7@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 7","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000008','review-8@securedesk.example.invalid',null,'{"full_name":"Review Fixture 8","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000009','review-9@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 9","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000010','review-10@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 10","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000011','review-11@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 11","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000012','review-12@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 12","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000013','review-13@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 13","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000014','review-14@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 14","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000015','review-15@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 15","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000016','review-16@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 16","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000017','review-17@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 17","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000018','review-18@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 18","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000019','review-19@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 19","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000020','review-20@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 20","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000021','review-21@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 21","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000022','review-22@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 22","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000023','review-23@securedesk.example.invalid',null,'{"full_name":"Review Fixture 23","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000024','review-24@securedesk.example.invalid',null,'{"full_name":"Review Fixture 24","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000025','review-25@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 25","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000026','review-26@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 26","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000027','review-27@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 27","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000028','review-28@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 28","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000029','review-29@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 29","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000030','review-30@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 30","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values ('a1000000-0000-4000-8000-000000000031','review-31@securedesk.example.invalid',now(),'{"full_name":"Review Fixture 31","phone":"+12025550801","company_name":"Fictional Review Company","message":"Submitted snapshot to preserve."}');

update public.profiles set app_role='super_admin',account_status='active' where id='a1000000-0000-4000-8000-000000000001';

update public.profiles set app_role='admin',account_status='active' where id='a1000000-0000-4000-8000-000000000002';

update public.profiles set app_role='admin',account_status='active' where id='a1000000-0000-4000-8000-000000000003';

update public.profiles set app_role='staff',account_status='active' where id='a1000000-0000-4000-8000-000000000004';

update public.profiles set app_role='client',account_status='active' where id='a1000000-0000-4000-8000-000000000005';

update public.profiles set app_role='staff',account_status='pending' where id='a1000000-0000-4000-8000-000000000009';

update public.profiles set app_role='admin',account_status='active' where id='a1000000-0000-4000-8000-000000000019';

update public.profiles set app_role='admin',account_status='active' where id='a1000000-0000-4000-8000-000000000020';

update public.profiles set app_role='admin',account_status='active' where id='a1000000-0000-4000-8000-000000000021';

update public.profiles set app_role='admin',account_status='pending' where id='a1000000-0000-4000-8000-000000000022';

update public.profiles set app_role='admin',account_status='active' where id='a1000000-0000-4000-8000-000000000023';

update public.profiles set app_role='client',account_status='rejected' where id='a1000000-0000-4000-8000-000000000024';

update public.profiles set app_role='client',account_status='active' where id='a1000000-0000-4000-8000-000000000025';

update public.profiles set app_role='client',account_status='active' where id='a1000000-0000-4000-8000-000000000026';

update public.profiles set app_role='staff',account_status='rejected' where id='a1000000-0000-4000-8000-000000000030';

update public.profiles set app_role='client',account_status='rejected' where id='a1000000-0000-4000-8000-000000000031';

update auth.users set banned_until=now()+interval '1 day' where id in ('a1000000-0000-4000-8000-000000000019','a1000000-0000-4000-8000-000000000028');
update auth.users set deleted_at=now() where id in ('a1000000-0000-4000-8000-000000000020','a1000000-0000-4000-8000-000000000029');
update auth.users set is_anonymous=true where id in ('a1000000-0000-4000-8000-000000000021','a1000000-0000-4000-8000-000000000027');

insert into public.organizations (id,name,description,address,email,phone,status) values ('a2000000-0000-4000-8000-000000000001','Review Org 1','Fictional','Example address','review-org-1@securedesk.example.invalid','+12025550800','active');

insert into public.organizations (id,name,description,address,email,phone,status) values ('a2000000-0000-4000-8000-000000000002','Review Org 2','Fictional','Example address','review-org-2@securedesk.example.invalid','+12025550800','active');

insert into public.organizations (id,name,description,address,email,phone,status) values ('a2000000-0000-4000-8000-000000000003','Review Org 3','Fictional','Example address','review-org-3@securedesk.example.invalid','+12025550800','pending');

insert into public.organizations (id,name,description,address,email,phone,status) values ('a2000000-0000-4000-8000-000000000004','Review Org 4','Fictional','Example address','review-org-4@securedesk.example.invalid','+12025550800','inactive');

insert into public.organization_admin_assignments (organization_id,admin_user_id,assigned_by) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001');

insert into public.organization_admin_assignments (organization_id,admin_user_id,assigned_by) values ('a2000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001');

insert into public.organization_admin_assignments (organization_id,admin_user_id,assigned_by) values ('a2000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001');

insert into public.staff_organization_assignments (organization_id,staff_user_id,assigned_by) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000001');
insert into public.organization_members (organization_id,user_id,approved_by) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000001'),('a2000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000025','a1000000-0000-4000-8000-000000000001');

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000007';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000008';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000003' where user_id='a1000000-0000-4000-8000-000000000010';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000002' where user_id='a1000000-0000-4000-8000-000000000011';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000004' where user_id='a1000000-0000-4000-8000-000000000012';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000013';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000015';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000016';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000017';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000026';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000027';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000028';

update public.registration_requests set target_organization_id='a2000000-0000-4000-8000-000000000001' where user_id='a1000000-0000-4000-8000-000000000029';

insert into public.organization_members (organization_id,user_id,approved_by,status,ended_at) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000015','a1000000-0000-4000-8000-000000000001','ended',now());
insert into public.staff_organization_assignments (organization_id,staff_user_id,assigned_by,active) values ('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000016','a1000000-0000-4000-8000-000000000001',false);

insert into public.projects (organization_id,name,description,is_general_support,created_by_user_id,status) values ('a2000000-0000-4000-8000-000000000001','General Support','Default',true,'a1000000-0000-4000-8000-000000000001','active'),('a2000000-0000-4000-8000-000000000001','Inactive fixture project','Fixture',false,'a1000000-0000-4000-8000-000000000001','inactive');

insert into public.audit_logs (id,organization_id,actor_user_id,event_type,target_type,target_id,outcome) values ('a3000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','fixture.event','fixture','a1000000-0000-4000-8000-000000000001','success');

insert into public.audit_logs (id,organization_id,actor_user_id,event_type,target_type,target_id,outcome) values ('a3000000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001','fixture.event','fixture','a1000000-0000-4000-8000-000000000001','success');

insert into public.audit_logs (id,organization_id,actor_user_id,event_type,target_type,target_id,outcome) values ('a3000000-0000-4000-8000-000000000003',null,'a1000000-0000-4000-8000-000000000001','fixture.event','fixture','a1000000-0000-4000-8000-000000000001','success');

create temporary table review_requests as select id,user_id from public.registration_requests where user_id::text like 'a1000000-%';
grant select on pg_temp.review_requests to anon,authenticated,service_role;
create temporary table review_snapshot as select id,user_id,attempt_number,company_name_text,message,phone,created_at from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000006';

reset role;
set local role anon;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'anon denied review list RPC');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'anon denied route RPC');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'anon denied reject RPC');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'anon denied approve RPC');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'anon denied new organization RPC');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'anon denied retry RPC');

select extensions.throws_ok($check$select id from public.projects$check$,'42501',null::text,'anon denied projects read');

select extensions.throws_ok($check$select id from public.audit_logs$check$,'42501',null::text,'anon denied audit_logs read');

reset role;
set local role service_role;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'service_role denied review list RPC');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'service_role denied route RPC');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'service_role denied reject RPC');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'service_role denied approve RPC');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'service_role denied new organization RPC');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'service_role denied retry RPC');

select extensions.throws_ok($check$select id from public.projects$check$,'42501',null::text,'service_role denied projects read');

select extensions.throws_ok($check$select id from public.audit_logs$check$,'42501',null::text,'service_role denied audit_logs read');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000004","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'non-active-admin 4 denied review list');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 4 denied route');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'non-active-admin 4 denied reject');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 4 denied approve');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'non-active-admin 4 denied new organization');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'non-rejected-client 4 denied retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000005","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'non-active-admin 5 denied review list');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 5 denied route');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'non-active-admin 5 denied reject');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 5 denied approve');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'non-active-admin 5 denied new organization');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'non-rejected-client 5 denied retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000006","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'non-active-admin 6 denied review list');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 6 denied route');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'non-active-admin 6 denied reject');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 6 denied approve');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'non-active-admin 6 denied new organization');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'non-rejected-client 6 denied retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000009","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'non-active-admin 9 denied review list');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 9 denied route');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'non-active-admin 9 denied reject');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 9 denied approve');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'non-active-admin 9 denied new organization');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'non-rejected-client 9 denied retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000022","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'non-active-admin 22 denied review list');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 22 denied route');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'non-active-admin 22 denied reject');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'non-active-admin 22 denied approve');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'non-active-admin 22 denied new organization');

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'non-rejected-client 22 denied retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000019","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'ineligible identity 19 cannot review');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'ineligible identity 19 cannot reject');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000020","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'ineligible identity 20 cannot review');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'ineligible identity 20 cannot reject');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000021","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'ineligible identity 21 cannot review');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'ineligible identity 21 cannot reject');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000023","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'ineligible identity 23 cannot review');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'Fixture reason')$check$,'42501',null::text,'ineligible identity 23 cannot reject');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":true}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests()$check$,'42501',null::text,'anonymous JWT cannot use an active admin profile');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000024","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'unconfirmed rejected Client cannot retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000030","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'rejected Staff cannot retry through Client registration');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000031","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'rejected profile with pending latest request cannot retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select * from public.admin_registration_requests(101,0)$check$,'22023',null::text,'review page size is bounded');

select extensions.throws_ok($check$select * from public.admin_registration_requests(1,-1)$check$,'22023',null::text,'negative review offset rejected');

-- Retained local history can exceed one page. Keep the production page limit,
-- traverse all authorized pages, and match the exact fixtures by request ID.
select extensions.ok((
  select count(*)=31
  from generate_series(0,(select count(*)/100 from public.registration_requests)::integer) as page(number)
  cross join lateral public.admin_registration_requests(100,page.number*100) as request
  join pg_temp.review_requests as fixture on fixture.id=request.id
),'Super Admin sees routed and global fixture history');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.ok((select exists(select 1 from public.admin_registration_requests(100,0) where user_id='a1000000-0000-4000-8000-000000000007')),'Org Admin sees own active-org request details');

select extensions.ok((select exists(select 1 from public.admin_registration_requests(100,0) where user_id='a1000000-0000-4000-8000-000000000010')),'explicit Org Admin assignment includes pending-org review');

select extensions.ok((select not exists(select 1 from public.admin_registration_requests(100,0) where user_id in ('a1000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000000011','a1000000-0000-4000-8000-000000000012'))),'Org Admin cannot enumerate unrouted other-org or inactive-org requests');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000011'),'Reason')$check$,'42501',null::text,'Org Admin cannot reject another tenant');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000011'),'a2000000-0000-4000-8000-000000000002')$check$,'42501',null::text,'Org Admin cannot approve another tenant');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000002')$check$,'42501',null::text,'organization parameter cannot override trusted routing');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'Org Admin cannot claim an unrouted request');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'42501',null::text,'Org Admin cannot create an unassigned new organization');

select extensions.throws_ok($check$select securedesk_private.activate_registration_client((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'private activation helper is not an app RPC');

select extensions.throws_ok($check$select public.reject_registration_request('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Reason')$check$,'42501',null::text,'unknown request has generic unavailability');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'   ')$check$,'22023',null::text,'rejection requires a reason');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),repeat('x',2001))$check$,'22023',null::text,'rejection reason has bounded length');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000008'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'approval requires confirmed Client email');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000015'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'approval cannot replace membership history');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000016'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'approval cannot replace Staff assignment history');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000026'),'a2000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'already active Client cannot be approved again');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000027'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'approval rejects ineligible Client 27');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000028'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'approval rejects ineligible Client 28');

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000029'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'approval rejects ineligible Client 29');

reset role;

update public.projects set status='inactive' where organization_id='a2000000-0000-4000-8000-000000000001' and is_general_support;

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000017'),'a2000000-0000-4000-8000-000000000001')$check$,'22023',null::text,'inactive default project blocks partial approval');

reset role;

update public.projects set status='active' where organization_id='a2000000-0000-4000-8000-000000000001' and is_general_support;

create function pg_temp.fail_review_audit() returns trigger language plpgsql as $$ begin raise exception using errcode='P0001',message='Injected audit failure'; end $$;
create trigger review_test_audit_failure before insert on public.audit_logs for each row execute function pg_temp.fail_review_audit();

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000013'),'a2000000-0000-4000-8000-000000000001')$check$,'P0001',null::text,'failed audit rolls back existing-org approval');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000013'),'Reason')$check$,'P0001',null::text,'failed audit rolls back rejection');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000014'),'{"name":"Fictional New Review Org","address":"Example address","email":"new-review@securedesk.example.invalid","phone":"+12025550800","description":"Fictional company checked by administrator."}')$check$,'P0001',null::text,'failed audit rolls back new org project member and profile');

reset role;

select extensions.ok((select app_role='client' and account_status='pending' from public.profiles where id='a1000000-0000-4000-8000-000000000013'),'failed existing-org decision preserves pending Client');

select extensions.ok((select status='pending' and reviewed_by is null from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000013'),'failed decision preserves pending request');

select extensions.ok((select count(*)=0 from public.organization_members where user_id in ('a1000000-0000-4000-8000-000000000013','a1000000-0000-4000-8000-000000000014')),'failed approvals leave no memberships');

select extensions.ok((select count(*)=4 from public.organizations where id::text like 'a2000000-%' or name='Fictional New Review Org'),'failed new approval leaves no new organization');

select extensions.ok((select count(*)=2 from public.projects where organization_id::text like 'a2000000-%'),'failed new approval leaves no new project');

drop trigger review_test_audit_failure on public.audit_logs;

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{}')$check$,'22023',null::text,'new organization rejects missing required fields');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{"name":"Fictional New Review Org","address":"Example address","email":"new-review@securedesk.example.invalid","phone":"+12025550800","description":"Fictional company checked by administrator.","app_role":"super_admin"}')$check$,'22023',null::text,'new organization rejects mass assignment role');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{"name":"Fictional New Review Org","address":"Example address","email":"new-review@securedesk.example.invalid","phone":"+12025550800","description":"Fictional company checked by administrator.","status":"active"}')$check$,'22023',null::text,'new organization rejects mass assignment status');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{"name":"Fictional New Review Org","address":"Example address","email":"invalid","phone":"+12025550800","description":"Fictional company checked by administrator."}')$check$,'22023',null::text,'new organization rejects invalid organization email');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'[]')$check$,'22023',null::text,'new organization rejects array details');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'null')$check$,'22023',null::text,'new organization rejects null details');

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'{"name":"Fictional New Review Org","address":"Example address","email":"new-review@securedesk.example.invalid","phone":"+12025550800","description":"Fictional company checked by administrator."}')$check$,'22023',null::text,'new-org approval cannot overwrite routed request');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'a2000000-0000-4000-8000-000000000004')$check$,'22023',null::text,'routing rejects inactive organization');

select extensions.lives_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000018'),'a2000000-0000-4000-8000-000000000002')$check$,'Super Admin routes an unrouted request to verified existing org');

reset role;

select extensions.ok((select count(*)=0 from public.organization_members where user_id='a1000000-0000-4000-8000-000000000018'),'routing alone grants no membership');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000018'),'a2000000-0000-4000-8000-000000000002')$check$,'repeated identical routing is harmless');

reset role;

select extensions.ok((select count(*)=1 from public.audit_logs where target_id=(select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000018') and event_type='registration.routed'),'repeated routing creates no duplicate audit');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000003","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000018'),'a2000000-0000-4000-8000-000000000002')$check$,'assigned Org Admin approves routed confirmed Client');

reset role;

select extensions.ok((select count(*)=1 from public.projects where organization_id='a2000000-0000-4000-8000-000000000002' and is_general_support and status='active'),'existing active org acquires one default project');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.approve_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000010'),'a2000000-0000-4000-8000-000000000003')$check$,'explicit pending-org Admin activates organization and first Client');

reset role;

select extensions.ok((select status='active' from public.organizations where id='a2000000-0000-4000-8000-000000000003'),'pending organization activated with its first membership');

select extensions.ok((select count(*)=1 from public.projects where organization_id='a2000000-0000-4000-8000-000000000003' and is_general_support),'pending activation creates exactly one default project');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

create temporary table new_review_org as select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{"name":"Fictional New Review Org","address":"Example address","email":"new-review@securedesk.example.invalid","phone":"+12025550800","description":"Fictional company checked by administrator."}') as id;
grant select on pg_temp.new_review_org to authenticated;

reset role;

select extensions.ok((select status='active' from public.organizations where id=(select id from pg_temp.new_review_org)),'new organization approval creates active organization');

select extensions.ok((select app_role='client' and account_status='active' from public.profiles where id='a1000000-0000-4000-8000-000000000006'),'approval activates Client without assigning a privileged role');

select extensions.ok((select count(*)=1 from public.organization_members where user_id='a1000000-0000-4000-8000-000000000006' and organization_id=(select id from pg_temp.new_review_org) and status='active' and approved_by='a1000000-0000-4000-8000-000000000001'),'new organization and first membership have verified reviewer');

select extensions.ok((select status='approved' and reviewed_by='a1000000-0000-4000-8000-000000000001' and reviewed_at is not null and rejection_reason is null from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000006'),'approved request retains complete decision metadata');

select extensions.ok((select not exists(select * from pg_temp.review_snapshot except select id,user_id,attempt_number,company_name_text,message,phone,created_at from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000006')),'approval preserves submitted snapshot');

select extensions.ok((select count(*)=1 from public.projects where organization_id=(select id from pg_temp.new_review_org) and is_general_support and status='active'),'new organization has exactly one active General Support');

select extensions.ok((select count(*)=1 from public.audit_logs where target_id=(select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006') and actor_user_id='a1000000-0000-4000-8000-000000000001' and event_type='registration.approved' and organization_id=(select id from pg_temp.new_review_org)),'decision audit stores actual actor and tenant');

select extensions.ok((select metadata_redacted=jsonb_build_object('attempt_number',1) from public.audit_logs where target_id=(select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006') and event_type='registration.approved'),'audit omits email phone message password and rejection contents');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.approve_registration_new_organization((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000006'),'{"name":"Fictional New Review Org","address":"Example address","email":"new-review@securedesk.example.invalid","phone":"+12025550800","description":"Fictional company checked by administrator."}')$check$,'42501',null::text,'repeat approval cannot create another organization');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'  Please clarify company details.  ')$check$,'assigned Admin rejects with a trimmed explanation');

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'Another decision')$check$,'42501',null::text,'completed decision cannot be overwritten');

select extensions.throws_ok($check$select public.route_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007'),'a2000000-0000-4000-8000-000000000002')$check$,'42501',null::text,'reviewed request cannot be rerouted');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000007","is_anonymous":false}',true); end $$;

select extensions.ok((select account_status='rejected' from public.profiles where id='a1000000-0000-4000-8000-000000000007'),'rejected Client sees own state');

select extensions.ok((select rejection_reason='Please clarify company details.' from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007'),'rejected Client sees preserved reason');

select extensions.throws_ok($check$select public.resubmit_registration('','+12025550801','Retry')$check$,'22023',null::text,'retry rejects empty company');

select extensions.throws_ok($check$select public.resubmit_registration('Company','','Retry')$check$,'22023',null::text,'retry rejects empty phone');

select extensions.throws_ok($check$select public.resubmit_registration('Company','+12025550801','')$check$,'22023',null::text,'retry rejects empty message');

select extensions.throws_ok($check$select public.resubmit_registration('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx','+12025550801','Retry')$check$,'22023',null::text,'retry rejects long company');

select extensions.throws_ok($check$select public.resubmit_registration('Company','xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx','Retry')$check$,'22023',null::text,'retry rejects long phone');

select extensions.throws_ok($check$select public.resubmit_registration('Company','+12025550801','xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')$check$,'22023',null::text,'retry rejects long message');

reset role;

create trigger review_test_audit_failure before insert on public.audit_logs for each row execute function pg_temp.fail_review_audit();

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000007","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.resubmit_registration('Retry Company','+12025550802','New information')$check$,'P0001',null::text,'failed audit rolls back retry status and insertion');

reset role;

select extensions.ok((select account_status='rejected' from public.profiles where id='a1000000-0000-4000-8000-000000000007'),'failed retry preserves rejected profile');

select extensions.ok((select count(*)=1 from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007'),'failed retry creates no new attempt');

drop trigger review_test_audit_failure on public.audit_logs;

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000007","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.resubmit_registration('  Retry Company  ','  +12025550802  ','  New information  ')$check$,'rejected confirmed Client resubmits on same Auth identity');

select extensions.throws_ok($check$select public.resubmit_registration('Duplicate','+12025550802','Duplicate')$check$,'42501',null::text,'repeated retry has only one pending result');

reset role;

select extensions.ok((select account_status='pending' and app_role='client' and phone='+12025550802' from public.profiles where id='a1000000-0000-4000-8000-000000000007'),'retry resets only own Client state and current phone');

select extensions.ok((select count(*)=2 from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007'),'retry keeps old request and creates next attempt');

select extensions.ok((select status='rejected' and reviewed_by='a1000000-0000-4000-8000-000000000002' and rejection_reason='Please clarify company details.' from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007' and attempt_number=1),'retry preserves original rejection and reviewer');

select extensions.ok((select status='pending' and attempt_number=2 and target_organization_id is null and reviewed_by is null and company_name_text='Retry Company' and message='New information' and phone='+12025550802' from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007' and attempt_number=2),'new attempt has clean routing and review state with new snapshot');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.ok((select not exists(select 1 from public.admin_registration_requests(100,0) where user_id='a1000000-0000-4000-8000-000000000007' and attempt_number=2)),'Org Admin cannot automatically inherit routing of retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.route_registration_request((select id from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007' and attempt_number=2),'a2000000-0000-4000-8000-000000000001')$check$,'Super Admin explicitly routes new attempt');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.lives_ok($check$select public.approve_registration_request((select id from public.registration_requests where user_id='a1000000-0000-4000-8000-000000000007' and attempt_number=2),'a2000000-0000-4000-8000-000000000001')$check$,'assigned Admin approves retry as a Client membership');

reset role;

select extensions.ok((select count(*)=1 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001' and is_general_support),'additional approved Client does not duplicate default project');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000007","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.resubmit_registration('Fixture','+12025550801','Fixture retry')$check$,'42501',null::text,'approved Client cannot use retry as a transfer');

select extensions.ok((select count(*)=1 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'approved Client sees active projects only in own organization');

select extensions.ok((select count(*)=0 from public.projects where organization_id='a2000000-0000-4000-8000-000000000002'),'approved Client cannot read other tenant projects');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000004","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=1 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'project access follows actual role membership and status 4');

select extensions.ok((select count(*)=0 from public.audit_logs),'Client Staff and pending identity 4 cannot read raw audit');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000005","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=1 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'project access follows actual role membership and status 5');

select extensions.ok((select count(*)=0 from public.audit_logs),'Client Staff and pending identity 5 cannot read raw audit');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000006","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=1 from public.projects where organization_id=(select id from pg_temp.new_review_org)),'project access follows actual role membership and status 6');

select extensions.ok((select count(*)=0 from public.audit_logs),'Client Staff and pending identity 6 cannot read raw audit');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000011","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=0 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'project access follows actual role membership and status 11');

select extensions.ok((select count(*)=0 from public.audit_logs),'Client Staff and pending identity 11 cannot read raw audit');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=2 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'Org Admin reads active and inactive projects in own active org');

select extensions.ok((select count(*)=0 from public.audit_logs where organization_id='a2000000-0000-4000-8000-000000000002' or organization_id is null),'Org Admin cannot read other tenant or global audit');

select extensions.ok((select exists(select 1 from public.audit_logs where organization_id='a2000000-0000-4000-8000-000000000001')),'Org Admin reads scoped decision audit');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=2 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'Super Admin global project read includes inactive project');

select extensions.ok((select exists(select 1 from public.audit_logs where organization_id is null)),'Super Admin reads global audit');

select extensions.throws_ok($check$update public.projects set id=id$check$,'42501',null::text,'even Super Admin session denied direct projects UPDATE');

select extensions.throws_ok($check$delete from public.projects$check$,'42501',null::text,'even Super Admin session denied direct projects DELETE');

select extensions.throws_ok($check$update public.audit_logs set id=id$check$,'42501',null::text,'even Super Admin session denied direct audit_logs UPDATE');

select extensions.throws_ok($check$delete from public.audit_logs$check$,'42501',null::text,'even Super Admin session denied direct audit_logs DELETE');

select extensions.throws_ok($check$insert into public.projects(organization_id,name,description,created_by_user_id) values ('a2000000-0000-4000-8000-000000000001','Unauthorized','Fixture','a1000000-0000-4000-8000-000000000001')$check$,'42501',null::text,'Super Admin uses controlled workflows instead of direct project INSERT');

select extensions.throws_ok($check$insert into public.audit_logs(actor_user_id,event_type,target_type,target_id,outcome) values ('a1000000-0000-4000-8000-000000000001','Forged','fixture','a1000000-0000-4000-8000-000000000001','success')$check$,'42501',null::text,'app cannot forge a decision audit');

select extensions.throws_ok($check$update public.profiles set app_role='super_admin' where id='a1000000-0000-4000-8000-000000000007'$check$,'42501',null::text,'Client approval flow never opens role UPDATE');

reset role;

select extensions.throws_ok($check$update public.audit_logs set outcome='failure' where id='a3000000-0000-4000-8000-000000000001'$check$,'23514',null::text,'audit remains append-only even for direct owner update');

select extensions.throws_ok($check$delete from public.audit_logs where id='a3000000-0000-4000-8000-000000000001'$check$,'23514',null::text,'audit history cannot be silently deleted');

select extensions.throws_ok($check$insert into public.projects(organization_id,name,description,is_general_support,created_by_user_id) values ('a2000000-0000-4000-8000-000000000001','General Support','Duplicate',true,'a1000000-0000-4000-8000-000000000001')$check$,'23505',null::text,'default project unique constraint rejects duplicates');

select extensions.throws_ok($check$update public.registration_requests set status='pending',reviewed_by=null,reviewed_at=null,rejection_reason=null where id=(select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000007')$check$,'23514',null::text,'reviewed request remains immutable after retry');

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

reset role;

update public.organization_admin_assignments set active=false where organization_id='a2000000-0000-4000-8000-000000000001' and admin_user_id='a1000000-0000-4000-8000-000000000002';

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000002","is_anonymous":false}',true); end $$;

select extensions.throws_ok($check$select public.reject_registration_request((select id from pg_temp.review_requests where user_id='a1000000-0000-4000-8000-000000000017'),'Reason')$check$,'42501',null::text,'revoked Admin assignment immediately removes review authority');

select extensions.ok((select not exists(select 1 from public.admin_registration_requests(100,0) where user_id='a1000000-0000-4000-8000-000000000017')),'revoked assignment removes review list contents');

reset role;

update auth.users set banned_until=now()+interval '1 day' where id='a1000000-0000-4000-8000-000000000001';

reset role;
set local role authenticated;
do $$ begin perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a1000000-0000-4000-8000-000000000001","is_anonymous":false}',true); end $$;

select extensions.ok((select count(*)=0 from public.projects where organization_id='a2000000-0000-4000-8000-000000000001'),'banned administrator loses existing project RLS access immediately');

reset role;
select extensions.finish();
rollback;
