# SecureDesk — first local Super Admin

This document records the earlier bootstrap step and its state at that time. Current backend review/retry, demo companies and total checks are in [REGISTRATION_REVIEW.md](REGISTRATION_REVIEW.md).

Date: October 6, 2026. Separate account the user registered and confirmed in local Mailpit was initialized as super_admin/active. Their first request is approved; five other accounts remained client/pending. Organizations, memberships and Staff/Admin assignments remain empty. No change to hosted database, migrations or approved specification. Gate 2 remains open.

## What this role means

Supabase Auth confirms identity and email. Business role is in profiles and user does not choose it in public registration. RLS enforces permissions from that verified state; it does not self-assign new role. Super Admin has global scope, while organization Admin works only in assigned organizations. Global Super Admin does not require Client membership.

This procedure is one-time development setup of first administrator, per Phase 2 of approved roadmap. It does not represent general approval API. Public registration still creates client/pending. Even signed-in Super Admin session has no direct UPDATE permissions for roles or requests; controlled administrative functions follow.

## User check

1. Open [Sign in](http://127.0.0.1:3000/login) and sign in with separate Super Admin email and your existing trial password. Password was not changed and is not sent in conversation.
2. On /account expect Account status: Active, Request #1: Approved and Your account has been approved. If page already open, refresh it.
3. Current page shows status. Administrative screen and processing others' requests come in next steps after database and authorization checks.

## Repeatable procedure for new local database

Local Docker/Supabase and already registered, email-confirmed separate account required. In existing database this step is completed; do not repeat or reset database to run again.

Example address in commands below is fictional. For new trial database replace with chosen registered address:

    npm run admin:bootstrap:local -- --email superadmin@securedesk.example.invalid

Default is preview: verifies eligibility and returns role/status without permanent change. Only explicit local apply performs assignment:

    npm run admin:bootstrap:local -- --email superadmin@securedesk.example.invalid --apply

Wrapper scripts/bootstrap-local-super-admin.mjs verifies project_id, exact local .env.local API/site, local Docker endpoint, project/workspace labels on supabase_db_secure-desk and local CLI API_URL. Does not accept cloud/db-url/linked arguments or DOCKER_HOST override. Privileged CLI status captured in memory only and not displayed. Does not ask for password or access token; does not use application service-role key.

Shared SQL from supabase/tests/support/local-super-admin-bootstrap.inc loads into pg_temp only for one owner psql session. That is how Supabase CLI test container would load it without copying implementation; .inc is not executed as separate test. No permanent function, new RPC or migration. SECURITY INVOKER, empty search_path, revoked EXECUTE for public/anon/authenticated/service_role and current_user=postgres check limit procedure. Standalone SQL does not prove locality: use wrapper, do not send helper to hosted database.

Transaction with locking verifies no Super Admin already exists, email identifies exactly one confirmed, non-anonymous, non-deleted/non-blocked identity, profile is client/pending, has only first pending unrouted request and no membership or Staff/Admin assignment history. Even existing inactive Super Admin closes this first setup.

Then profile changes together to super_admin/active and request to approved. reviewed_by points to initialized administrator, reviewed_at stores owner bootstrap procedure time. This is not public self-approval permission. Original application content remains unchanged. Business audit_logs not introduced yet; record of this development procedure does not represent completed production audit.

Advisory lock serializes setup attempts, and table/row locks protect against concurrent privileged changes during verification. Lock/statement timeout limit waiting. Error of any write rolls back both parts. If process stops without reliable result, first check account state; do not assume no commit occurred.

## Checks and boundaries

    npm run db:test
    npm run test:admin:guards
    npm run lint

396 SQL checks: PASS, including 44 new for this step. Cover preview, owner boundary and EXECUTE bans, nonexistent/unconfirmed/anonymous/blocked/deleted account, invalid profile, history/routing/decided request, prior memberships/assignments, atomic rollback when second write fails, successful setup, preserved submitted content, existing/inactive Super Admin, global RLS scope without tenant assignment and ban on direct escalation/review UPDATE. Parallel processes not separately simulated; serialization supported by DB locking, not stated as separate executed race test.

New SQL test file runs in BEGIN/ROLLBACK. For repeatable positive test temporarily changes existing Super Admin roles only within uncommitted transaction, then tests separate fixture accounts. Other sessions do not see that state. At end all changes revert; hash snapshots of profiles/requests and limited Auth identity, and organization row count, confirm unchanged stored data. No retained SQL fixture or permanent bootstrap function. Real repeated apply was rejected and state preserved.

Five Node tests: PASS. Missing address, cloud arguments, surplus arguments, SQL/shell characters and remote Docker host override rejected before DB operation. ESLint: PASS. Next.js code not changed in this step; previous TypeScript/build and 38 real HTTP form/session checks remain result of prior Auth step. User Super Admin login verified by user without sharing password.

Controlled backend approval/rejection/retry and consistent activation of new organization/first Client membership/General Support now verified: [REGISTRATION_REVIEW.md](REGISTRATION_REVIEW.md), 565 SQL and 31 Auth/RPC checks. Administrative and retry forms are next steps. Dashboard waits its order from roadmap.

Decision source: [approved roadmap, Phase 2](spec-v1-approved/DEVELOPMENT_ROADMAP.md), [role model](spec-v1-approved/DATABASE_SCHEMA.md) and [permissions matrix](spec-v1-approved/PERMISSIONS_MATRIX.md). Technical basis: [PostgreSQL locking](https://www.postgresql.org/docs/17/explicit-locking.html) and [functions/privileges](https://www.postgresql.org/docs/17/sql-createfunction.html).
