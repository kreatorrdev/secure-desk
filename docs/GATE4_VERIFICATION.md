# SecureDesk — Phase 4 / Gate 4 final verification

**Result: GATE 4 PASSED LOCALLY — 8 October 2026. Phase 4 is complete within the approved local MVP scope: all seven development tasks are done.** The roadmap has five main items; for implementation and learning they were split into seven tasks. Next is Phase 5, private ticket attachments and Resolved/Closed flow.

## Four mandatory Gate 4 conditions

| Condition from approved roadmap | Evidence | Outcome |
| --- | --- | --- |
| Negative IDOR between companies A/B | SQL role/RLS matrix; authenticated API and real HTTP attempts with another ticket ID, wrong tenant and copied form. Parent and child data stay unavailable. | PASS |
| Negative IDOR between two Clients in the same company | Peer does not see ticket, comments or revisions before explicit sharing approval. Pending request does not grant access. Dashboard counts follow the same scope. | PASS |
| Staff does not see unassigned ticket | Org assignment and on-behalf authorship alone do not grant ticket read. Only current owner/active collaborator gets access; revoking assignment and changing owner immediately change scope. | PASS |
| Audit actor for on-behalf actions is correct | Client identity and real Staff/Admin creator are separate on the ticket; audit actor comes from verified session. Spoofed actor/status/priority are rejected. | PASS |

Source of conditions is unchanged [DEVELOPMENT_ROADMAP.md](spec-v1-approved/DEVELOPMENT_ROADMAP.md), Phase 4. SQL regression was executed on all 20 applied migrations. Final ticket Auth/API/HTTP matrix was executed 7 October 2026 at 20:56 UTC; final SQL regression and production build were repeated 8 October.

## All seven completed tasks

| Task | What was completed and what is verified | Status |
| --- | --- | --- |
| 1 — Database and creation | Tenant/project FK, immutable identity, own/on-behalf creation, Open/Medium, real actor, idempotency and audit rollback. | COMPLETE |
| 2 — Assignment and workflow | Admin owner assignment, additional Staff collaborators, priorities, allowed workflow transitions and ban on generic close/reopen shortcuts. | COMPLETE |
| 3 — Access and negative tests | RLS on all six new tables, direct write attempts, roles, A/B and peer IDOR, transfer and revoke/regrant in the same session. | COMPLETE |
| 4 — Ticket screens | Scoped/global lists, filters/rows/pagination, creation, detail and controlled forms, private/no-store, English UI, empty/loading/error. | COMPLETE |
| 5 — Dashboard | Client own/shared tickets and projects; Staff assigned tickets; Admin pending rows in current scope. | COMPLETE |
| 6 — Comments | Authorized commenting, author-only edit strictly before 15 minutes, server time, immutable revisions and stale/concurrent protection. | COMPLETE |
| 7 — Sharing | Source Client proposes same-org peer, owner/Admin approve/reject with re-check of membership, audit and immediate revoke. | COMPLETE |

Implementation and detailed rules are in [TICKETS_PHASE4.md](TICKETS_PHASE4.md). [LEARNING_GUIDE.md](LEARNING_GUIDE.md) explains each phase and each of these tasks through examples.

## Executed checks

| Check | Result |
| --- | --- |
| Full SQL/RLS regression, including earlier modules | 1717 checks / 16 test files — PASS |
| New ticket SQL subset | 434 checks — PASS |
| Real local Auth/API/native-form/private HTTP ticket matrix | 684 checks — PASS |
| Registration subset after pagination test fix | 169 checks — PASS; included in total 1717 |
| ESLint and TypeScript | PASS |
| Final production build of latest code | PASS |
| Read-only browser review of four ticket/dashboard views | PASS within described scope |
| Pre-Phase-4 hash/UUID baseline of 14 business tables | PASS; earlier rows preserved |
| Cleanup of test privileges, assignments, sessions and audit fault trigger | PASS |
| SHA-256 of seven approved sources against original ZIP | 7 / PASS |

HTTP matrix uses real local registration, email confirmation, login, JWT and cookie sessions. Business operations go through authenticated RPC and real Next native forms. Covers owner/collaborator/client/admin scope, default values, spoofed and copied fields, foreign Origin, literal XSS text, concurrent/stale changes, comments and history, sharing approve/reject/revoke, pagination, dashboard aggregates and real atomic Client transfer.

Revocation/regrant, owner change and transfer were verified without logout/login as a condition for access change. Reading parent/child data and new actions use current rights. Late audit error proves ticket rollback and absence of partial write; temporary fault trigger was removed. Direct INSERT/UPDATE/DELETE remain unavailable to application roles.

Execution evidence remains in ignored `.tools/verification/`: `tickets-result.json`, `tickets-final-state.json`, `tickets-visual-result.json`, `gate4-sql-final.log` and `gate4-build-final.log`. They do not contain publicly exposed privileged credentials and do not belong in Git. Earlier Gate 2/3 web matrices were not all re-run; current full SQL regression covers their existing SQL sets.

## Cause of error and “Rejected” messages

**The failed registration test was a pagination problem in the test.** The old check called `admin_registration_requests(100,0)` and expected all 31 of its requests on the first page. Retained fictional history filled more than one page, so the first call no longer contained all fixture requests. That is not proof the request disappeared nor that ticket permissions are wrong.

The fix walks all authorized pages with the same production limit of 100, then checks exact fixture request IDs. Limit, RLS and business functions were not changed; history was not deleted. After the change, separate 169 and full regression of 1717 checks pass.

**The final build block came from the automatic tool execution approval limit.** The message itself was not a PostgreSQL error nor a judgment that `20261008010000_tickets_foundation.sql` is invalid. The rejected execution attempt did not perform the proposed action. After approval availability was restored, final commands were executed through normal approval. Ticket foundation and three more upgrades were applied locally and passed the listed tests.

For learning: migration/SQL error has a database response; tool approval block prevents the command before execution; assertion failure means the result differs from test expectation. The cause must be determined from concrete output, not only from the label “Rejected” or “FAIL”.

## Browser review and its boundaries

Visual check used saved HTML responses from real fictional authenticated accounts, with materialized Next streaming content. Temporary read-only preview used application CSS; scripts and form submission were disabled.

| View | Theme and size | Content width / scroll | Outcome |
| --- | --- | --- | --- |
| Client ticket detail | Dark, 390×844 | 375 / 375 px | No horizontal overflow |
| Owner ticket detail | Light, 1280×900 | 1265 / 1265 px | No horizontal overflow |
| Client dashboard | Dark, 390×844 | 375 / 375 px | No horizontal overflow |
| Org Admin dashboard | Light, 1280×900 | 1265 / 1265 px | No horizontal overflow |

Tab focuses “Skip to content”. Screens use labeled fields and visible focus. Dark is the initial choice without saved preference; existing Light/System choice is preserved. Temporary browser tab was closed and viewport restored; user Auth session was not changed.

This review confirms appearance of saved responses, not a separate live React/hydration/login/submit pass for every role. Native HTTP forms and business decisions were verified separately in the 684 matrix. Full browser E2E and systematic WCAG check remain part of Phase 6.

## Local state and next step

At final verification there are 233 profiles, 56 companies, 88 projects, 74 tickets, six comments, three comment revisions, six sharing requests, two participant history rows and 20 migrations. Total 55 new fictional ticket accounts remained through trial runs and retained history. All new test privileged roles, active Staff/Admin assignments, project-create permissions, Auth sessions, active codes and audit fault triggers: 0. Persistent SA is one previous.

There was no database reset, hosted writes, deployment, commit or push. Seven approved sources remained identical to the original archive. Earlier local business history is preserved.

The schema recognizes six statuses, and Phase 4 completes the workflow at `Resolved` and protects terminal `Closed`. Phase 5 introduces dedicated acceptance paths, reasoned reopen within seven days, owner/Admin decisions, exceptional Admin close and idempotent scheduled closing without Pending reopen requests. Private ticket attachments and broader audit/retention flow are also in Phase 5. Proposal attachments from Phase 3 are not ticket attachments.

This document confirms completion of local Phase 4 and Gate 4. Final production security and deployment verification remain in their approved phases.
