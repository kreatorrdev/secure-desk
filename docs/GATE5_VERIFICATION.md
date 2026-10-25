# SecureDesk — Phase 5 / Gate 5 final verification

**Phase 5 and Gate 5 completed locally — PASS, 8 October 2026.** Deployment and final security report belong to Phases 6 and 7. Approved v1.0 sources and [Gate 4](GATE4_VERIFICATION.md) remain unchanged.

## Completed tasks from approved roadmap

| Phase 5 task | Result and documentation |
| --- | --- |
| Private Storage, content validation and inherited parent permissions | PASS — [TICKET_ATTACHMENTS_PHASE5.md](TICKET_ATTACHMENTS_PHASE5.md) |
| Resolved/Closed, acceptance, seven-day reopen and exceptional Admin close | PASS — [TICKET_RESOLUTION_PHASE5.md](TICKET_RESOLUTION_PHASE5.md) |
| Idempotent periodic auto-close without Pending requests, system audit | PASS — [TICKET_AUTO_CLOSE_PHASE5.md](TICKET_AUTO_CLOSE_PHASE5.md) |
| Business/selected security audit, tenant/global view and 365-day retention | PASS — [AUDIT_PHASE5.md](AUDIT_PHASE5.md) |

Rules are from [DEVELOPMENT_ROADMAP.md](spec-v1-approved/DEVELOPMENT_ROADMAP.md), [DECISIONS.md](spec-v1-approved/DECISIONS.md), [PERMISSIONS_MATRIX.md](spec-v1-approved/PERMISSIONS_MATRIX.md), [USER_STORIES.md](spec-v1-approved/USER_STORIES.md) and [THREAT_MODEL.md](spec-v1-approved/THREAT_MODEL.md). No functions outside MVP were added.

## Gate 5 criteria and evidence

| Approved criterion | Executed check | Result |
| --- | --- | --- |
| Unauthorized attachment | Anonymous/Pending, peer Client, other company, unassigned Staff, revoked parent access in same session; direct Storage attempts and copied app download URL | PASS |
| Upload validation | MIME/extensions/signature/structures, mismatch, invalid content, empty/large file, exact 10 MiB boundary, forged/foreign-Origin/multipart and publish rollback | PASS |
| 15-min comment edit | Author only, server time, before/exactly at/after boundary, previous immutable revision and stale version | PASS |
| Edge around seventh day | 168 hours in UTC, −1 microsecond/exact expiry/+1 microsecond, request on time and unchanged original deadline | PASS |
| Pending reopen + concurrent scheduled job | Pending prevents auto-close; parallel sessions for Client/owner/Admin decisions and worker, lock/replay/idempotency, no Closed + Pending | PASS |
| Approved/rejected reopen | Approval → Assigned; rejection during window leaves Resolved, after window closes; owner or responsible Admin, terminal Closed | PASS |
| No logged secrets | Real server Storage key not in Git candidates, browser assets, server logs or audit metadata; audit DTO does not expose arbitrary metadata | PASS |

## Final automated matrix

| Set | Latest result |
| --- | --- |
| Full SQL/RLS regression | **2344 PASS / 21 files** |
| Attachment content validator | **36 PASS** |
| Tickets, comments, sharing, dashboard, all roles — real Auth/API/native HTTP | **684 PASS** |
| Ticket attachments, real content/Storage/native HTTP | **341 PASS** |
| Resolved/Closed, acceptance/reopen and native forms | **553 PASS** |
| Auto-close, separate concurrent sessions and real cron | **188 PASS** |
| Audit, Activity, retention, native forms and concurrent sessions | **293 PASS** |
| Sum of five real runtime matrices | **2059 PASS** |
| ESLint, TypeScript, production build Next.js 16.3.8 | PASS |
| Diff whitespace and final source check | PASS |

Numbers represent executed checks, not user count or HTTP requests. SQL fixture tests roll back in a transaction. Runtime trials retain fictional business data, removing their access at the end.

The first unified runner executed validators, SQL and four business runtime matrices. After extending native Activity checks the full audit matrix (293) was repeated separately; unified result records that subsequent call. Current check:gate5:local includes audit, so future runs do everything from one command. Production build was rebuilt after Next/React changes finished; later additions were tests and documentation.

## Audit, retention and real periodic jobs

Audit is immutable for application users. Organization Admin sees their current scope, Super Admin global; Staff/Client see only successful business Activity history of an authorized ticket. Changing assignment, shared access or profile state immediately changes API and native display in the same session. Pagination was tested at same timestamps, without duplication.

Audit retention period is **365 days**, revision 13 after real trial changes and restore of default value. Only active Super Admin can change it through versioned controlled function. Shortening requires UI confirmation. Tickets, comments and files are not deleted by this rule; very old Activity events may expire. Unauthorized change attempt records limited security event without request content.

Both local jobs are active and run as direct postgres, without business JWT:

| Job | Final schedule |
| --- | --- |
| securedesk-ticket-auto-close | Once per minute |
| securedesk-audit-retention | Daily at **03:15 UTC**; cron timezone GMT |

Retention job was temporarily accelerated for proof of real execution, then restored to this schedule. Two workers, concurrent period extension, strict expiry boundary, batch and rollback of entire removal on audit error were verified. Worker removes at most 10.000 audit rows per run. Completed run history older than 30 days is cleaned only for two SecureDesk jobs. While local database is off there are no runs; next appropriate job processes due candidates on resume. Backlog may require multiple batches.

## Browser review and boundaries

Existing user Super Admin session checked audit, company/event filters, 25+25 events without overlap, Activity and system actor. Mandatory retention confirmation blocks unconfirmed native submit; user policy was not changed in browser. Dark 390×844 and Light 1280×900 have no horizontal overflow; Theme restored to System, viewport reset. Browser warn/error in both reviewed tabs: **0**.

Different roles and their live native display were checked with real Auth/cookie/API/HTTP matrices. Full React login for every role was not manually repeated. Evidence does not replace complete accessibility/E2E/security review of Phase 6. Attachment runtime script emits existing non-blocking Node warning for TypeScript module; not an application error.

## Preservation of earlier data and removal of trial access

Full JSON content comparison by ID/hash confirms **2627 earlier rows in 23 business/Storage tables unchanged**. Protected **34 files** — previous 24 migrations, seven approved sources, Gate 4 and both env files — have the same SHA-256. Applied new migration 25 was not changed afterward:

**20261008190000_audit_retention.sql** — SHA-256 3d3bd9bf7975de5d47c1d7741fafd986c5565ea0d1d5a01b153418d3f0da85b3.

All 22 public tables have RLS. After attempts and successful matrices there are **398 profiles, 86 companies, 118 projects, 187 tickets, 74 attachments, 9 comments, 5 comment revisions, 113 reopen requests and 1597 audit rows**, with 25 migrations. This is development history from fictional trials.

New runs added 77 fictional accounts and 14 companies/projects. Their privileged roles, admin/staff assignments/permissions, active codes and Auth sessions: **0**. Fault/delay triggers and functions: **0**. Closed ticket with Pending request: **0**. One previous permanent user Super Admin remains. Scan covers 29 browser assets; real server key not found in checked sources/logs/audit.

No reset, cloud write, deployment, Git commit or push in this step.

## Fixed test attempt errors

First new SQL attempt expected three pagination comments, and global filter correctly returned four previous events too. Fixture check now selects exact trial company. Test sets its own initial period/version in rollback transaction, so it does not depend on earlier legitimate policy changes.

First audit HTTP attempt expected only HTTP redirect status. Next streaming response returned 200 with embedded redirect to login, without private content. Check now confirms destination and absence of private view. Application authorization was not changed because of that assumption. Extended matrix then passed all 293 checks.

Two older runtime scripts sent ever larger SQL text as command argument and exceeded Windows limit. Query is now passed through stdin, as in newer checks. Retained history was not deleted to pass tests. Initial logs and results remain among local evidence.

## Practical review and repetition

1. As your local Super Admin open [Audit history](http://127.0.0.1:3000/admin/audit). Select company or event ticket.auto_closed and read System actor, result and UTC time.
2. Compare [Closed system example](http://127.0.0.1:3000/organizations/a18868d3-2adb-4f7d-a805-bfa5b0c8bcb5/tickets/29262442-247a-4578-9d7b-7eb5168c63c0) and Activity with [Resolved + Pending example](http://127.0.0.1:3000/organizations/a18868d3-2adb-4f7d-a805-bfa5b0c8bcb5/tickets/54ed3c39-d741-4c8a-bc58-9f4022867f7f). Review does not require a new decision.
3. Read 365-day period and confirmation explanation on audit screen; no need to change it for verification.

Repeatable full command is **npm run check:gate5:local -- --create-demo**. Requires local Docker, database with applied migrations and app on 127.0.0.1:3000. Retains new fictional accounts and history; temporary privileges/sessions are removed. Does not use user password or hosted project. Repeated trial increases historical row counts.

Evidence: .tools/verification/gate5/suite-result.json, SQL/validator/runtime logs and five result files; .tools/verification/phase5-audit/ contains pre/post fingerprints, migration/dry-run, attempts, build/type/lint, integrity-result, final source check and browser captures. .tools/ is ignored in Git; this document records a readable summary.

**Next is Phase 6 — hardening, complete flows, accessibility and SECURITY_REPORT.md**, per approved roadmap. Gate 5 does not confirm finished production security or public deployment.
