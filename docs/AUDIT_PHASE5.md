# Phase 5 — audit, ticket activity and retention period

**Status: completed locally, October 8, 2026.** Final evidence for whole phase in [GATE5_VERIFICATION.md](GATE5_VERIFICATION.md). Sources are unchanged [DECISIONS.md](spec-v1-approved/DECISIONS.md), [USER_STORIES.md](spec-v1-approved/USER_STORIES.md), [PERMISSIONS_MATRIX.md](spec-v1-approved/PERMISSIONS_MATRIX.md), [THREAT_MODEL.md](spec-v1-approved/THREAT_MODEL.md) and [roadmap](spec-v1-approved/DEVELOPMENT_ROADMAP.md).

## What the user sees

On Account page Admin and Super Admin have **Audit history**. Organization Admin reads events of their currently assigned companies, including their inactive history. Super Admin has global view and events without company. Revoking assignment removes access immediately, in same session. Staff, Client, Pending and anonymous user have no administrative audit.

Filters choose company, success/failure and exact event name. Company search limited to allowed scope. Shows 25 events per page; cursor pagination uses time and unique ID, so same moment multiple events does not skip or duplicate. Loading, empty and error displays exist.

**Activity** on ticket shows only successful business events of that ticket and its ready attachments. Same parent authorization applies to Client author, approved shared Client, Staff owner/collaborator and responsible Admin. Does not show others' tickets or security events from administrative audit. Revoking ticket access also removes access to its activity.

UI shows actor, event, outcome and UTC time. System job has **System**, without fake human actor. Display does not return email addresses, organization codes, passwords, keys, arbitrary JSON or free text from audit metadata. Reasons and business record content remain in their authorized displays. Server returns limited DTO with allowed statuses, priorities, closure type and numeric retention details; React text displayed as text.

## Retention by example

Audit remembers **who did what and when**. By default we keep it **365 days**. If Ana creates ticket today, event remains during retention period; ticket itself, comments and files not deleted by this rule. Activity uses same audit events, so very old activity may expire although ticket remains.

Only active Super Admin changes period. Technical boundary for MVP is whole number **1–3650 days**. Form requires confirmation that shortening may permanently remove older evidence on next job. Extension does not restore already removed history. Settings version and actor access version prevent stale form or lost role from overwriting newer state. Two simultaneous different writes have one winner; submitting same value does not create second event.

Settings change and audit.retention_changed are one transaction. Unauthorized business change attempt records limited security.audit_retention_denied: without entered content, at most one event per actor per minute. Global event visible only to Super Admin. This is evidence of selected security events, not complete log of all rejected RLS requests.

## Database and periodic job

Migration 25, **20261008190000_audit_retention.sql**, adds RLS table platform_settings, controlled read/change RPCs, limited audit display and private worker. Users have no direct INSERT/UPDATE/DELETE on settings, nor right to modify/delete audit rows. Business Super Admin also has no direct right to start worker.

**securedesk-audit-retention** runs daily at **03:15 UTC** in local database; cron.timezone is GMT. Deletes only audit rows strictly older than server time minus valid number of 24-hour days, at most 10.000 per run. Locked rows skipped for next check; transactional lock prevents worker overlap. Shared lock on settings aligns job with period change, so simultaneous extension does not use stale threshold.

Exception to audit immutability allowed only to direct postgres session without business JWT, through private SECURITY INVOKER worker and transaction-controlled threshold. Injecting internal flag with application JWT does not grant delete right. Removal records audit.retention_purged, actor=system, period and row count. If that audit fails, entire purge rolls back. Worker has no app EXECUTE grant, not in public API schema, and scheduled call has 30 second timeout.

Operational cron.job_run_details has separate rule: worker removes completed records older than **30 days only for two SecureDesk jobs**. Does not change evidence of other jobs. That is not business audit retention.

While computer or local database off, jobs do not run. On resume auto-close checks due tickets on next minute run, and retention on next daily run. Larger backlog may require multiple batches. Hosted Supabase not changed.

## Checks and repetition

- New audit/retention SQL module: **58 PASS**; full regression: **2344 PASS / 21 files**.
- Real local Auth, RPC, SSR cookies and native HTTP audit module flows: **293 PASS**. Cover scope, direct writes, stale/forged/foreign-Origin forms, pagination, immediate access revocation, two period changes, two workers and rollback on audit error.
- Real cron execution confirmed by temporary acceleration of retention job only, then schedule restored to daily 03:15 UTC. Concurrent period extension from 365 to 366 prevented premature removal; final period **365**.
- Browser existing user Super Admin session checked audit/Activity, filters, pagination, mandatory form confirmation, Dark 390×844 and Light 1280×900 without horizontal overflow. Theme restored to System, viewport reset. Browser warn/error: 0 in both reviewed tabs. Different roles verified by real sessions and native HTTP responses; not all manually signed in through browser.
- ESLint, TypeScript and production build: PASS. Real server Storage secret not found in Git candidates, 29 browser assets, server logs or audit metadata.

Repeatable local probe is **npm run check:audit:web -- --create-demo**, with local Docker enabled, applied migrations and application at 127.0.0.1:3000. Creates and retains 11 new fictional accounts, two companies and trial business history; restores period/schedule and revokes temporary privileges, assignments, codes and sessions. Does not use real user passwords. Whole phase verified through **npm run check:gate5:local -- --create-demo**.

Evidence in ignored .tools/verification/phase5-audit/ and .tools/verification/gate5/. Real probes intentionally retain fictional history; total row counts increase on repetition. Phase 6 continues with systematic hardening, complete flows, dependency scan and writes SECURITY_REPORT.md.

Technical sources: [Supabase Cron](https://supabase.com/docs/guides/cron/quickstart), [PostgreSQL 17 trigger rules](https://www.postgresql.org/docs/17/trigger-definition.html) and installed Next.js 16.3.8 documentation in node_modules/next/dist/docs/.
