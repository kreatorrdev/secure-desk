-- Fictional identities and organizations only; every fixture and mutation is rolled back.

-- SET ROLE/JWT context checks database access, not actual login or email verification.

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select extensions.plan(176);

-- Signup bridge stays enabled; these fictional identities create their own pending profiles/requests.
insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values
 ('20000000-0000-4000-8000-000000000001','org-test-1@securedesk.example.invalid',now(),'{"full_name":"Test Alice","phone":"+12025550101","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000002','org-test-2@securedesk.example.invalid',now(),'{"full_name":"Test Bob","phone":"+12025550102","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000003','org-test-3@securedesk.example.invalid',now(),'{"full_name":"Test Staff","phone":"+12025550103","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000004','org-test-4@securedesk.example.invalid',now(),'{"full_name":"Test Org Admin","phone":"+12025550104","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000005','org-test-5@securedesk.example.invalid',now(),'{"full_name":"Test Super Admin","phone":"+12025550105","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000006','org-test-6@securedesk.example.invalid',now(),'{"full_name":"Test Pending","phone":"+12025550106","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000007','org-test-7@securedesk.example.invalid',now(),'{"full_name":"Test Rejected","phone":"+12025550107","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000008','org-test-8@securedesk.example.invalid',now(),'{"full_name":"Test Unassigned","phone":"+12025550108","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000009','org-test-9@securedesk.example.invalid',now(),'{"full_name":"Test Ended Only","phone":"+12025550109","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000010','org-test-10@securedesk.example.invalid',now(),'{"full_name":"Test Inactive Org","phone":"+12025550110","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000011','org-test-11@securedesk.example.invalid',now(),'{"full_name":"Test Pending Org","phone":"+12025550111","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000012','org-test-12@securedesk.example.invalid',now(),'{"full_name":"Test Pending Staff","phone":"+12025550112","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}'),
 ('20000000-0000-4000-8000-000000000013','org-test-13@securedesk.example.invalid',now(),'{"full_name":"Test Pending Admin","phone":"+12025550113","company_name":"Test fixture company","message":"Fictional SQL registration fixture."}');

-- Fixture-only trusted role/status changes after signup.
update public.profiles p set full_name=v.full_name,phone=v.phone,app_role=v.app_role,account_status=v.account_status
from (values
 ('20000000-0000-4000-8000-000000000001','Test Alice','+12025550101','client','active'),
 ('20000000-0000-4000-8000-000000000002','Test Bob','+12025550102','client','active'),
 ('20000000-0000-4000-8000-000000000003','Test Staff','+12025550103','staff','active'),
 ('20000000-0000-4000-8000-000000000004','Test Org Admin','+12025550104','admin','active'),
 ('20000000-0000-4000-8000-000000000005','Test Super Admin','+12025550105','super_admin','active'),
 ('20000000-0000-4000-8000-000000000006','Test Pending','+12025550106','client','pending'),
 ('20000000-0000-4000-8000-000000000007','Test Rejected','+12025550107','client','rejected'),
 ('20000000-0000-4000-8000-000000000008','Test Unassigned','+12025550108','client','active'),
 ('20000000-0000-4000-8000-000000000009','Test Ended Only','+12025550109','client','active'),
 ('20000000-0000-4000-8000-000000000010','Test Inactive Org','+12025550110','client','active'),
 ('20000000-0000-4000-8000-000000000011','Test Pending Org','+12025550111','client','active'),
 ('20000000-0000-4000-8000-000000000012','Test Pending Staff','+12025550112','staff','pending'),
 ('20000000-0000-4000-8000-000000000013','Test Pending Admin','+12025550113','admin','pending')
) as v(id,full_name,phone,app_role,account_status) where p.id=v.id::uuid;

insert into public.organizations (id, name, description, address, email, phone, status) values
 ('30000000-0000-4000-8000-000000000001', 'Test Company A', 'Fictional test company', 'Example address', 'company-a@securedesk.example.invalid', '+12025550100', 'active'),
 ('30000000-0000-4000-8000-000000000002', 'Test Company B', 'Fictional test company', 'Example address', 'company-b@securedesk.example.invalid', '+12025550100', 'active'),
 ('30000000-0000-4000-8000-000000000003', 'Test Company C', 'Fictional test company', 'Example address', 'company-c@securedesk.example.invalid', '+12025550100', 'active'),
 ('30000000-0000-4000-8000-000000000004', 'Test Company D', 'Fictional test company', 'Example address', 'company-d@securedesk.example.invalid', '+12025550100', 'inactive'),
 ('30000000-0000-4000-8000-000000000005', 'Test Company E', 'Fictional test company', 'Example address', 'company-e@securedesk.example.invalid', '+12025550100', 'pending');

-- Pending profiles and wrong-role links model incomplete/bad privileged data: neither may grant access.

insert into public.organization_members (organization_id, user_id, approved_by) values
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005'),
 ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000005'),
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005'),
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000005'),
 ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000005'),
 ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000005'),
 ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005');

insert into public.organization_members (organization_id, user_id, status, approved_by, approved_at, joined_at, ended_at) values
 ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ended', '20000000-0000-4000-8000-000000000005', '2000-01-01', '2000-01-02', '2001-01-01'),
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000009', 'ended', '20000000-0000-4000-8000-000000000005', '2000-01-01', '2000-01-02', '2001-01-01');

insert into public.staff_organization_assignments (organization_id, staff_user_id, assigned_by, active) values
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005', true),
 ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005', true),
 ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005', false),
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000005', true),
 ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', true);

insert into public.organization_admin_assignments (organization_id, admin_user_id, assigned_by, active) values
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', true),
 ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', false),
 ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000005', true),
 ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005', true);


-- Structural guarantees and controlled-owner input validation.

select extensions.ok((select relrowsecurity from pg_catalog.pg_class where oid='public.organizations'::regclass), 'organizations: RLS enabled');

select extensions.ok((select relrowsecurity from pg_catalog.pg_class where oid='public.organization_members'::regclass), 'organization_members: RLS enabled');

select extensions.ok((select relrowsecurity from pg_catalog.pg_class where oid='public.staff_organization_assignments'::regclass), 'staff_organization_assignments: RLS enabled');

select extensions.ok((select relrowsecurity from pg_catalog.pg_class where oid='public.organization_admin_assignments'::regclass), 'organization_admin_assignments: RLS enabled');

select extensions.is((select count(*)::integer from public.staff_organization_assignments where can_create_project), 0, 'project creation permission defaults off in every organization');

insert into public.organizations (name, description, address, email, phone) values ('New Fictional Company', 'Test description', 'Test address', 'new@securedesk.example.invalid', '+12025550199');

select extensions.is((select status from public.organizations where name='New Fictional Company'), 'pending', 'a controlled new organization starts pending');

delete from public.organizations where name='New Fictional Company';

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005')$sql$, '23505', null::text, 'a second active client membership is rejected even for a DB-owner write');

select extensions.throws_ok($sql$insert into public.staff_organization_assignments (organization_id, staff_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005')$sql$, '23505', null::text, 'a staff assignment cannot be duplicated for the same organization');

select extensions.throws_ok($sql$insert into public.organization_admin_assignments (organization_id, admin_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005')$sql$, '23505', null::text, 'an admin assignment cannot be duplicated for the same organization');

select extensions.throws_ok($sql$update public.organizations set status='public'$sql$, '23514', null::text, 'unknown organization state is rejected');

select extensions.throws_ok($sql$update public.organizations set name='   '$sql$, '23514', null::text, 'blank company name is rejected');

select extensions.throws_ok($sql$update public.organizations set address='   '$sql$, '23514', null::text, 'blank company address is rejected');

select extensions.throws_ok($sql$update public.organizations set email='   '$sql$, '23514', null::text, 'blank company email is rejected');

select extensions.throws_ok($sql$update public.organizations set phone='   '$sql$, '23514', null::text, 'blank company phone is rejected');

select extensions.throws_ok($sql$update public.organization_members set status='ended', ended_at=null where user_id='20000000-0000-4000-8000-000000000001' and status='active'$sql$, '23514', null::text, 'ended membership must record its end time');

select extensions.throws_ok($sql$update public.organization_members set ended_at=now() where user_id='20000000-0000-4000-8000-000000000001' and status='active'$sql$, '23514', null::text, 'active membership cannot already have an end time');

select extensions.throws_ok($sql$update public.organization_members set status='ended', ended_at='1990-01-01' where user_id='20000000-0000-4000-8000-000000000001' and status='active'$sql$, '23514', null::text, 'membership cannot end before it joined');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by, approved_at, joined_at) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005', '2001-01-01', '2000-01-01')$sql$, '23514', null::text, 'membership cannot precede its approval');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000099', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005')$sql$, '23503', null::text, 'membership requires an existing organization');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000005')$sql$, '23503', null::text, 'membership requires an existing profile');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000008', null)$sql$, '23502', null::text, 'membership requires an approval actor');

select extensions.throws_ok($sql$delete from public.organizations where id='30000000-0000-4000-8000-000000000001'$sql$, '23503', null::text, 'organization deletion cannot silently erase membership/assignment history');

select extensions.throws_ok($sql$delete from public.profiles where id='20000000-0000-4000-8000-000000000001'$sql$, '23503', null::text, 'profile deletion cannot silently erase membership history');


-- No visitor enumeration or write access.

set local role anon;

select extensions.throws_ok($sql$select * from public.organizations$sql$, '42501', null::text, 'signed-out visitor: cannot read organizations');

select extensions.throws_ok($sql$select * from public.organization_members$sql$, '42501', null::text, 'signed-out visitor: cannot read organization_members');

select extensions.throws_ok($sql$select * from public.staff_organization_assignments$sql$, '42501', null::text, 'signed-out visitor: cannot read staff_organization_assignments');

select extensions.throws_ok($sql$select * from public.organization_admin_assignments$sql$, '42501', null::text, 'signed-out visitor: cannot read organization_admin_assignments');

select extensions.throws_ok($sql$insert into public.organizations (name, description, address, email, phone) values ('New Fictional Company', 'Test description', 'Test address', 'new@securedesk.example.invalid', '+12025550199')$sql$, '42501', null::text, 'signed-out visitor: cannot insert organizations');

select extensions.throws_ok($sql$update public.organizations set status='active'$sql$, '42501', null::text, 'signed-out visitor: cannot update organizations');

select extensions.throws_ok($sql$delete from public.organizations$sql$, '42501', null::text, 'signed-out visitor: cannot delete organizations');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'signed-out visitor: cannot insert organization_members');

select extensions.throws_ok($sql$update public.organization_members set approved_by=approved_by$sql$, '42501', null::text, 'signed-out visitor: cannot update organization_members');

select extensions.throws_ok($sql$delete from public.organization_members$sql$, '42501', null::text, 'signed-out visitor: cannot delete organization_members');

select extensions.throws_ok($sql$insert into public.staff_organization_assignments (organization_id, staff_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'signed-out visitor: cannot insert staff_organization_assignments');

select extensions.throws_ok($sql$update public.staff_organization_assignments set can_create_project=true$sql$, '42501', null::text, 'signed-out visitor: cannot update staff_organization_assignments');

select extensions.throws_ok($sql$delete from public.staff_organization_assignments$sql$, '42501', null::text, 'signed-out visitor: cannot delete staff_organization_assignments');

select extensions.throws_ok($sql$insert into public.organization_admin_assignments (organization_id, admin_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'signed-out visitor: cannot insert organization_admin_assignments');

select extensions.throws_ok($sql$update public.organization_admin_assignments set active=true$sql$, '42501', null::text, 'signed-out visitor: cannot update organization_admin_assignments');

select extensions.throws_ok($sql$delete from public.organization_admin_assignments$sql$, '42501', null::text, 'signed-out visitor: cannot delete organization_admin_assignments');

select extensions.throws_ok($sql$select securedesk_private.can_read_organization('30000000-0000-4000-8000-000000000001')$sql$, '42501', null::text, 'visitor cannot call private role helpers');


-- Active Client: one organization, own membership only, no assignment lists.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A']::text[], 'Client sees its active organization, not B/C or its old B membership');

select extensions.is((select count(*)::integer from public.organization_members), 1, 'Client reads only its own active membership');

select extensions.is((select count(*)::integer from public.organization_members where user_id='20000000-0000-4000-8000-000000000006'), 0, 'Client cannot enumerate another client membership');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Client cannot read staff assignments');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Client cannot read admin assignments, including an inconsistent own admin link');

select extensions.ok(not securedesk_private.can_administer_organization('30000000-0000-4000-8000-000000000001'), 'Client organization access is not administrative access');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000001","user_metadata":{"app_role":"super_admin","account_status":"active"},"app_role":"super_admin","organization_id":"30000000-0000-4000-8000-000000000002"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A']::text[], 'caller role/organization metadata cannot change the stored Client scope');

select extensions.throws_ok($sql$insert into public.organizations (name, description, address, email, phone) values ('New Fictional Company', 'Test description', 'Test address', 'new@securedesk.example.invalid', '+12025550199')$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot insert organizations');

select extensions.throws_ok($sql$update public.organizations set status='active'$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot update organizations');

select extensions.throws_ok($sql$delete from public.organizations$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot delete organizations');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot insert organization_members');

select extensions.throws_ok($sql$update public.organization_members set approved_by=approved_by$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot update organization_members');

select extensions.throws_ok($sql$delete from public.organization_members$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot delete organization_members');

select extensions.throws_ok($sql$insert into public.staff_organization_assignments (organization_id, staff_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot insert staff_organization_assignments');

select extensions.throws_ok($sql$update public.staff_organization_assignments set can_create_project=true$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot update staff_organization_assignments');

select extensions.throws_ok($sql$delete from public.staff_organization_assignments$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot delete staff_organization_assignments');

select extensions.throws_ok($sql$insert into public.organization_admin_assignments (organization_id, admin_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot insert organization_admin_assignments');

select extensions.throws_ok($sql$update public.organization_admin_assignments set active=true$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot update organization_admin_assignments');

select extensions.throws_ok($sql$delete from public.organization_admin_assignments$sql$, '42501', null::text, 'active Client with forged privileged metadata: cannot delete organization_admin_assignments');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000002"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company B']::text[], 'second Client sees B and cannot read A');


-- Approval and identity are required even if a bad link already exists.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000006","user_metadata":{"app_role":"super_admin","account_status":"active"}}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'pending Client: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'pending Client: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'pending Client: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'pending Client: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000007"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'rejected Client: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'rejected Client: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'rejected Client: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'rejected Client: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000008"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'approved Client without membership: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'approved Client without membership: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'approved Client without membership: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'approved Client without membership: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000009"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'Client with ended membership only: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Client with ended membership only: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Client with ended membership only: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Client with ended membership only: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000010"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'Client of inactive company: archive workflow not enabled: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Client of inactive company: archive workflow not enabled: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Client of inactive company: archive workflow not enabled: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Client of inactive company: archive workflow not enabled: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000011"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'Client of pending company: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Client of pending company: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Client of pending company: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Client of pending company: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000012"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'pending Staff despite assignment: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'pending Staff despite assignment: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'pending Staff despite assignment: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'pending Staff despite assignment: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000013"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'pending Admin despite assignment: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'pending Admin despite assignment: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'pending Admin despite assignment: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'pending Admin despite assignment: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000014"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'identity context without a profile: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Auth identity without a profile: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Auth identity without a profile: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Auth identity without a profile: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'authenticated DB role without identity: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'authenticated DB role without identity: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'authenticated DB role without identity: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'authenticated DB role without identity: no organization_admin_assignments rows');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000005","is_anonymous":true}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'anonymous Auth identity despite privileged profile: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'anonymous Auth identity despite privileged profile: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'anonymous Auth identity despite privileged profile: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'anonymous Auth identity despite privileged profile: no organization_admin_assignments rows');


-- Staff can span companies but cannot read their membership/admin lists.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000003"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A','Test Company B']::text[], 'Staff reads both assigned companies, not revoked C or a wrong-role Client link');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 2, 'Staff reads only its own two active assignments');

select extensions.is((select count(*)::integer from public.staff_organization_assignments where staff_user_id='20000000-0000-4000-8000-000000000012'), 0, 'Staff cannot read another staff assignment');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Staff cannot enumerate Client memberships');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Staff cannot enumerate admin assignments');

select extensions.ok(not securedesk_private.can_administer_organization('30000000-0000-4000-8000-000000000001'), 'Staff is not an organization administrator');

select extensions.throws_ok($sql$update public.staff_organization_assignments set can_create_project=true$sql$, '42501', null::text, 'Staff cannot grant itself project creation permission');


-- Organization Admin reads membership and assignment records only in its assigned scope.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000004"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A']::text[], 'Org Admin sees assigned A, not revoked B or a wrong-role Staff link to C');

select extensions.is((select count(*)::integer from public.organization_members), 4, 'Org Admin reads A membership records, including ended history');

select extensions.is((select count(*)::integer from public.organization_members where organization_id='30000000-0000-4000-8000-000000000002'), 0, 'Org Admin cannot read B memberships');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 2, 'Org Admin reads only A staff assignment records');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 2, 'Org Admin reads only A admin assignment records');

select extensions.ok(securedesk_private.can_administer_organization('30000000-0000-4000-8000-000000000001') and not securedesk_private.can_administer_organization('30000000-0000-4000-8000-000000000002'), 'Org Admin authority is limited to assigned A');

select extensions.throws_ok($sql$insert into public.organizations (name, description, address, email, phone) values ('New Fictional Company', 'Test description', 'Test address', 'new@securedesk.example.invalid', '+12025550199')$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot insert organizations');

select extensions.throws_ok($sql$update public.organizations set status='active'$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot update organizations');

select extensions.throws_ok($sql$delete from public.organizations$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot delete organizations');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot insert organization_members');

select extensions.throws_ok($sql$update public.organization_members set approved_by=approved_by$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot update organization_members');

select extensions.throws_ok($sql$delete from public.organization_members$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot delete organization_members');

select extensions.throws_ok($sql$insert into public.staff_organization_assignments (organization_id, staff_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot insert staff_organization_assignments');

select extensions.throws_ok($sql$update public.staff_organization_assignments set can_create_project=true$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot update staff_organization_assignments');

select extensions.throws_ok($sql$delete from public.staff_organization_assignments$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot delete staff_organization_assignments');

select extensions.throws_ok($sql$insert into public.organization_admin_assignments (organization_id, admin_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot insert organization_admin_assignments');

select extensions.throws_ok($sql$update public.organization_admin_assignments set active=true$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot update organization_admin_assignments');

select extensions.throws_ok($sql$delete from public.organization_admin_assignments$sql$, '42501', null::text, 'Organization Admin before controlled write routines: cannot delete organization_admin_assignments');


-- Active Super Admin has global read scope, not a general public write API.

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000005"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations where id::text like '30000000-%' order by name$sql$, array['Test Company A','Test Company B','Test Company C','Test Company D','Test Company E']::text[], 'Super Admin reads all fixture organizations including pending/inactive');

select extensions.is((select count(*)::integer from public.organization_members where organization_id::text like '30000000-%'), 9, 'Super Admin reads membership history globally');

select extensions.is((select count(*)::integer from public.staff_organization_assignments where organization_id::text like '30000000-%'), 5, 'Super Admin reads staff assignments globally');

select extensions.is((select count(*)::integer from public.organization_admin_assignments where organization_id::text like '30000000-%'), 4, 'Super Admin reads admin assignments globally');

select extensions.ok(not securedesk_private.can_read_organization('30000000-0000-4000-8000-000000000099'), 'even global helper does not affirm a nonexistent organization');

select extensions.throws_ok($sql$insert into public.organizations (name, description, address, email, phone) values ('New Fictional Company', 'Test description', 'Test address', 'new@securedesk.example.invalid', '+12025550199')$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot insert organizations');

select extensions.throws_ok($sql$update public.organizations set status='active'$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot update organizations');

select extensions.throws_ok($sql$delete from public.organizations$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot delete organizations');

select extensions.throws_ok($sql$insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot insert organization_members');

select extensions.throws_ok($sql$update public.organization_members set approved_by=approved_by$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot update organization_members');

select extensions.throws_ok($sql$delete from public.organization_members$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot delete organization_members');

select extensions.throws_ok($sql$insert into public.staff_organization_assignments (organization_id, staff_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot insert staff_organization_assignments');

select extensions.throws_ok($sql$update public.staff_organization_assignments set can_create_project=true$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot update staff_organization_assignments');

select extensions.throws_ok($sql$delete from public.staff_organization_assignments$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot delete staff_organization_assignments');

select extensions.throws_ok($sql$insert into public.organization_admin_assignments (organization_id, admin_user_id, assigned_by) values ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005')$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot insert organization_admin_assignments');

select extensions.throws_ok($sql$update public.organization_admin_assignments set active=true$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot update organization_admin_assignments');

select extensions.throws_ok($sql$delete from public.organization_admin_assignments$sql$, '42501', null::text, 'Super Admin before controlled write routines: cannot delete organization_admin_assignments');

reset role;

update public.profiles set account_status='rejected' where id='20000000-0000-4000-8000-000000000005';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000005"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'rejected Super Admin: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'rejected Super Admin: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'rejected Super Admin: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'rejected Super Admin: no organization_admin_assignments rows');

reset role;

update public.profiles set account_status='active' where id='20000000-0000-4000-8000-000000000005';


-- Revocation and controlled transfer: check access with the same identity context.

update public.organization_members set status='ended', ended_at=now() where user_id='20000000-0000-4000-8000-000000000001' and status='active';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'Client after active membership ends: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Client after active membership ends: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Client after active membership ends: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Client after active membership ends: no organization_admin_assignments rows');

reset role;

insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company B']::text[], 'controlled transfer gives B and removes A access');

select extensions.is((select count(*)::integer from public.organization_members), 1, 'transferred Client sees only its new active episode');

reset role;

select extensions.is((select count(*)::integer from public.organization_members where user_id='20000000-0000-4000-8000-000000000001'), 3, 'transfer retains the original and older ended membership episodes');

update public.organization_members set status='ended', ended_at=now() where user_id='20000000-0000-4000-8000-000000000001' and status='active';

insert into public.organization_members (organization_id, user_id, approved_by) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005');

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A']::text[], 'return to a previous company creates a new active episode');

reset role;

select extensions.is((select count(*)::integer from public.organization_members where user_id='20000000-0000-4000-8000-000000000001'), 4, 'return preserves prior episodes rather than overwriting them');

update public.profiles set app_role='staff' where id='20000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000001"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'stored Staff role cannot inherit a stale Client/admin link: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'stored Staff role cannot inherit a stale Client/admin link: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'stored Staff role cannot inherit a stale Client/admin link: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'stored Staff role cannot inherit a stale Client/admin link: no organization_admin_assignments rows');

reset role;

update public.profiles set app_role='client' where id='20000000-0000-4000-8000-000000000001';

update public.staff_organization_assignments set active=false where staff_user_id='20000000-0000-4000-8000-000000000003' and organization_id='30000000-0000-4000-8000-000000000002';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000003"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A']::text[], 'revoking Staff B assignment immediately removes B access');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 1, 'revoked Staff assignment is not readable as an active own link');

reset role;

update public.organization_admin_assignments set active=true where admin_user_id='20000000-0000-4000-8000-000000000004' and organization_id='30000000-0000-4000-8000-000000000002';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000004"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company A','Test Company B']::text[], 'Org Admin can be assigned to multiple companies');

reset role;

update public.organization_admin_assignments set active=false where admin_user_id='20000000-0000-4000-8000-000000000004' and organization_id='30000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000004"}', true); end $$;

select extensions.results_eq($sql$select name from public.organizations order by name$sql$, array['Test Company B']::text[], 'revoking Org Admin A assignment immediately removes A access');

select extensions.is((select count(*)::integer from public.organization_members where organization_id='30000000-0000-4000-8000-000000000001'), 0, 'revoked Org Admin loses A membership-history access');

reset role;

update public.organizations set status='inactive' where id='30000000-0000-4000-8000-000000000002';

set local role authenticated;

do $$ begin perform set_config('request.jwt.claim.sub', '', true); perform set_config('request.jwt.claims', '{"role":"authenticated","sub":"20000000-0000-4000-8000-000000000004"}', true); end $$;

select extensions.is((select count(*)::integer from public.organizations), 0, 'Org Admin after company becomes inactive: archive workflow pending: no organizations rows');

select extensions.is((select count(*)::integer from public.organization_members), 0, 'Org Admin after company becomes inactive: archive workflow pending: no organization_members rows');

select extensions.is((select count(*)::integer from public.staff_organization_assignments), 0, 'Org Admin after company becomes inactive: archive workflow pending: no staff_organization_assignments rows');

select extensions.is((select count(*)::integer from public.organization_admin_assignments), 0, 'Org Admin after company becomes inactive: archive workflow pending: no organization_admin_assignments rows');

reset role;

update public.organizations set updated_at='2000-01-01';

select extensions.ok((select bool_and(updated_at >= created_at) from public.organizations), 'organizations: controlled mutations refresh timestamps');

update public.organization_members set updated_at='2000-01-01';

select extensions.ok((select bool_and(updated_at >= created_at) from public.organization_members), 'organization_members: controlled mutations refresh timestamps');

update public.staff_organization_assignments set updated_at='2000-01-01';

select extensions.ok((select bool_and(updated_at >= created_at) from public.staff_organization_assignments), 'staff_organization_assignments: controlled mutations refresh timestamps');

update public.organization_admin_assignments set updated_at='2000-01-01';

select extensions.ok((select bool_and(updated_at >= created_at) from public.organization_admin_assignments), 'organization_admin_assignments: controlled mutations refresh timestamps');

select * from extensions.finish();
rollback;
