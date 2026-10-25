# Phase 5 — periodic automatic close

Completed locally October 8, 2026. This is the fourth small step of Phase 5. Private attachments and resolution/reopen forms already exist; now the database independently closes expired Resolved tickets without Pending requests. Audit review, configurable retention and final Gate 5 come next. **Gate 5 is not complete yet.**

## Rule from approved specification

Decision sources are unchanged [DECISIONS.md](spec-v1-approved/DECISIONS.md), [DEVELOPMENT_ROADMAP.md](spec-v1-approved/DEVELOPMENT_ROADMAP.md), [DATABASE_SCHEMA.md](spec-v1-approved/DATABASE_SCHEMA.md), [USER_STORIES.md](spec-v1-approved/USER_STORIES.md) and [THREAT_MODEL.md](spec-v1-approved/THREAT_MODEL.md). Before continuing, previous state was verified in [GATE4_VERIFICATION.md](GATE4_VERIFICATION.md) and [TICKET_RESOLUTION_PHASE5.md](TICKET_RESOLUTION_PHASE5.md).

Ticket must still be Resolved, company active, server time at least resolved_at + 168 hours, and there must be no Pending continuation request. Timely Pending remains protection even after seven days expire. Inactive company remains in limited historical view. Closed is final. Decision date and reason are stored; audit has system actor, without a fake administrator account.

## How the local job works

Migration **20261008180000_ticket_auto_close.sql** enables the already available pg_cron extension and installs one job **securedesk-ticket-auto-close** that runs once per minute as DB owner postgres. No new API endpoint, public scheduler RPC, webhook or key was introduced. DB extension is managed in this Supabase environment and its owner is supabase_admin; the scheduled job itself uses postgres.

Worker is SECURITY INVOKER in unexposed securedesk_private schema. Only direct postgres session without business JWT is allowed. Anonymous, authenticated, service_role and business Super Admin cannot call the worker or manage the cron schema. RLS and ordinary business RPCs remain for user actions.

Job selects oldest candidates and closes at most 100 tickets per run. Argument is limited to 1–1000; search scans at most ten times that many candidates. Transaction advisory lock prevents two workers overlapping. Company is locked, then ticket, same order as user decisions. SKIP LOCKED skips busy row, so next run can check it again. After locking, status, server deadline and Pending condition are read again. Maximum duration of scheduled call is limited to 30 seconds.

One successful transition writes Closed, server closed_at and English close_reason. In the same transaction ticket.auto_closed audit is created with actor_user_id=null, actor_kind=system, previous version, original deadline and reason. Repeated run does not change Closed ticket nor create second audit. Audit error rolls back entire batch, including previously processed tickets from that batch.

Seven days means 168 hours and boundary includes exact expiry moment. Worker never closes before deadline. Job itself checks once per minute: busy rows, larger candidate count or stopped local database can delay close. When computer or Docker/database are off, local job does not run; on resume it checks then-due tickets. That is local installation, not applied to hosted Supabase.

Technical sources: [Supabase Cron quickstart](https://supabase.com/docs/guides/cron/quickstart), [pg_cron](https://github.com/citusdata/pg_cron) and [PostgreSQL 17 locking](https://www.postgresql.org/docs/17/explicit-locking.html). For changing active job state use supported cron.alter_job; no permission expansion on managed tables.

## Final checks

| Check | Result |
| --- | --- |
| New migration and transactional SQL test before apply | 42 — PASS |
| Full SQL/RLS regression after 24th local migration | 2286 / 20 files — PASS |
| Real Auth/API/cookie/native HTTP and separate concurrent DB sessions | 188 — PASS |
| Real periodic execution, without manual close of demo tickets | PASS; recorded in cron.job_run_details |
| Browser in existing user Super Admin session | Closed with system reason; second ticket Resolved + Pending |
| Browser warn/error | 0 in both trial tabs |
| Previous business/Storage rows, full JSON ID/hash | 2500 / 23 tables unchanged |
| Previous 23 migrations, seven approved sources, Gate 4 and both env files | 33/33 SHA-256 unchanged |
| Trial privileged roles, assignments, sessions, active codes, fault/delay objects | 0; one previous permanent Super Admin |
| Closed with Pending request | 0 |
| Server secret in Git candidates and 27 existing browser build assets | Not found |
| Lint of new test script and diff check | PASS |

SQL covers grants, private scheduler, exact boundary −1 microsecond/expiry/+1 microsecond, DST, null times, invalid batch, inactive and other statuses, Pending protection, idempotency, system audit, whole batch rollback and remaining batch handling. Fixture SQL transaction is rolled back.

Real runtime uses email-confirmed local Auth accounts, user RPC calls and installed SSR cookie adapter. Anonymous plus 11 roles/states attempt public/private scheduler RPC and copied native pattern with forged auto_close intent; all rejected. Owner Staff does not get direct Closed status right.

Separate sessions verify locked ticket and company, two concurrent workers, worker winning over old native Client acceptance form, real Client acceptance transaction winning, Pending approval/rejection with worker and timely real Client request that stays Pending after deadline. Targeted late audit error on second new ticket rolls back both batch tickets and their audits. No Closed + Pending, fake human actor or duplicate audit event.

For last probe a new fictional ticket was created whose 168-hour deadline expires three seconds later; real periodic execution was waited for. Closed **October 8 at 18:01 UTC**. Concurrent historical Pending demo stayed Resolved. Native Client page shows system reason and no acceptance/request forms. Browser separately confirms both views in existing user SA session; logins for all roles through browser were not repeated.

No Next/React code changes in this step. Therefore previously successful TypeScript/production build and responsive/theming flow were not repeated; new script was linted. Previous browser build has 27 assets and does not contain real server Storage secret.

## Test attempt error and preserved history

First runtime probe stopped at 89 checks: test attempted direct UPDATE on cron.job, and managed extension does not allow it for postgres role. Test was fixed to use cron.alter_job. Business worker and applied migration were not changed due to that error. First attempt left 11 fictional accounts, two companies and two General Support projects, without new tickets. Its trial roles and sessions were removed. First result/log remain saved.

Successful probe added another 11 accounts, two companies, two projects, 13 tickets and four reopen requests. Fictional history remains; trial Admin/Staff/SA reverted to Client, temporary SA is Pending, assignments and sessions terminated. Therefore demo owner after verification is not available for approval until real active Staff is assigned. These examples are for review; during verification approval and owner replacement used real temporary sessions.

Final state: **24 migrations; 321 profiles, 72 companies, 104 projects, 123 tickets, 47 attachments and 74 reopen requests.** All previous data, env and approved/Gate 4 documents unchanged. No reset, cloud writes, Git commit/push or new permanent privileged credentials.

## Practical comparison

1. Open [auto-closed ticket](http://127.0.0.1:3000/organizations/a18868d3-2adb-4f7d-a805-bfa5b0c8bcb5/tickets/29262442-247a-4578-9d7b-7eb5168c63c0). Read Closed time and reason; Solution & continuation explains that close is final.
2. Open [ticket with Pending protection](http://127.0.0.1:3000/organizations/a18868d3-2adb-4f7d-a805-bfa5b0c8bcb5/tickets/54ed3c39-d741-4c8a-bc58-9f4022867f7f). Deadline passed, but ticket is still Resolved and request Pending. For comparison read only; decision not required.
3. Explain to yourself the difference: without Pending request due ticket is closed by system; with Pending request owner or responsible Admin decides first. On late rejection close belongs to that human decision.

Evidence is in ignored `.tools/verification/phase5-autoclose/`: initial worktree/protected/DB fingerprints, SQL dry-run and final log, local migration, runtime-attempt1 and successful runtime-result, integrity-result, database-after, practice/fixtures and browser-closed/browser-pending screenshots. Repeatable local probe is `npm run check:tickets:autoclose:local -- --create-demo`; retains new fictional data and requires already active local job and application.

Next small part is tenant-scoped audit review and its retention with default 365 days; then final Gate 5 verification. Retention applies to audit records and is not automatic deletion of tickets or comments. Operational cron run-history is separate evidence whose management should be aligned in the next step.

## Subsequent Phase 5 completion — October 8, 2026.

Audit/Activity and retention are implemented and verified; **Phase 5 and local Gate 5 are complete**. Final evidence for the whole phase is in [GATE5_VERIFICATION.md](GATE5_VERIFICATION.md), and the last part in [AUDIT_PHASE5.md](AUDIT_PHASE5.md). Previous numbers in this document remain historical result of the auto-close step.

Latest full matrix has 2344 SQL/RLS checks, 2059 real runtime checks and 36 validator checks. Auto-close passes all 188 again; both local jobs are active. Retention runs daily at 03:15 UTC with 365-day period, and operational completed cron records older than 30 days are cleaned only for two SecureDesk jobs. That resolved the previously noted open run-history item. Tickets and comments are not deleted by audit retention.
