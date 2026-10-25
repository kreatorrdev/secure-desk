# SecureDesk — migrations and local trial database

Current — October 9, 2026: Phase 7 is underway. Added 26th migration and private quarantine bucket locally. 4204 SQL/RLS and 789 affected Auth/API/Storage/HTTP checks pass. The hosted database is viewed read-only; SMTP, migrations/deployment and public checks have not yet been performed. Plan and status: [DEPLOYMENT_PHASE7.md](DEPLOYMENT_PHASE7.md), [GATE7_VERIFICATION.md](GATE7_VERIFICATION.md).

## Current status — October 8, 2026

Phase 6 has been completed locally. There are 25 applied migrations, 22 public RLS tables and 4177 SQL/RLS checks — PASS. No reset or cloud recording was done. The current safe procedure, while preserving the existing base, is in [MIGRATION_RUNBOOK.md](MIGRATION_RUNBOOK.md); proofs/limits in [GATE6_VERIFICATION.md](GATE6_VERIFICATION.md). The sections below are history; the earlier db:reset example is not the procedure for this populated database.

## Previous status — October 6, 2026

Ten locally applied migrations, eight business tables and 841 SQL/RLS checks — PASS. The latest Manage Access read model/forms have 76 native web checks, lint, TypeScript and build — PASS. Details are in [ACCESS_MANAGEMENT_UI.md](ACCESS_MANAGEMENT_UI.md). Local Gate 2 passed: 841 SQL/RLS, 362 real API/cookie and 219 native web checks — PASS. The matrix/boundaries are in [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md); the hosted database has not been changed.

## Previous status — October 5, 2026.

This document records the previous backend step of October 5th. Current Next.js forms/cookie sessions, 38 HTTP checks and local application configuration are in [AUTH_SESSION_FLOW.md](AUTH_SESSION_FLOW.md). The number of fictional demo accounts increases with explicit hands-on checks. The first local Super Admin setup and its 396 SQL checks are documented in [LOCAL_SUPER_ADMIN.md](LOCAL_SUPER_ADMIN.md); that procedure does not add a migration. The fifth local review/retry migration is documented in [REGISTRATION_REVIEW.md](REGISTRATION_REVIEW.md). The sixth UI read migration and 606 SQL/61 web checks are in [REGISTRATION_REVIEW_UI.md](REGISTRATION_REVIEW_UI.md). The seventh own-retry migration and current 659 SQL/44 retry web checks are in [REGISTRATION_RETRY_UI.md](REGISTRATION_RETRY_UI.md).

Supabase CLI 2.119.0 is a correctly versioned development dependency. Four migrations are implemented locally: profiles, organizations_foundation, registration_requests_foundation and auth_registration_bridge. There are six tables and an automatic pending profile/first request at signup. Passed 352 pgTAP checks and 25 actual local Auth/API checks. The first migration was previously verified through a reset; next through migration up --local, without a new reset. Gate 1 passed. The sections below are a history of the earlier steps; the latest result is at the end.

The hosted and local PostgreSQL versions are 17.11 (hosted was confirmed by the user through SHOW server_version). The hosted database has not been changed, the CLI is not cloud-linked, and the application .env.local has used the local database since October 6, with the hosted configuration stored in the ignored .tools/env/hosted.env. Backend signup/email and Next.js form/cookie sessions are checked locally; controlled approvals/retries and the full matrix of subsequent flows are still pending. Gate 2 remains open. Fictional Client/Pending demo accounts and their first pending requests are retained; organizational tables are empty.

## What the tools do

- VS Code: we write and review files.
- Git: stores versions of code and SQL files.
- Supabase CLI: creates migration files, starts test environment, executes migrations and tests.
- Docker: runs local Supabase services in containers. Local services and data are separated from the hosted Supabase project.

The migration is a time prefixed SQL file in supabase/migrations/. Creating that file does not execute SQL. The local and hosted databases apply the same reviewed files, and each has its own record of applied migrations.

## Prerequisites and installation history

Checked: Windows 10 Pro 22H2, build 19045, about 12 GB RAM, 64-bit processor, virtualization and SLAT enabled. The user confirmed the ESU enrollment until October 12, 2027. After the completed restart, wsl --version shows 3.0.1.0, and wsl --status ends with code 0 and states Default Version: 2. Windows no longer reports CBS RebootPending. WSL prerequisite is ready; local Supabase is not started yet.

The user specifically requested that Docker and its data be on E:. Plan: E:\Docker\Desktop for the program, E:\Docker\Data for its WSL disk, E:\Docker\Installers for the installer; the project is in E:\portfolio\secure-desk. Windows system WSL components and standard small profiles/settings remain in Windows locations. No moving all of Windows or arbitrary user files.

Docker Desktop 4.94.0 Windows x86_64 installer is downloaded from official Docker release 241994, with verification of published SHA-256 and digital signature before execution. The download before the restart was incomplete; it was continued on E:. During preparation/installation, do not mark Docker Server as ready before actually checking.

The installation procedure uses --installation-dir=E:\Docker\Desktop and --wsl-default-data-root=E:\Docker\Data, --backend=wsl-2 and --no-windows-containers. The program's custom location uses an all-users installation with an administrative Windows requirement. The user has approved the continuation of the installation. The license is displayed to users in the Docker stream; is not automatically accepted by the --accept-license argument. Final locations and Docker Client/Server are checked after installation.


For now, the local PostgreSQL is on the generated default 17. Before the first real migration, check the version of the hosted database and match the major_version. We finalize the default Auth settings in the Auth step, including email verification and allowed callback addresses.

api.auto_expose_new_tables = false asks for explicit GRANT permissions; RLS will further limit the queues. This is only a local setting and does not change the cloud project. Seed is disabled until there is no test data viewed; a privileged user will not be created by public registration or public credentials in the seed file.

## Owner steps — one at a time, with result checks

1. Open Start → Settings → Update & Security → Windows Update and check the status of Extended Security Updates (ESU). Docker requires Windows in a supported servicing period. Windows version checking alone does not verify ESU; ask for confirmation from Windows Update before Docker installation.
2. When we clarify the support and agree to start the system step, save the work and open Windows PowerShell as an administrator. For a WSL environment only, without a separate Ubuntu installation, use:

       wsl --install --no-distribution

This includes the required Windows components and installs WSL. If Windows asks for a restart, the user starts it when she saves her work. Do not automatically restart from the utility. If a command reports an error, review its output before other commands.
3. After the restart, check:

       wsl --version

We expect the actual WSL version to be displayed; Docker requires at least 2.1.5. If a newer version is required, the next separate step is wsl --update, then recheck. WSL 2 architecture name and WSL package release number are different things.
4. Then install the official Docker Desktop for Windows x86_64, with WSL 2 backend, and open it. Match the location of its data with free space before the first download of Supabase images. Check that the docker version displays both Client and Server, and only then start the Supabase test database. Without the Docker Server part, the local database is not ready.

Steps 1–3 are complete: ESU confirmed by the user, WSL package installed, reboot completed and WSL status checked. The current entity is a Docker installation on E: by explicit user request. The cloud base has not been changed.

## Procedure after starting Docker

From a new VS Code terminal in the project folder:

    npm run supabase -- --version
    npm run db:start

The first run downloads Supabase images and requires network and free space. Local Studio defaults to http://127.0.0.1:54323. Local start does not require login to Supabase account. Do not copy the keys and passwords displayed by the local tools into Git or the conversation.

For a new real migration, only after reviewing its scope:

    npm run supabase -- migration new identity_foundation

This command just creates an empty numbered file. We fill it with SQL according to the approved DATABASE_SCHEMA.md, DECISIONS.md and PERMISSIONS_MATRIX.md; we arrange tables, permits and expected tests in advance. The example name is not an endorsement to implement the entire scheme in one step.

To verify repeatability in the local trial database:

    npm run db:reset
    npm run db:test

Reset deletes local trial data and reconstructs the database from migrations. Project reset and test have an explicit --local flag. We only use reset with test data; do not add --linked or --db-url. We run the test command when there are SQL tests; an empty test folder is not proof of security.

Each entity must have a positive allowed action test and a relevant negative test: anonymous/pending access, another user/organization, and an attempt to change a privileged role. Save reviewed SQL and tests to Git. Then:

    npm run db:stop

Stop saves local data by default; do not use --no-backup during this procedure.

## Transfer to hosted development project — later

Only after the local tests do we log in the CLI through the user's local terminal and connect the zljdbilnlwdjyoogzaz project. The personal token and DB password are entered only in a secure local procedure, without sending it to the conversation and without writing it into public application variables.

Check the target database, its version, existing tables and migration history. If there are already manual changes, resolve the baseline first; don't rewrite history automatically. Review the dry-run list, then apply verified migrations via the CLI. After that, all schema changes go through new SQL migrations; do not change the schema directly through the cloud Table Editor or SQL Editor. Dry-run shows the plan; does not verify the correctness of SQL or RLS.

Applied migrations are not redone. Corrections go through a new migration. Cloud reset is not part of this workflow.

## Decision source and documentation

The approved SecureDesk v1.0 documents in spec-v1-approved/ remain unchanged. This record elaborates the technical workflow of Phase 1; does not add business functions and does not validate Gate 2.

- [Supabase CLI installation](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [CLI commands](https://supabase.com/docs/reference/cli/introduction)
- [Docker and native runtimes](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes)
- [Docker Desktop requirements for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

- [Microsoft WSL installation](https://learn.microsoft.com/en-us/windows/wsl/install)
- [WSL options and checks](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)
- [Windows ESU and status check](https://www.microsoft.com/en-us/windows/extended-security-updates)

## Docker installation on E: — record before final reboot

Official Docker Desktop Windows x86_64 installer 4.94.0.241994 is fully downloaded in E:\Docker\Installers\DockerDesktop-4.94.0.exe. Published SHA-256 and local hash match: a9814e31049d66156477a86614e83365669677733014ec72f74229623ff3890a. Windows signature is Valid, published by Docker Inc. The verified installer is launched after an explicit user request, with the Windows administrator flow.

Result checks:

- Installation log states Installation succeeded.
- Windows uninstall registry confirms InstallLocation = E:\Docker\Desktop and DisplayVersion = 4.94.0.
- Docker Desktop.exe has ProductVersion 4.94.0.241994 and is in E:\Docker\Desktop.
- Docker CLI from E:\Docker\Desktop\resources\bin\docker.exe reports 29.8.2. This verifies CLI, not Docker Server.
- The installation log confirms the wsl-2 backend. Install-settings.json asserts wslEngineEnabled=true and wslDefaultDataRoot=E:\Docker\Data.
- The Docker WSL disk has not yet been created nor has the engine started; check its actual location after first boot, before Supabase download.

The installer turned on Microsoft-Hyper-V and marked the required restart in the log; CBS RebootPending exists again. We do not manually change Windows components or automatically restart the computer. The user should save the work, finish the installation window and restart, then together we start Docker Desktop and check Docker Client and Server. Any initial Docker contract remains visible to users; --accept-license is not used.

Windows system components, shortcuts, and small default settings remain in Windows locations. The big Docker program is on E: and its data disk is set to E:. We don't copy the Docker disk to Git. Cloud Supabase project, business SQL, Auth and RLS are not changed.

- [Docker 4.94.0 release](https://docs.docker.com/desktop/release-notes/#4940)
- [Published Windows checksum](https://desktop.docker.com/win/main/amd64/241994/checksums.txt)

## Final checks after restart — October 5, 2026.

- Docker Client and Server: 29.8.2; WSL backend is working, CBS restart is no longer pending.
- Real disks: E:\Docker\Data\disk\docker_data.vhdx and E:\Docker\Data\main\ext4.vhdx.
- Supabase start: exit 0; stop and restart from backup: exit 0.
- PostgreSQL 17.11; public tables: 0; auth users: 0.
- Local Studio: http://127.0.0.1:54323, HTTP 200; API: http://127.0.0.1:54321; database: port 54322; trial email interface: http://127.0.0.1:54324.
- Basic services with health checks are healthy. analytics.enabled=false disables the optional Logflare/Vector aggregate log view: Vector on Windows could not reach the Docker TCP endpoint. Do not include an unprotected Docker TCP port for that option. This does not change the future business audit.
- VS Code new terminals have Docker PATH at E: and project SUPABASE_HOME; the actual .env.local remains with the hosted public configuration. The CLI is not cloud-linked, and the hosted database has not been changed.

Docker shows the default published ports at 0.0.0.0 and IPv6 all addresses. Not to claim that services are available exclusively via loopback just because we open them via 127.0.0.1. The restriction of access from the network remains to be checked before entering private data; the current environment has no business data or users.

The next step is a user preview of the empty Table Editor, then a preview of the first migration according to the approved scheme. Before it, synchronize the PostgreSQL major version with the hosted database. SQL/RLS tests and Gate 2 have not passed, as they have not yet been implemented or executed.

- [Supabase local configuration](https://supabase.com/docs/guides/local-development/cli/config)

## The first practically verified SQL step

20261005183025_profiles_foundation.sql applied migration up --local. profiles_foundation.test.sql has 33 pgTAP checks and ROLLBACK test data. After the first PASS it was confirmed that profiles and auth.users have 0 rows; only then db reset --local --no-seed was done. Reset restored the table and permissions from the same file, and 33 checks passed again. An anonymous local REST request for profiles received an HTTP 401 / code 42501 with previous successful validation of the local public key (HTTP 200).

The user confirmed returning an empty .env.example. The detailed scope of this first table and temporary status-only access are in PROFILES_FOUNDATION.md. The applied migration does not change; the following extend the model of organizations, memberships, requests and controlled Auth/admin flow. The studio is a DB administration and does not represent a user RLS test.

## Second local migration — organizational reading

20261005191316_organizations_foundation.sql was deployed via migration up --local, output 0. Before deployment, the expected local baseline was confirmed: first migration, one table, 0 profiles and 0 Auth users. The first SQL applied was not rewritten.

The new organization_scopes.test.sql has 176 checks; together with the existing 33 profiles tests the result is 209 / PASS. The tests use SET LOCAL ROLE and a simulated JWT with a fictitious fixture, then ROLLBACK. After the tests, 0 rows in all five business tables, 0 Auth users, RLS enabled and both records in the local migration history were confirmed.

Read-only HTTP checks use a local public key loaded without rendering: Auth settings 200; anon reading each new table 401 / 42501; attempt to expose securedesk_private via Accept-Profile 406 / PGRST106. This is not a confirmation of the actual login/email/session flow. No reset was repeated for the new migration; the test was done on a local application, without a hosted target.

The model of membership episodes, read ranges and limits before controlled entries are documented in ORGANIZATION_FOUNDATION.md. The hosted database and application configuration have not been changed. The existing local network restrictions from the previous section remain.

## Third local migration — history of registration requests

20261005193034_registration_requests_foundation.sql was applied through migration up --local, output 0. Before that, a baseline of five tables, two migrations and 0 Auth users/profiles was confirmed. Previous SQL and tests have not been rewritten.

registration_requests.test.sql: 95 new checks. Full local SQL/RLS check: three files, 304 tests, PASS. Own statuses/reasons, history and one pending, column grants, isolation of competent Admin, prohibition of escalation and the fact that the approved request label does not grant organizational rights were checked. All fixture changes are reverted; after the test, 0 rows in six tables and 0 Auth users, request RLS and three migration history records were confirmed.

Read-only local HTTP: Auth settings 200, anon registration status SELECT 401 / 42501. Keys are not displayed. This is not proof of the actual signup/email/session flow. No reset was repeated for the third migration; hosted base and application .env.local are not changed. The scope and boundaries of the T-02 model are in REGISTRATION_REQUESTS.md.

## Fourth local migration — Auth bridge

20261005202205_auth_registration_bridge.sql was applied through migration up --local. Adds private validation/trigger functions and included AFTER INSERT trigger on auth.users. active_actor_role now requires a verified, non-anonymous Auth email. Business grants were not extended; previously applied migrations are not changed.

The new auth_registration.test.sql has 48 checks. Earlier test Auth accounts are now created through an included trigger with mandatory data, then get approved fixture states with a test owner write. Trigger does not turn off; No direct business INSERT permissions have been added to the Auth DB role. All fixture changes are returned through ROLLBACK. Four files, 352 SQL checks: PASS.

Locally enable_confirmations=true, minimum_password_length=8 and callback allowlist /auth/confirm are implemented with stop/start procedure while saving data. The callback page is not yet implemented. scripts/check-local-auth.mjs checked actual signup, email token, login and pending RLS with local public key: 25 checks, PASS. SDK sessions are not a test of the Next.js cookies/proxy flow. ESLint passed.

Final state: four migration history records, signup trigger included, 1 Auth account, 1 client/pending profile and 1 attempt 1/pending request. It is a fictional Demo Client for review; four organizational tables are empty. A new reset was not done. Hosted base and .env.local are not changed. Details are in [AUTH_REGISTRATION.md](AUTH_REGISTRATION.md).


## First local admin — development setup, no new migration

On October 6th, a separate confirmed test account was initialized by the local owner process as super_admin/active, along with the approved first request. The applied migrations remain the same four files. The helper exists only in the pg_temp session and leaves no public or private persistent RPC.

396 SQL/RLS and 5 Node security check setup: PASS. The repeated setup was rejected due to the existing Super Admin. After repeated SQL ROLLBACK tests, unchanged saved data and absence of fixture/privileged helper were confirmed. Other profiles remained client/pending; organizations and assignments are empty. Details are in [LOCAL_SUPER_ADMIN.md](LOCAL_SUPER_ADMIN.md). The hosted database has not been changed. Gate 2 is still waiting for controlled admin flows.


## Fifth local migration — registration review/retry and atomic activation

20261006120000_registration_review_workflow.sql was first tried with 169 new tests in the returned transaction, then applied through migration up --local. It adds the projects/audit_logs foundation and six controlled public RPC functions, with no new direct application table-write permissions. active_actor_role additionally rejects blocked/deleted Auth identity. The old four applied migrations were not remade.

Final result: six test files, 565 SQL / PASS; 31 actual Auth/RPC checks / PASS, including concurrent retry/approval. Hash checks of all eight business tables after ROLLBACK confirm the preservation of saved data. The four old Super Admin read statements now target their own fixture set, because the database has retained API instances. Fictitious API data and history are retained, the test reviewer is returned to client/pending, and all sessions of new API fixture accounts are closed. Five migrations were recorded. No resets, hosted entries or dashboards. Details are in [REGISTRATION_REVIEW.md](REGISTRATION_REVIEW.md).


## Sixth local migration — administrator read view

20261006143000_registration_review_screen.sql was applied through migration up --local, without reset. It adds its own active role accessor, scoped company selections/search and pending/reviewed queue with pre-pagination filtering and company verification data. SECURITY DEFINER functions have empty search_path, real authenticated/active Auth/role check and EXECUTE only for authenticated; direct board grants were not extended. The existing five migrations have not been modified.

41 new pgTAP checks give a total of 606 / PASS across seven files. Native Next.js review form/cookie sessions have 61 / PASS. ESLint, TypeScript and build are gone. A hash of all eight business tables confirms that the migration and SQL ROLLBACK checks preserve the saved data; web demo intentionally keeps separate fictitious accounts/companies/history and restores test rights. Six migrations were recorded, and the hosted database was not changed. Details are in [REGISTRATION_REVIEW_UI.md](REGISTRATION_REVIEW_UI.md).


## Seventh local migration — own retry draft and expected try protection

20261006170000_own_registration_retry.sql was applied by the migration up --local procedure. Adds two authenticated RPCs: own_registration_retry_details gives own immutable draft only to eligible rejected Client; resubmit_registration_form locks the actor/latest attempt, checks the expected UUID, and calls the existing atomic resubmit_registration. Empty search_path, actual Auth/role/state/assignment gate and anon/service EXECUTE bans; no new table grants or changes to the previous six migrations.

Eight test files, 659 SQL/RLS / PASS, with 53 new own/stale-attempt checks. The hash of all eight business tables after migration and SQL rollback confirmed the preservation of the saved data. The new Next.js custom form/history has 44 native HTTP/cookie checks / PASS. Seven record migrations, no resets and no hosted entries. Details are in [REGISTRATION_RETRY_UI.md](REGISTRATION_RETRY_UI.md).


## Eighth/ninth local migration — controlled access and scoped audit

20261006200000_controlled_access_management.sql and 20261006201000_role_revocation_scoped_audit.sql were applied by the migration up --local procedure after the rollback attempt. The eighth adds profiles access_revision, assignment revision/triggers and four authenticated-only RPCs for Staff/Admin approval, role change and company assignments. The ninth completes the company audit of each revocation caused by a role change. Previously applied migrations remain unchanged.

Nine test files: 778 SQL/RLS / PASS, with 119 new checks. Actual local Auth/RPC pool: 49 / PASS, including concurrent changes and unchanged sessions after revocation. All the old rows of the eight business tables are preserved, and the new trial privileges/sessions are revoked. Nine migration records. No resets or hosted entries. Forms/new scoped read model and final Gate 2 are still to come. See [ACCESS_MANAGEMENT.md](ACCESS_MANAGEMENT.md).


## Tenth local migration — Manage Access read model

20261006210000_access_management_screen.sql adds a private check of the selected company and two authenticated-only read RPCs for limited company choices and exact-email minimum target. Empty search_path, actor/Auth gates, scoped output, string bigint audits and anon/service EXECUTE bans. Direct board grants and the previous nine applied migrations remain unchanged.

Ten files: 841 SQL/RLS (63 new) — PASS, repeated and after actual web trial. The new admin form has 76 native Next.js form/cookie checks — PASS. Read migration and SQL rollback tests preserved all eight business tables; web trial only retains its new fictitious accounts/companies/history with terminated trial privileges and closed sessions. Ten migration history records, without resets and hosted entries. Details are in [ACCESS_MANAGEMENT_UI.md](ACCESS_MANAGEMENT_UI.md).


## Gate 2 confirmed — no new migration

The final 841 SQL/RLS check through ten files passed even after 25 new fictitious accounts/native trials. Pre/post hash verifies unchanged pre and post web rows after SQL rollback. New 362-check API/SSR-cookie matrix and 219 native web checks confirm positive/negative ranges of all roles and revocation. No applied migrations have been changed; ten records remain. Local Gate 2 has been passed, with the subsequent scope of Phase 3 documented. See [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md).


## Phase 7 — Hosted Deployment, October 9, 2026.

Separate securedesk-dev confirmed PostgreSQL 17.11, 0 public tables/Auth users/Storage objects and empty migration history. Standard psql and native CLI keyword DSN work with verify-full TLS and private password entry. Initial pg_dump custom copy saved (364.884 bytes, 559 items); native --dry-run --skip-vault returns the viewed 26 files without changing the database. The actual implementation reviewed passed at 13:33:50 UTC: all 26 builds are logged, and the catalog conforms to the locally validated schema, including 22 public + 1 private RLS tables, rights, 18 policies, 110 functions, 41 triggers, 3 private buckets, and 2 active business cron jobs (GMT/UTC). All five read-only SQL permission checks are PASS. No local user or data is transferred; final is 0 Auth users/profiles/organizations/tickets/Storage objects. Password not saved. The private helper, the hosted-migration-apply.json report, and the backup remain in the ignored .tools on E:, and the documentation remains locally. Fresh-empty-target helper should not be restarted without a fresh review. The actual hosted Auth/API/Storage/HTTPS flows, scheduled executions and isolated restores remain separate Gate 7 tasks.
