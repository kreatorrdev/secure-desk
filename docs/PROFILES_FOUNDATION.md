# SecureDesk — first identity foundation: profiles

Date: October 5, 2026. First local migration and database reconstruction from the same SQL file passed; 33 SQL checks passed before and after reconstruction. Anonymous local API request for profiles was rejected (HTTP 401 / code 42501), with valid public key (Auth settings HTTP 200). Hosted database was not changed. Approved documents in spec-v1-approved/ remain the source of business decisions.

This document describes the first step and checks at that time. Organization tables/scopes are in [ORGANIZATION_FOUNDATION.md](ORGANIZATION_FOUNDATION.md). Latest signup bridge, email confirmation, 352 SQL + 25 real Auth checks and retained demo are in [AUTH_REGISTRATION.md](AUTH_REGISTRATION.md). profiles permissions for own status remain the same.

## What was built in the first step

First business table, public.profiles. Supabase auth.users remains source of identity and login data; profiles has no email, password or token. Same UUID links Auth identity and profile.

| Column | Purpose |
| --- | --- |
| id | Same identifier as existing auth.users.id; one profile per identity. |
| full_name | Name from future registration; required and non-empty. |
| phone | Contact phone from future registration; required and non-empty. Format is finalized in registration validation. |
| app_role | client, staff, admin or super_admin. Default is client; super_admin is technical subtype of admin. |
| account_status | pending, active or rejected. Default is pending. active represents approved account; organizational access will additionally require membership/assignment. |
| created_at / updated_at | timestamptz times; controlled update automatically refreshes updated_at. |

Default values apply when controlled DB flow creates profile. Automatic profile creation on Auth registration is not added yet; registration form, email verification and session refresh come in Auth step. Tests use fictional Auth rows and profiles within transaction, removed by ROLLBACK.

## Rules in this small step

- Unauthenticated user has no read or write on profiles.
- Signed-in user can read only id and account_status of their row. This enables future display of own status for pending user.
- Other profile is not returned through RLS, even when request tries to set business role via user_metadata.
- Direct INSERT, UPDATE and DELETE through anon/authenticated are closed. User cannot create privileged profile, upgrade role or approve account.
- Anonymous Auth identity is separately rejected even when using authenticated DB role.
- Over profiles and Staff/Org Admin/Super Admin authenticated requests still have only own status. Organization read scopes are now in separate migration described in ORGANIZATION_FOUNDATION.md; broader profile views and controlled administrative writes still follow.
- service_role has no grants on this table in initial step. DB owner can execute reviewed controlled changes. Privileged application key was not added.

RLS limits rows, and GRANT permissions determine operations and columns. Both protections are in the same SQL file. Helper trigger function for update time is in securedesk_private, outside exposed API schemas, without public EXECUTE rights and with empty search_path.

FK does not use cascade delete of profile. Auth identity with profile cannot be deleted directly while that reference exists; this prevents silent deletion of author identity records. Later history access ties to memberships and business permissions.

## Checks and their boundaries

33 pgTAP checks cover own status, other profile, anon and missing identity, anonymous Auth, forged privileged metadata role, forbidden writes, initial values, FK, valid roles/states, required name/phone and update time. Test identities are local and fictional. DB role/JWT context simulation is not a test of real registration, email verification or application session.

This is not Gate 2. Organizations and memberships/assignments now have separate verified read foundation, but registration requests, Auth, administrative approval and General Support still follow. No dashboard or business pages.

## Files and local commands

- supabase/migrations/20261005183025_profiles_foundation.sql
- supabase/tests/profiles_foundation.test.sql

To apply new reviewed migrations locally only:

    npm run supabase -- migration up --local
    npm run db:test

Recreating from migrations uses npm run db:reset only when confirmed there is no needed local data. Applied migration is not rewritten; fixes go in the next one.

## Next practical review

In local Studio refresh Table Editor, select public then profiles. Columns are visible; no rows. Studio is administrative tool: its full table read is not proof of user permissions; user access is verified by SQL tests.

Next organization step was built and documented in ORGANIZATION_FOUNDATION.md. Membership will determine which company user belongs to, separate from login and global role. Existing local environment network limitations remain recorded in MIGRATIONS.md; we do not enter private client data.

## Sources

- [Approved schema](spec-v1-approved/DATABASE_SCHEMA.md), [permissions matrix](spec-v1-approved/PERMISSIONS_MATRIX.md), [decisions 06, 07, 09, 11 and 33–35](spec-v1-approved/DECISIONS.md).
- [Supabase Auth data](https://supabase.com/docs/guides/auth/managing-user-data).
- [Supabase RLS, grants and testing](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [PostgreSQL column permissions](https://www.postgresql.org/docs/17/sql-grant.html).
- [pgTAP documentation](https://pgtap.org/documentation.html).
