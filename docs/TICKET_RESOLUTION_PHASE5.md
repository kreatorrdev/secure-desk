# SecureDesk — Phase 5, step 3: Resolved/Closed flow

**October 8, 2026: database, RLS, forms and real Auth/HTTP/browser checks for step 3 completed locally. Phase 5 continues; periodic job and Gate 5 remain.**

Private ticket attachments were completed in [TICKET_ATTACHMENTS_PHASE5.md](TICKET_ATTACHMENTS_PHASE5.md). The step covers database, RLS, solution acceptance, reasoned reopen, owner/Admin decision, exceptional administrative close, history and scoped work queue. Database and later application checks are recorded separately below. Periodic auto-close job remains a separate part of Phase 5.

## Source of rules and baseline state

Decisions come from unchanged approved sources: [DECISIONS.md](spec-v1-approved/DECISIONS.md), decisions 21/22/43/58/59/62 and latest alignment; [PERMISSIONS_MATRIX.md](spec-v1-approved/PERMISSIONS_MATRIX.md), original Client/owner/Admin and shared participant; [DATABASE_SCHEMA.md](spec-v1-approved/DATABASE_SCHEMA.md), reopen table and one Pending; [USER_STORIES.md](spec-v1-approved/USER_STORIES.md), US-28 through US-33; [THREAT_MODEL.md](spec-v1-approved/THREAT_MODEL.md), T-12/T-13/T-14.

Baseline state: 21 migrations, 266 profiles, 62 companies, 94 projects, 87 tickets and 47 attachments. Before changes SHA-256 of all earlier non-ignored files and full JSON ID/hash rows from 22 business/Storage tables were saved. Earlier uncommitted work was preserved.

## Business flow by example

Owner marks Ana’s ticket **Resolved**. Database sets `resolved_at` per server time. Ana, as original `client_user_id`, may accept the solution and get final **Closed**, or before 168 hours expire send a reasoned request to continue the same issue. Shared Client participant and Staff who opened the ticket on someone else’s behalf do not have these Client authorities.

| Action | Ticket after action | Reopen request |
| --- | --- | --- |
| Ana requests continuation within deadline | Resolved | Pending |
| Owner or responsible Admin approves | Assigned | Approved |
| Rejects while original deadline holds | Resolved, same resolved_at | Rejected |
| Rejects after original deadline expires | Closed, same resolved_at | Rejected |
| Ana accepts solution without Pending request | Closed, final | No new request |
| Responsible Admin exceptionally closes with reason | Closed, final | No Pending request |

Timely submitted request may await decision even after seven days; approval is still allowed then. Rejection does not start a new deadline. If new work leads to Resolved again, a new resolution timestamp and new cycle arise while old history remains.

## What the migration added

New, twenty-second migration is `20261008150000_ticket_resolution.sql`. Previous 21 migrations remained unchanged. Migration does not close any existing ticket and does not add trial business rows.

`ticket_reopen_requests` stores parent/company, original client, reason, status, revision, snapshot of original `resolved_at`, membership episode and ticket revision, actor/decision time and rejection reason. Composite parent FK and identity trigger prevent foreign company or replacement of original Client/reason/snapshot. One partial unique index allows only one Pending per ticket. Processed decision is final; new attempt is new ID/row.

Application users have no direct INSERT/UPDATE/DELETE, including business SA and service role. RLS and DTO show reason/decision only to original client and current decision-maker roles that still read parent. Collaborator and approved shared Client may read ticket, but do not get private reopen history or decision right. Internal membership/ticket snapshot has no SELECT grant nor appears in DTO.

| RPC | Purpose |
| --- | --- |
| `request_ticket_reopen` | Original active Client, Resolved-only, reason up to 2000 characters, server deadline, fresh ticket/access/scope and submission ID. |
| `review_ticket_reopen` | Current owner Staff or responsible Admin; atomic Approved/Rejected decision and ticket change; rejection reason up to 1000 characters. |
| `close_resolved_ticket` | Original Client acceptance or scoped Admin-only exception with reason up to 2000 characters; Resolved only. |
| `ticket_resolution` | DTO deadline/UTC server time, live capability flags and history 25 + lookahead, with bounded offset. |

All mutations first lock real actor/scope and parent ticket, verify current membership and versions, then write change and audit together. As before, browser hidden fields are not proof of rights. Audit stores real actor, decision type, request ID, version and original deadline; reason is business data and is not copied into raw audit metadata.

## Documented technical choices

- **Deadline:** exactly 168 hours from `resolved_at`, independent of session timezone/DST. Choice of time interval and server clock matches [PostgreSQL 17 date/time documentation](https://www.postgresql.org/docs/17/functions-datetime.html), which distinguishes calendar day from 24 hours during DST change. Interval is `[resolved_at, resolved_at + 168h)`: at the boundary itself new request is no longer allowed. Server reads `clock_timestamp()` after locking; waiting on lock does not extend deadline. No browser-controlled time.
- **Pending and close:** Pending reopen is handled first, then acceptance or exceptional close. This guard prevents Pending request remaining over Closed ticket; it does not introduce additional Cancelled status or Client review privilege. Sources explicitly describe Pending as ticket in Resolved, but do not prescribe separate cancel flow.
- **Unavailable owner:** Admin on approval may choose currently available Staff owner from same company. Without valid owner approval is rejected. Owner Staff cannot alone choose another owner. Promoted collaborator is removed from additional collaborator role in same transaction.
- **Membership change:** request remembers concrete Client membership episode. Transfer/break and return do not revive old Pending approval. Owner/Admin may reject such request with reason; old history remains.
- **Repeated request:** same ID/payload/episode/resolution snapshot returns existing record without new audit; changed payload or new resolution cycle with old ID is rejected. Closed does not accept replay as new reopen. Close/review of repeated stale forms are rejected and do not create second event.
- **Acceptance deadline:** acceptance verifies ticket is still Resolved; strict seven-day deadline limits submitting new reopen request. Late still-Resolved ticket will be handled by next periodic job part.

## Checks of database micro-step before forms

| Check | Result |
| --- | --- |
| New trial migration + SQL test in rolled-back transaction | 234 — PASS |
| Final full SQL/RLS regression after local migration | 2212 / 18 files — PASS |
| Earlier data: full JSON ID/hash, no omitted keys | 2015 rows / 22 tables unchanged |
| Earlier non-ignored file before documentation | None changed |
| Protected: 21 earlier migrations, seven approved sources, both env files | 30/30 unchanged |
| Permanent new fixture Auth/business rows | 0 |
| Reopen requests after step | 0; new empty table |
| Permanent SA and SQL audit fault trigger | One previous SA; 0 fault triggers |

New test `supabase/tests/ticket_resolution.test.sql` has 15 states/roles and explicit anonymous call. Verifies grant/RLS/DTO privacy, original Client vs on-behalf creator/peer/collaborator, owner/Admin scope, malformed/stale operations, reason and bounds, interval −1 second/exact boundary/+1 second, DST, server resolution timestamp, pending/replay/new attempt, early/late rejection, after-deadline approval, terminal Closed, new resolution cycle, owner fallback, revoke/regrant and Client membership episode. Pagination and internal snapshot are separately verified.

Intentionally caused late audit error rolls back request, acceptance, admin close, approval and late rejection together with ticket. SQL fixture is in transaction rolled back at end. First trial pass found ambiguous `reason` variable name in decision UPDATE; variable was renamed before applying migration. Then trial and final sets succeeded. First log with error was saved, and previous data was not changed.

In previous database micro-step SQL tests simulate JWT within database; they are not substitute for real Auth/cookie/API/native form matrix. No new Next/React code in this micro-step, so new lint/typecheck/build or browser upload/workflow trial were not run. Read-only browser review of local Studio confirms new empty table, zero rows and one RLS policy; screenshot is `reopen-table.jpg`. This is not application workflow test. Real concurrent sessions and scheduled job race were not yet executed. No periodic job was installed nor manually run on existing tickets.

Evidence is in ignored `.tools/verification/phase5-resolution/`: initial worktree/protected/DB fingerprints, `sql-dry-run-attempt1.log`, successful `sql-dry-run.log`, `migration-local.log`, `sql-after.log`, `database-after.json` and `foundation-result.json`.

After database micro-step: **22 migrations; 266 profiles, 62 companies, 94 projects, 87 tickets, 47 attachments, zero reopen requests.** No reset, hosted writes, commit/push or change to approved sources. Gate 4 historical document remains unchanged.

## Continuation of step 3: forms and real sessions — completed locally

Added **Solution & continuation** on ticket detail: **Accept solution & close**, **Request continuation**, owner/Admin **Approve continuation / Reject continuation**, administrative **Close with administrative reason** and paginated history. Closed has explicit message that it is final and has no these forms. All application texts are English; documentation explanations are in English.

Deadline is shown in UTC with seconds, per server. Capability flags come from `ticket_resolution`; each decision is re-checked in user session. New Action branch rejects duplicates, missing and extra business fields, including attempt to add actor or status. Verifies UUID/versions, reasons up to 2000 characters, or rejection up to 1000, and preserves reason text on error. Hidden values are not proof of rights. No new privileged business client.

With Pending request neither original Client acceptance nor Admin exception have button. Decision is required first. Admin on approval may choose currently available Staff owner from company, with existing people search/pagination. If owner is no longer available, approval is rejected; responsible Admin may choose replacement. Role or assignment change applies immediately in already logged-in session.

Migration **20261008160000_ticket_reopen_queues.sql** adds `reopen` queue on existing bounded `ticket_list` and dashboard count **Pending continuation requests**. Queue contains only Resolved tickets with Pending request over which user has decision right: current owner Staff or responsible Admin. Collaborator may read parent ticket, but that is not decision right; Client does not have this work queue. New migration does not overwrite existing business rows. Before apply a transactional trial that rolls back passed.

| Final check | Result |
| --- | --- |
| New queue SQL/RLS test | 32 — PASS |
| Full SQL/RLS regression after 23rd migration | 2244 / 19 files — PASS |
| Real Auth/API/cookie/native HTTP forms | 553 checks — PASS |
| ESLint, TypeScript, production build | PASS; additional lint of new test script without warnings |
| Browser: existing user Super Admin session | Rejected approval without available owner; required reason; successful rejection; successful exceptional close by keyboard |
| Responsive: System/Light, 390×844 and 1280×900 | No horizontal overflow; viewport restored, Theme unchanged |
| Browser warn/error after practical flow | 0 |
| Earlier business/Storage data | 2015 full JSON ID/hash rows / 23 tables unchanged |
| Earlier migrations, approved sources and both env files | 31/31 SHA-256 unchanged |
| Real server Storage key in Git source candidates / browser assets | Not found; 27 build assets checked |
| Privileged fixture roles/assignments/sessions and fault triggers | 0; one earlier permanent SA |

`scripts/check-ticket-resolution-web.mjs` uses local, actually registered and email-confirmed accounts, Supabase Auth and installed SSR cookie adapter. Matrix covers anonymous + 11 roles/states. Ordinary business decisions use their authenticated RPC calls; DB owner is used only for bootstrap of new fictional accounts, historical deadline fixture rows, targeted audit error and removal of test privileges. Script rejects cloud/API/Docker/workspace target that is not this local project. Passwords and tokens are not exported.

Verified were copied original Client/owner/Admin forms, forged/duplicate/missing fields, foreign Origin, stale/opposite decision, role/object scope, direct-write bans, private history and reason escaping, same submission ID without duplicate audit, new attempt after rejection and new resolution cycle. Tests cover native acceptance and final Closed, early/late decision, timely Pending approved after deadline, real owner revoke in same cookie session, Admin replacement and removal of redundant collaborator, and 27 attempts across two history pages.

Three concurrent probes use separate real HTTP RPC requests: request/request, owner approval/Admin rejection and request/acceptance. Each leaves one allowed change; no Closed ticket with Pending request. Those are not browser-dispatch parallel actions: Next serializes actions of one client dispatcher. Periodic job and job/mutation race remain for next part.

Late audit fault on new fictional ticket in native HTTP probe rolls back request, ticket and audit count together. Final comparison of actors in all request/decision audit events with real requester/reviewer identities shows zero deviation. Browser separately executes real React form only in existing Super Admin session; multi-role browser login and Client acceptance click were not separately repeated in browser. They are covered by real native HTTP forms, API and SQL matrices. Dark display was not repeated in this small step.

### Discovered test errors and preserved history

First Auth/HTTP probe stopped at 155 checks: test audit trigger targeted request ID, while audit target is ticket ID. That is test error, without change to business RPCs; successfully created fictional Pending row remained in history. Second probe stopped at 530 checks: native HTML contains streaming comments between parts of pagination link text, so check of whole text string did not match display. Check now uses real page link and count of rendered cards.

On final hash comparison of second probe large SQL query with earlier audit IDs hit Windows process argument limit. Queries now go through standard input to `psql`, without shell command interpolation. Roles/assignments/sessions were already removed; independent final check covers all three attempts and confirms zero remaining privileges. Third full probe passed 553 checks. Earlier business rows unchanged; failed probes were not deleted.

Three probes total added **33 fictional accounts, six companies, six General Support projects, 23 tickets and 70 reopen history requests**. Existing attachments and Storage content were not changed. All trial Staff/Admin/SA accounts reverted to Client, temporary SA is Pending, assignments and create-project privileges terminated, sessions logged out. Therefore fictional owner after test is no longer available for approval; demo serves for review and rejection, while approval/replacement were verified during real Auth matrix.

After browser rejection and exceptional close of separate trial ticket: **23 migrations; 299 profiles, 68 companies, 100 projects, 110 tickets, 47 attachments and 70 reopen requests.** No reset, cloud writes, Git commit/push or change to Gate 4/approved documents.

Evidence is in ignored `.tools/verification/phase5-resolution-ui/`: initial worktree/protected/DB fingerprints, queue dry-run and migration/SQL logs, lint/typecheck/build, three Auth/HTTP results, integrity/DB-after snapshots, browser screenshots and `practice.json`. Server log has intentionally caused foreign-Origin errors from negative tests; those are not unexpected browser errors. Local application remains available on port 3000.

### Your practical trial

1. With your existing Super Admin account open [fictional Pending request](http://127.0.0.1:3000/organizations/e52b630a-1593-4bf7-910d-b2c4c6ed2818/tickets/6fb9d435-0ce7-4587-adf7-bf2172e7050b).
2. In **Solution & continuation** read reason and deadline. No Client acceptance button: it belongs to original Client.
3. For this trial write fictional reason and click **Reject continuation**. While original deadline holds, request becomes Rejected and ticket stays Resolved with same date. History keeps decision.

Example is fictional; no client data. Previously a separate browser ticket was rejected then exceptionally closed and can be [viewed as Closed](http://127.0.0.1:3000/organizations/e52b630a-1593-4bf7-910d-b2c4c6ed2818/tickets/b9e2144e-1edc-45d8-90b9-405290423c07).

Next small part is idempotent periodic auto-close: closes only still-Resolved tickets after server deadline, without Pending requests. Then remain job race/time checks, audit view/365-day retention and final Gate 5. **Gate 5 is not complete yet.**


### Subsequent continuation: periodic job — completed locally

Description above records state of this earlier micro-step. Next auto-close and its real scheduled/concurrency checks are now complete: 24th migration, 2286 SQL/RLS and 188 real Auth/native HTTP/concurrent checks. Real periodic job closed new due ticket and preserved Pending protection of another. Evidence, practical examples and final state are in [TICKET_AUTO_CLOSE_PHASE5.md](TICKET_AUTO_CLOSE_PHASE5.md). Next are audit review/retention and Gate 5; Gate 5 is not complete yet.
