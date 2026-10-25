# SecureDesk — organizations, memberships and assignments

Date: October 5, 2026. Second migration applied locally only. All 209 SQL checks passed: 33 for profiles and 176 for organization scopes. After tests there are no Auth users or rows in five business tables. Hosted database and application .env.local were not changed.

This document records the previous step and results at that time. Latest signup bridge, email confirmation, 352 SQL + 25 real Auth checks and retained demo are described in [AUTH_REGISTRATION.md](AUTH_REGISTRATION.md). Organization privileges now also require confirmed Auth email.

## What we built

Role answers what the user may do; membership/assignment answers for which company they may do it. RLS checks both conditions and active profile status. Entering organization_id or role in a request alone does not grant access.

| Table | Purpose |
| --- | --- |
| organizations | Company profile: name, description, address, email, phone, optional industry and contact person; status pending/active/inactive. |
| organization_members | Approved Client membership and its history; status active/ended, who/when approved, start and end. |
| staff_organization_assignments | Separate Staff assignments, multiple companies per Staff; active and can_create_project, default false. |
| organization_admin_assignments | Organizations managed by organization Admin; multiple companies per Admin. Super Admin does not require tenant assignment. |

All four have UUID keys, FK to profiles/organizations, timestamp fields and RLS enabled. Controlled update refreshes updated_at. Reference constraints do not cascade delete history.

For organization, non-empty name, description, address, email and phone are required per new organization request data (decision 31). Email/phone format and request input will be validated further by future controlled flow; CHECK non-empty is not full contact validation. industry and contact_person may stay NULL but not empty if set.

## Who can read now

| User | Organizations | Memberships and assignments |
| --- | --- | --- |
| Not signed in, pending/rejected or no profile | None. | No rows. profiles still allows only own status to signed-in user. |
| Active Client | Only active company of their active membership. | Only own active membership row; does not see colleague/Staff/Admin lists. |
| Active Staff | Active companies of their active Staff assignments. | Only own active Staff assignments; does not see Client/Admin lists. |
| Active organization Admin | Active companies of their active Admin assignments. | Memberships, including ended episodes, and assignments only for those companies. |
| Active Super Admin | All existing companies, including pending/inactive. | All membership episodes and assignments. |

Anonymous Auth identity is separately rejected under authenticated DB role. account_status and app_role are read from stored profile, not from user-editable metadata. Wrong assignment type cannot grant another role's authorization.

Direct application INSERT/UPDATE/DELETE on four tables are closed, including authenticated requests of business Super Admin. service_role also has no grants. DB owner uses reviewed migrations and test fixtures. Administrative approval and application writes are not available yet.

Three narrow scope read functions are in securedesk_private, outside Data API exposed schemas. SECURITY DEFINER prevents circular RLS policy calls; search_path is empty, references fully qualified, EXECUTE only for authenticated and DB owner. Functions do not accept foreign user_id and do not change data. USAGE on private schema alone is not permission to create objects or execute earlier trigger functions.

## One active Client membership and history

Partial unique index limits user_id to one row with status active. This applies even when DB owner attempts insert of second active membership. Pending requests will be in separate tables, not in organization_members.

Each approved membership episode has its own id. Ended episode remains with ended_at. Return to same company creates new episode; does not overwrite previous. Therefore no permanent UNIQUE(organization_id,user_id) here, which would block this history. This is technical elaboration of approved schema proposal, without changing business rule of one active company.

Test simulates controlled transfer within its rollback transaction: ends old membership, adds new and verifies same user session sees only new company. This does not implement transfer workflow, two Admin consent or audit. Their controlled flows follow per decision 32/48 and final cross-org alignment.

Staff/Admin assignments have unique company/user pair and active toggle. Later decision history goes through controlled flow/audit; not modeled as membership episodes. Revoking assignment immediately changes next RLS query.

## Checks and practical boundaries

- 176 new pgTAP checks cover actually returned allowed rows, bans between companies, own/foreign row, all four tables, direct writes, forged metadata, unconfirmed accounts, anonymous Auth, missing identity, Super Admin, access revocation, multiple Staff/Admin companies, Client transfer/return and basic FK/CHECK/unique guarantees.
- Previous 33 profiles checks remained unchanged and passed together with new tests. Command: npm run db:test, locally, two files, 209 checks, PASS.
- With valid local public key Auth settings returns HTTP 200. Anonymous SELECT for each of four new tables returns HTTP 401 / code 42501. Attempt to access securedesk_private schema via Data API returns HTTP 406 / PGRST106.
- Fixtures use fictional addresses under .example.invalid. ROLLBACK removes all test identities and data; after test confirmed 0 Auth users and 0 rows in all five tables.

SQL tests simulate DB role/JWT context. They do not test real registration, email confirmation or application session refresh. Tests intentionally insert some unconfirmed/mis-assigned links as DB owner to prove they do not bypass check of stored role/status. Target role, approver authorization and allowed write lifecycle will be verified by dedicated transactional routines before that API opens.

Access to pending/inactive organizations is currently closed for all except active Super Admin. This is boundary of this initial read step, not final business archive policy. T-01 for limited historical review is finalized before deactivation workflow. Controlled organization activation, its first membership and General Support must come together; projects and that flow are not implemented yet. can_create_project is data only without available action yet.

Gate 2 remains open: registration requests, Auth/email verification/sessions, controlled administrative approvals and safe development Super Admin setup still follow. Dashboard has no new pages.

## Review in Studio

Refresh local Table Editor, then select public. Besides profiles there are organizations, organization_members, staff_organization_assignments and organization_admin_assignments. No rows. Review organizations, then organization_members: organization_id shows company, user_id Client profile, status whether membership is active.

Studio works with administrative access. Its table preview is not demonstration of user permissions; those are verified by tests.

Migration: supabase/migrations/20261005191316_organizations_foundation.sql. Tests: supabase/tests/organization_scopes.test.sql. New reviewed SQL is applied via npm run supabase -- migration up --local; applied migrations are not rewritten. No new database reset in this step. First profiles reset is evidence of earlier step, not repetition of second migration.

## Decision sources

- [Approved schema](spec-v1-approved/DATABASE_SCHEMA.md), [permissions matrix](spec-v1-approved/PERMISSIONS_MATRIX.md) and [decisions 02, 04–05, 31–36, 48, 50–52 and T-01](spec-v1-approved/DECISIONS.md), preserved unchanged.
- [Supabase RLS, grants and private functions](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [PostgreSQL 17 constraints and partial unique index](https://www.postgresql.org/docs/17/ddl-constraints.html).
- [PostgreSQL SECURITY DEFINER function security](https://www.postgresql.org/docs/17/sql-createfunction.html).
- [pgTAP documentation](https://pgtap.org/documentation.html).
