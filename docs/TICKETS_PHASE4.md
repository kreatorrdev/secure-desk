# Tickets, comments, sharing and dashboard — Phase 4

Completed: October 8, 2026. Local Next.js and Supabase, no cloud writes. All seven tasks and local Gate 4 completed; 1717 SQL/RLS and 684 Auth/API/native HTTP checks — PASS.

## What is available

`/tickets` shows tickets available to current user. `/organizations/[id]/tickets` limits view to specific allowed company. List has 25 rows, filter of six statuses, pagination and empty/error/loading displays. Admin has unassigned ticket row; owner Staff and responsible Admin have sharing request row.

`/organizations/[id]/tickets/new` opens ticket in active project. Client creates for self; Staff with active company assignment and scoped Admin may create for approved Client of same company. Separate `can_create_project` permission does not determine ticket rights. Staff creator does not implicitly gain right to read new ticket; after creation returns to own available list.

`/organizations/[id]/tickets/[ticketId]` shows description, original Client, real creator, owner, collaborators, approved Client participants, comments/revisions and allowed actions. Copied form does not replace current access check.

`/dashboard` is role-based overview of tickets, active projects and existing pending work queues. No separate notification system. Client counts include only own and explicitly approved shared tickets; Staff only owner/collaborator tickets. OA does not get global counts.

English UI uses shared dark/light tokens, visible keyboard focus and main skip link. Without saved preference initial theme is Dark; previous Light/System choice remains saved. Forms have labels, pending state and safe error messages. Source business documents unchanged.

## Foundation and database

Source is roadmap Phase 4, decisions 12/15–20/23–24/39–41/48/51/54–57/60 and US-17–26/33–37. Later Resolved/Closed rules take precedence; their dedicated paths in Phase 5.

| Migration | Content |
| --- | --- |
| `20261008010000_tickets_foundation.sql` | tickets, ticket_collaborators, composite project/tenant FK, identity/revision protection, RLS, context, create and manage RPC |
| `20261008020000_ticket_comments_sharing.sql` | ticket_comments, immutable revisions, participant requests/participants, parent RLS, comment write, sharing request/review/revoke |
| `20261008030000_ticket_reads_dashboard.sql` | bounded choices/list/detail DTO, dashboard aggregates, access/revisions/historical names |
| `20261008040000_ticket_work_queues.sql` | pending sharing/unassigned filter before pagination; promoting collaborator to owner replaces collaborator assignment |

Previously applied migrations not rewritten. Upgrades use new migrations. At time of writing four Phase 4 migrations applied locally; total count 20. Additional six business tables retain history and have indexes for parent/tenant/actor.

Composite FK `(organization_id, project_id)` ties ticket to project of same company. Child tables reference `(organization_id, ticket_id)` or `(organization_id, comment_id)`. Ticket identity — tenant, project, Client, creator and creation time — immutable. Original Client remains recorded after transfer; authorship does not bypass revocation.

## Access rules

| Role | Ticket read | Business writes |
| --- | --- | --- |
| Anon / Pending / Rejected / unconfirmed / banned | None | None |
| Client | Own and explicitly approved shared ticket of current company | Own creation, comment; original Client proposes sharing |
| Staff | Only owner or active collaborator, with current org assignment | On-behalf creation in assigned company; all authorized comment; owner status/priority/collaborators/sharing decision |
| OA | Only tickets of companies they currently administer | On-behalf creation, owner/status/priority/collaborators/sharing decision |
| SA | Global scope | Same controlled operations, without free table write |

RLS enabled with explicit grants. Application users have only `SELECT` on new tables; direct `INSERT/UPDATE/DELETE` closed, including authenticated business SA. Service-role has no rights for these application RPCs/tables. Service key not used for ticket flows.

Private `can_read_ticket` function avoids recursive RLS and verifies current Auth/profile, company and concrete relationship to ticket. Child read inherits parent. Request candidates and decision reasons visible to original Client and responsible decision makers, not all shared participants.

Inactive company keeps previous policy: only SA has historical review, without new writes. Broader T-01 historical scope for other roles not introduced this phase. Inactive project does not receive new ticket; existing tickets remain readable per own permissions.

## Controlled functions and concurrency

Authenticated `SECURITY DEFINER` RPCs have empty `search_path`. Each write routine derives actor from `auth.uid()`, verifies confirmed/active Auth account, active company, current role/assignment, business target and expected versions. Private mutation helper functions not API for users.

`ticket_context` returns own access revision and org scope version. Client scope is UUID of current membership episode; Staff/OA scope is assignment revision. Thus transfer, revoke/regrant and role change do not revive old forms. SA scope is null.

Mutation lock order is existing registration actor lock, then org lock and own membership/assignment; then ticket/comment/request row. Org lock serializes ticket mutations in given company. Expected ticket/comment/request revision prevents overwriting newer decisions. Deadlock/serialization errors return without partial transaction; safe user step is reload/retry, not ignoring version.

Candidates verified on every operation: active, email-confirmed Client/Staff, matching role and current company link. Read always re-verifies eligibility; historical identity record not permanent permission. Future operational hardening/rate limiting belongs to Phase 6.

`create_ticket` accepts only `title` (1–200) and `description` (1–8000) in JSON. Status `Open`, priority `Medium`, real creator and audit from server/DB flow. Same UUID/actor/company/project/Client and same details idempotent; altered replay of same UUID rejected.

`manage_ticket` allows only named operations. Admin assigns/changes owner. New owner must be Staff of same org. Owner may add/remove collaborator; choosing owner from collaborator removes their previous additional assignment. Active statuses require owner.

Workflow transitions: `Open → Assigned` through assignment; `Assigned → In Progress`; `In Progress ↔ Waiting for Client`; `In Progress/Waiting for Client → Resolved`. Removing owner before work returns Assigned to Open. Cannot remove owner from In Progress/Waiting for Client. Resolved gets server UTC time. Generic status RPC does not perform accept, manual close or reopen. `Closed` terminal, additionally protected by DB trigger.

## Comments and revisions

`write_ticket_comment` verifies current parent access and real author. Comment is 1–8000 characters. On create same submission UUID and text do not create second comment/audit. Edit requires comment revision and original author; Admin does not overwrite others' comment.

Window measured by `clock_timestamp()` in database. Edit allowed while time strictly before `created_at + 15 minutes`; at boundary or later rejected. Unchanged text not new revision. Changed text atomically writes previous body/version and server time to `ticket_comment_revisions`, then updates current comment.

Revision history append-only; direct comment delete or revision overwrite rejected. UI shows last 25 revisions per comment; older rows remain in database under parent RLS. Comment list separately paginated. No internal comments.

## Sharing requests

Only original `client_user_id` proposes another active Client of same org. Pending request does not grant access. One Pending per ticket/candidate pair prevents duplicates. Owner or responsible Admin makes final decision; collaborator and candidate cannot self-approve.

Approve re-verifies both memberships and atomically writes/activates `ticket_participants`, review data and audit. Reject requires short explanation and does not create access. Expected request revision and Pending condition prevent double decision. Shared Client may read/comment, but does not set priority/status nor propose further sharing.

Owner/Admin may revoke shared access; revocation immediate for parent, comments and revisions with same session. Final Closed content not overwritten due to access change. Participant transfer removes old tenant access. Transfer of original Client before approve prevents approval of old request.

## Dashboard and bounded DTO

`ticket_list` filters access, status and work queue before `LIMIT/OFFSET`; 26 rows means 25 displayed and lookahead. `ticket_options` limits choices per allowed action and name search; does not expose email/phone. `ticket_detail` first verifies parent/tenant, then returns minimal historical names, capability flags and paginated comments/people/requests.

`workspace_dashboard` counts statuses only through ticket authorization predicate. Projects counted through existing org scope. Registration/proposal/transfer rows follow already adopted administration rules. Staff sharing row has only decisions where owner, not collaborator. Dashboard does not show raw security audit.

Next.js verifies identity and current role on every page/action. Proxy refreshes cookies and sets private/no-store for tickets/dashboard, as for earlier business paths. Errors do not expose SQL details; nonexistent, foreign, wrong tenant and invalid ID have same unavailable ticket display.

## Checks and repetition

| Set | Command / purpose |
| --- | --- |
| SQL/RLS | `npm run db:test`; new `supabase/tests/tickets.test.sql` is fixture/rollback matrix |
| Real Auth/API/native forms | `npm run check:tickets:web -- --create-demo`; eleven new fictional accounts and two companies per run |
| Code/types/build | `npm run lint`, `npm run typecheck`, `npm run build` |

Exact final numbers, read-only browser review, registration pagination test fix and conclusion boundaries recorded in [GATE4_VERIFICATION.md](GATE4_VERIFICATION.md). Only executed PASS cited as evidence.

HTTP script verifies local origin/Docker project/workspace, signup/email/session, positive/negative roles, real native forms, copy/hidden fields, foreign Origin, escaped text, defaults/actor, parent RLS, concurrent change, comments/revisions, approve/reject/revoke, pagination, real Client transfer and immediate revocation in same session. Late audit error verifies rollback. Privileged fixture bootstrap and control reads use only local DB owner; business decisions go through authenticated RPC.

Before start saved count/hash/UUID baseline of 14 existing business tables. Each HTTP probe preserves baseline of all already existing rows, including ticket history of earlier probes. SQL fixture reverts through rollback. HTTP probe intentionally retains fictional history; at end revokes new privileged roles/assignments/codes and closes new Auth sessions. Previous permanent SA and user session remain.

## Learning and next phase

Guide [LEARNING_GUIDE.md](LEARNING_GUIDE.md) explains all eight phases and seven Phase 4 tasks through Ana's ticket, Mark's on-behalf entry and Peter's approved access. Contains glossary and self-check questions.

Phase 5 adds ticket attachments/private Storage, Client acceptance, reasoned reopen within seven days, owner/Admin decision, exceptional Admin close, idempotent scheduled closing without Pending reopen and broader audit/retention flow. Proposal attachments from Phase 3 are not proof ticket attachments already finished.

No reset, deployment, hosted writes or change to approved sources. Local Gate 4 not final production security confirmation; Gates 5–7 remain separate future phases.
