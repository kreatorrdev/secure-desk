-- Fictional local fixtures only. All identities, history, routing and decisions roll back.

-- Database role/JWT simulation is not an actual signup or email/session test.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select extensions.plan(95);

-- Signup bridge stays enabled; these fictional identities create their own pending profiles/requests.
insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values
 ('40000000-0000-4000-8000-000000000001','request-test-1@securedesk.example.invalid',now(),'{"full_name":"Test Alice","phone":"+12025550201","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000002','request-test-2@securedesk.example.invalid',now(),'{"full_name":"Test Bob","phone":"+12025550202","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000003','request-test-3@securedesk.example.invalid',now(),'{"full_name":"Test Unrouted","phone":"+12025550203","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000004','request-test-4@securedesk.example.invalid',now(),'{"full_name":"Test Staff","phone":"+12025550204","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000005','request-test-5@securedesk.example.invalid',now(),'{"full_name":"Test Org Admin","phone":"+12025550205","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000006','request-test-6@securedesk.example.invalid',now(),'{"full_name":"Test Super Admin","phone":"+12025550206","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000007','request-test-7@securedesk.example.invalid',now(),'{"full_name":"Test Pending Admin","phone":"+12025550207","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000008','request-test-8@securedesk.example.invalid',now(),'{"full_name":"Test Approved Client","phone":"+12025550208","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('40000000-0000-4000-8000-000000000009','request-test-9@securedesk.example.invalid',now(),'{"full_name":"Test Rejected Client","phone":"+12025550209","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}');

-- Fixture-only trusted role/status changes after signup.
update public.profiles p set full_name=v.full_name,phone=v.phone,app_role=v.app_role,account_status=v.account_status
from (values
 ('40000000-0000-4000-8000-000000000001','Test Alice','+12025550201','client','pending'),
 ('40000000-0000-4000-8000-000000000002','Test Bob','+12025550202','client','pending'),
 ('40000000-0000-4000-8000-000000000003','Test Unrouted','+12025550203','client','pending'),
 ('40000000-0000-4000-8000-000000000004','Test Staff','+12025550204','staff','active'),
 ('40000000-0000-4000-8000-000000000005','Test Org Admin','+12025550205','admin','active'),
 ('40000000-0000-4000-8000-000000000006','Test Super Admin','+12025550206','super_admin','active'),
 ('40000000-0000-4000-8000-000000000007','Test Pending Admin','+12025550207','admin','pending'),
 ('40000000-0000-4000-8000-000000000008','Test Approved Client','+12025550208','client','active'),
 ('40000000-0000-4000-8000-000000000009','Test Rejected Client','+12025550209','client','rejected')
) as v(id,full_name,phone,app_role,account_status) where p.id=v.id::uuid;

insert into public.organizations (id,name,description,address,email,phone,status) values
 ('50000000-0000-4000-8000-000000000001','Test Company A','Fictional','Example address','request-company-a@securedesk.example.invalid','+12025550200','active'),
 ('50000000-0000-4000-8000-000000000002','Test Company B','Fictional','Example address','request-company-b@securedesk.example.invalid','+12025550200','active');

insert into public.organization_admin_assignments (organization_id,admin_user_id,assigned_by) values
 ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000006'), ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000007','40000000-0000-4000-8000-000000000006');

insert into public.staff_organization_assignments (organization_id,staff_user_id,assigned_by) values ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000006');

insert into public.organization_members (organization_id,user_id,approved_by) values ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000008','40000000-0000-4000-8000-000000000006');

update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000001',status='rejected',reviewed_by='40000000-0000-4000-8000-000000000006',reviewed_at=now(),rejection_reason='Fictional: verification incomplete' where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=1;
update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000001',status='rejected',reviewed_by='40000000-0000-4000-8000-000000000006',reviewed_at=now(),rejection_reason='Fictional: contact needed' where user_id='40000000-0000-4000-8000-000000000009' and attempt_number=1;
update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000001',status='approved',reviewed_by='40000000-0000-4000-8000-000000000006',reviewed_at=now(),rejection_reason=null where user_id='40000000-0000-4000-8000-000000000008' and attempt_number=1;

insert into public.registration_requests (id,user_id,attempt_number,company_name_text,message,phone,target_organization_id) values ('60000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',2,'Test Company A','Fictional second attempt','+12025550201','50000000-0000-4000-8000-000000000001');
update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000002' where user_id='40000000-0000-4000-8000-000000000002' and attempt_number=1;

-- Defaults, constraints and retention must also hold for trusted DB-owner statements.

select extensions.ok((select relrowsecurity from pg_catalog.pg_class where oid='public.registration_requests'::regclass), 'registration request RLS is enabled');

select extensions.is((select status from public.registration_requests where user_id='40000000-0000-4000-8000-000000000003' and attempt_number=1), 'pending', 'new registration request starts pending');

select extensions.ok((select reviewed_by is null and reviewed_at is null and rejection_reason is null from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000003' and attempt_number=1)), 'pending request has no fabricated decision metadata');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000001', 3, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '23505', null::text, 'a user cannot have two pending requests');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 1, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '23505', null::text, 'attempt numbers cannot duplicate a prior reviewed attempt');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 0, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '23514', null::text, 'attempt number must be positive');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, '   ', 'Please review this fictional registration.', '+12025550209')$sql$, '23514', null::text, 'company text cannot be blank');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', '   ', '+12025550209')$sql$, '23514', null::text, 'registration message cannot be blank');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '   ')$sql$, '23514', null::text, 'contact phone cannot be blank');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000010', 1, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '23503', null::text, 'request requires an existing profile; missing identity is rejected');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, target_organization_id) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', '50000000-0000-4000-8000-000000000099')$sql$, '23503', null::text, 'trusted routing must reference an existing organization');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'self-approved')$sql$, '23514', null::text, 'unknown request states are rejected');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'approved')$sql$, '23514', null::text, 'approval requires its reviewer and time');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status, reviewed_by, reviewed_at) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'rejected', '40000000-0000-4000-8000-000000000006', '2099-01-01')$sql$, '23514', null::text, 'rejection requires a reason');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status, reviewed_by, reviewed_at, rejection_reason) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'rejected', '40000000-0000-4000-8000-000000000006', '2099-01-01', '   ')$sql$, '23514', null::text, 'rejection reason cannot be blank');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, reviewed_by, reviewed_at) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', '40000000-0000-4000-8000-000000000006', '2099-01-01')$sql$, '23514', null::text, 'pending request cannot carry a review decision');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status, reviewed_by, reviewed_at, rejection_reason) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'approved', '40000000-0000-4000-8000-000000000006', '2099-01-01', 'not approved')$sql$, '23514', null::text, 'approval cannot carry a rejection reason');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status, reviewed_by, reviewed_at, rejection_reason) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'rejected', '40000000-0000-4000-8000-000000000006', '2000-01-01', 'Fictional reason')$sql$, '23514', null::text, 'review cannot predate request creation');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, status, reviewed_by, reviewed_at, rejection_reason) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', 'rejected', '40000000-0000-4000-8000-000000000099', '2099-01-01', 'Fictional reason')$sql$, '23503', null::text, 'review actor must reference an existing profile');

select extensions.throws_ok($sql$update public.registration_requests set id='60000000-0000-4000-8000-000000000099' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted id cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set user_id='40000000-0000-4000-8000-000000000009' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted user_id cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set attempt_number=3 where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted attempt_number cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set company_name_text='Rewritten company' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted company_name_text cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set message='Rewritten message' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted message cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set phone='+12025550299' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted phone cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set created_at='2000-01-01' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'submitted created_at cannot be rewritten');

select extensions.throws_ok($sql$update public.registration_requests set status='pending', reviewed_by=null, reviewed_at=null, rejection_reason=null where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=1)$sql$, '23514', null::text, 'rejected request cannot be reopened; retry needs a new row');

select extensions.throws_ok($sql$update public.registration_requests set rejection_reason='Rewritten reason' where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=1)$sql$, '23514', null::text, 'completed rejection reason is retained');

select extensions.throws_ok($sql$update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000002' where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000008' and attempt_number=1)$sql$, '23514', null::text, 'reviewed organization routing cannot be rewritten');

select extensions.throws_ok($sql$delete from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=1)$sql$, '23514', null::text, 'direct DB-owner delete cannot erase request history');

select extensions.throws_ok($sql$delete from public.profiles where id='40000000-0000-4000-8000-000000000001'$sql$, '23503', null::text, 'referenced applicant profile cannot be deleted with silent request loss');

-- No signed-out status enumeration or self-service writes.

set local role anon;

select extensions.throws_ok($sql$select id,status,rejection_reason from public.registration_requests$sql$, '42501', null::text, 'visitor cannot enumerate registration statuses');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '42501', null::text, 'signed-out visitor: cannot insert a request directly');

select extensions.throws_ok($sql$update public.registration_requests set status='approved', reviewed_by='40000000-0000-4000-8000-000000000006', reviewed_at=now(), rejection_reason=null where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'signed-out visitor: cannot approve a request directly');

select extensions.throws_ok($sql$delete from public.registration_requests where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'signed-out visitor: cannot delete request history');

-- Pending and rejected applicants read their own status/history only.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 2, 'pending Alice reads her two attempts, not another applicant');

select extensions.is((select status from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=1), 'rejected', 'Alice retains her previous rejected status');

select extensions.is((select status from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=2), 'pending', 'Alice reads her current pending attempt');

select extensions.is((select rejection_reason from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=1)), 'Fictional: verification incomplete', 'applicant reads the rejection reason');

select extensions.is((select count(*)::integer from public.registration_requests where user_id='40000000-0000-4000-8000-000000000002'), 0, 'pending applicant cannot read Bob request');

select extensions.throws_ok($sql$select company_name_text from public.registration_requests$sql$, '42501', null::text, 'status-only API does not expose company_name_text');

select extensions.throws_ok($sql$select message from public.registration_requests$sql$, '42501', null::text, 'status-only API does not expose message');

select extensions.throws_ok($sql$select phone from public.registration_requests$sql$, '42501', null::text, 'status-only API does not expose phone');

select extensions.throws_ok($sql$select target_organization_id from public.registration_requests$sql$, '42501', null::text, 'status-only API does not expose target_organization_id');

select extensions.throws_ok($sql$select reviewed_by from public.registration_requests$sql$, '42501', null::text, 'status-only API does not expose reviewed_by');

select extensions.is((select count(*)::integer from public.organizations), 0, 'pending request gives no organization access');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'pending request creates no membership');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '42501', null::text, 'pending applicant: cannot insert a request directly');

select extensions.throws_ok($sql$update public.registration_requests set status='approved', reviewed_by='40000000-0000-4000-8000-000000000006', reviewed_at=now(), rejection_reason=null where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'pending applicant: cannot approve a request directly');

select extensions.throws_ok($sql$delete from public.registration_requests where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'pending applicant: cannot delete request history');

select extensions.throws_ok($sql$update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000002' where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'applicant cannot redirect its request into another admin scope');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000001","user_metadata":{"app_role":"super_admin","account_status":"active"},"app_role":"super_admin"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 2, 'forged privileged metadata gives no other-request access');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000002"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'Bob reads only his own attempt in company B');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000009"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'rejected applicant retains own status/history');

select extensions.is((select rejection_reason from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000009' and attempt_number=1)), 'Fictional: contact needed', 'rejected applicant reads its response');

-- Staff and an approved co-tenant Client do not inherit registration review access.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000004"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'Staff reads own signup history, not A applicants');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '42501', null::text, 'active Staff: cannot insert a request directly');

select extensions.throws_ok($sql$update public.registration_requests set status='approved', reviewed_by='40000000-0000-4000-8000-000000000006', reviewed_at=now(), rejection_reason=null where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'active Staff: cannot approve a request directly');

select extensions.throws_ok($sql$delete from public.registration_requests where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'active Staff: cannot delete request history');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000008"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'approved Client reads own historical request only');

select extensions.is((select count(*)::integer from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001'), 0, 'approved Client cannot read a co-tenant applicant');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '42501', null::text, 'approved Client: cannot insert a request directly');

select extensions.throws_ok($sql$update public.registration_requests set status='approved', reviewed_by='40000000-0000-4000-8000-000000000006', reviewed_at=now(), rejection_reason=null where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'approved Client: cannot approve a request directly');

select extensions.throws_ok($sql$delete from public.registration_requests where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'approved Client: cannot delete request history');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000007"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'pending Admin reads own signup history only');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000010"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 0, 'identity context without profile sees no request');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 0, 'missing identity sees no request');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000006","is_anonymous":true}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 0, 'anonymous Auth identity gets no privileged review scope');

-- Administrative status lists are scoped; detailed review and writes are later workflows.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000005"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 5, 'Org Admin reads assigned A statuses plus own signup history');

select extensions.is((select count(*)::integer from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000002' and attempt_number=1)), 0, 'Org Admin cannot read B request status');

select extensions.is((select count(*)::integer from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000003' and attempt_number=1)), 0, 'unrouted requests are not visible to arbitrary Org Admin');

select extensions.throws_ok($sql$select message,phone from public.registration_requests$sql$, '42501', null::text, 'initial Admin table API still exposes status fields only');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '42501', null::text, 'Organization Admin before controlled review: cannot insert a request directly');

select extensions.throws_ok($sql$update public.registration_requests set status='approved', reviewed_by='40000000-0000-4000-8000-000000000006', reviewed_at=now(), rejection_reason=null where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'Organization Admin before controlled review: cannot approve a request directly');

select extensions.throws_ok($sql$delete from public.registration_requests where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'Organization Admin before controlled review: cannot delete request history');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000006"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 10, 'active Super Admin reads all fixture signup/repeated requests across scopes');

select extensions.throws_ok($sql$select message,phone from public.registration_requests$sql$, '42501', null::text, 'full Super Admin review detail is not granted by this status-only API');

select extensions.throws_ok($sql$insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209')$sql$, '42501', null::text, 'Super Admin before controlled review: cannot insert a request directly');

select extensions.throws_ok($sql$update public.registration_requests set status='approved', reviewed_by='40000000-0000-4000-8000-000000000006', reviewed_at=now(), rejection_reason=null where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'Super Admin before controlled review: cannot approve a request directly');

select extensions.throws_ok($sql$delete from public.registration_requests where id='60000000-0000-4000-8000-000000000002'$sql$, '42501', null::text, 'Super Admin before controlled review: cannot delete request history');

reset role;

update public.profiles set account_status='rejected' where id='40000000-0000-4000-8000-000000000006';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000006"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'rejected Super Admin retains own signup history only');

reset role;

update public.profiles set account_status='active' where id='40000000-0000-4000-8000-000000000006';

-- Trusted pending routing and immutable retry history; these are not exposed application actions.

update public.registration_requests set target_organization_id='50000000-0000-4000-8000-000000000001',updated_at='2000-01-01' where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000003' and attempt_number=1);

select extensions.ok((select updated_at>=created_at from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000003' and attempt_number=1)), 'trusted pending routing refreshes updated_at');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000005"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 6, 'trusted routing adds one status to Admin scope plus own history');

reset role;

update public.organization_admin_assignments set active=false where admin_user_id='40000000-0000-4000-8000-000000000005';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000005"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 1, 'revoking Admin removes applicant scope and preserves own history');

reset role;

update public.profiles set account_status='pending',phone='+12025550299' where id='40000000-0000-4000-8000-000000000009';

insert into public.registration_requests (user_id, attempt_number, company_name_text, message, phone, target_organization_id) values ('40000000-0000-4000-8000-000000000009', 2, 'Test Company A', 'Please review this fictional registration.', '+12025550209', '50000000-0000-4000-8000-000000000002');

select extensions.is((select phone from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000009' and attempt_number=1)), '+12025550209', 'request contact snapshot is retained despite a later profile phone change');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000009"}', true); end $$;

select extensions.is((select count(*)::integer from public.registration_requests where user_id::text like '40000000-%'), 2, 'retry creates a new visible attempt and preserves the rejected one');

select extensions.is((select status from public.registration_requests where user_id='40000000-0000-4000-8000-000000000009' and attempt_number=1), 'rejected', 'old rejection is retained after retry');

select extensions.is((select status from public.registration_requests where user_id='40000000-0000-4000-8000-000000000009' and attempt_number=2), 'pending', 'new retry starts pending');

select extensions.is((select rejection_reason from public.registration_requests where id=(select id from public.registration_requests where user_id='40000000-0000-4000-8000-000000000009' and attempt_number=1)), 'Fictional: contact needed', 'old rejection reason remains intact after retry');

select extensions.is((select count(*)::integer from public.organizations), 0, 'retry gives no organization access');

reset role;

update public.registration_requests set status='approved',reviewed_by='40000000-0000-4000-8000-000000000006',reviewed_at=now() where id='60000000-0000-4000-8000-000000000002';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.is((select status from public.registration_requests where user_id='40000000-0000-4000-8000-000000000001' and attempt_number=2), 'approved', 'reviewed status is visible to its applicant');

select extensions.is((select account_status from public.profiles where id='40000000-0000-4000-8000-000000000001'), 'pending', 'changing request status alone does not activate a profile');

select extensions.is((select count(*)::integer from public.organizations), 0, 'approved label alone does not authorize organization content');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'approved label alone does not create membership');

reset role;

select extensions.throws_ok($sql$update public.registration_requests set status='rejected',rejection_reason='Reversal' where id='60000000-0000-4000-8000-000000000002'$sql$, '23514', null::text, 'completed approval cannot be overwritten by another decision');

select * from extensions.finish();
rollback;
