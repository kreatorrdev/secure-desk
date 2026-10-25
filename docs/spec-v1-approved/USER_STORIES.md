# SecureDesk — User Stories & Acceptance Criteria (v1.0 APPROVED)

**Convention:** `US-xx`: “As a [role], I want [action], so that [goal].” Criteria give verifiable, concise conditions. Roles and scope from `PROJECT_BRIEF.md`; access policy in `PERMISSIONS_MATRIX.md`. **Until request approval all private functions are unavailable.**

## A. Registration, identity, and organization membership

| ID | User story | Key acceptance criteria |
|---|---|---|
| US-01 | As a visitor, I want to register so I can request access to SecureDesk. | Name, email, password, company, message, and phone; email verification; registration alone does not grant privileges. |
| US-02 | As a signed-in unapproved user, I want to see request status. | May see only status and permitted steps; cannot read organizations/tickets via UI or direct API. |
| US-03 | As a user, I want to propose a new organization if none exists. | Name, address, contact, description, and justification; does not create active organization without admin decision. |
| US-04 | As responsible admin, I want to review and approve/reject application. | “Pending Requests” row; may verify company, justify rejection; rejected user may submit new request. |
| US-05 | As user of approved new organization, I want first membership. | Administrator approves organization → organization and first Client membership created as one consistent change. |
| US-06 | As approved Client, I want to request transfer to another organization. | Old access lasts until decision; on approval old active access ends; historical tickets remain in old organization, new access follows new one. |
| US-07 | As Client, I want to invite colleague via organization code. | Sharing code does not grant access; admin must independently confirm membership; code does not expose private data. Valid code may be shared by approved member; only responsible Admin issues/rotates/revokes code. |
| US-08 | As Super Admin, I want to assign privileged roles. | Client/staff cannot assign self role via profile, form, API, or direct database change attempt. |
| US-09 | As responsible Admin, I want to assign Client and Staff members to my organizations. | Changes limited to admin scope; ordinary admin cannot create new admin; revocation immediately affects access. |
| US-10 | As Admin, I want to set organization inactive. | New operations stopped; only defined authorized historical view (*exact read-only historical RLS finalized in that phase*). |

## B. Projects and project proposals

| ID | User story | Acceptance criteria |
|---|---|---|
| US-11 | As Client, I want to see active projects of my organization. | Do not see another organization’s projects, nor projects before membership approval. |
| US-12 | As Client, I want to submit a project proposal. | Name, description, reason, deadline, proposed priority, and permitted attachments; proposal is not automatically active project. |
| US-13 | As assigned Staff, I want to review proposal and give recommendation. | See only proposals assigned for review; Admin makes acceptance decision. |
| US-14 | As responsible Admin, I want to approve/reject proposal. | Project creation or rejection within my organization; decision and actor in audit. |
| US-15 | As explicitly authorized Staff, I want to create a project. | Organization assignment alone is insufficient — separate create-project permission required. |
| US-16 | As newly approved organization, I want General Support. | One default project created on activation, no duplicates on repeated request. |
| US-17 | As Client, I want to choose active project when creating ticket. | Required field; project must belong to same organization and be active. |

## C. Tickets, collaboration, and statuses

| ID | User story | Acceptance criteria |
|---|---|---|
| US-18 | As Client, I want to open ticket on permitted project. | Ticket belongs to my organization/project, initial status `Open`, priority defaults to `Medium`. |
| US-19 | As Staff/Admin, I want to open ticket on behalf of specific Client. | Record `created_by` (actor) and `client_user_id` (on whose behalf); Client sees ticket as own; impersonating client not allowed. |
| US-20 | As Client, I want to see only own and specially shared tickets. | Changing ID/URL does not grant access to another’s ticket even within same organization. |
| US-21 | As Admin, I want to assign responsible Staff to ticket. | Person must have appropriate organization assignment; change is recorded. |
| US-22 | As owner Staff, I want to add collaborators. | Only staff assigned to that organization; collaborator sees that ticket, may comment/attach, but does not change status/priority. |
| US-23 | As owner Staff or authorized Admin, I want to manage status and priority. | Only permitted transitions from set of six statuses; collaborator and client cannot change priority or set `Resolved` alone. |
| US-24 | As Client, I want to share ticket with colleague. | Propose member of **same** organization; only after owner or admin approval does colleague get specific access to ticket, comments, and attachments. |
| US-25 | As ticket participant, I want to leave a comment. | Visible only to users with ticket access; no internal staff-only comment in MVP. |
| US-26 | As comment author, I want to correct it within 15 minutes. | After deadline edit rejected, each edit leaves revision/audit; no silent history deletion. |
| US-27 | As authorized participant, I want to upload or receive attachment. | Image/PDF/TXT/CSV/DOCX, at most 10 MB; download allowed only with valid access to parent ticket. |
| US-28 | As owner Staff, I want to mark resolved problem as `Resolved`. | Sets `resolved_at` time which starts seven-day window. |
| US-29 | As Client, I want to accept solution. | Only on permitted own ticket in `Resolved`; moves to final `Closed`, after which reopen is not possible. |
| US-30 | As Client, I want within 7 days to justify that same problem continued. | Request only from `Resolved`, with mandatory reason, stays `Pending` until owner decides; ticket does not immediately revert. |
| US-31 | As owner Staff, I want to approve/reject continuation request. | Approved → `Assigned`; rejected → stays `Resolved` if window still active, and if seven-day window expired while waiting, ticket closes without resetting window; if owner unavailable, responsible admin ensures processing. |
| US-32 | As system, I want to close unresponded resolutions after seven days. | Only `Resolved` where window expired and no `Pending` reopen request; operation is safely repeatable (idempotent) and audited. |
| US-32A | As responsible Admin, I want exceptional manual closure only when justified administrative reason exists. | Admin only, mandatory reason, audit record; not standard path and Owner Staff does not have it. |
| US-33 | As user, I do not want `Closed` returned to work. | All API, UI, and DB attempts to transition `Closed` → any active status are rejected. |

## D. Dashboard, audit, and interface

| ID | User story | Acceptance criteria |
|---|---|---|
| US-34 | As Client, I want dashboard of own tickets, active projects, and status. | No counting/discovery of others’ tickets. |
| US-35 | As Staff, I want list of tickets where I am owner or collaborator and requests I process. | Unassigned organization tickets do not appear solely due to general staff assignment. |
| US-36 | As organization Admin, I want work queue for memberships, proposals, assignments, and reopen requests. | Only data of my organizations; no global admin rights. |
| US-37 | As Super Admin, I want global administrative overview. | Global content protected by separate privilege ordinary admin cannot grant self. |
| US-38 | As Super Admin, I want global security audit and retention period setting. | Default 365 days; no secrets in log; policy changes themselves recorded. |
| US-39 | As limited Admin, I want audit view of own organizations. | Cross-tenant audit read attempts rejected. |
| US-40 | As Client/Staff, I want to see activity history on tickets I access. | Business history ≠ full security audit; display limited to parent ticket. |
| US-41 | As user, I want English UI with Dark/Light theme. | Basic Dark; light theme available; keyboard-accessible controls and displays. |

## E. Non-functional and mandatory security stories

| ID | User story | Acceptance criteria |
|---|---|---|
| NFR-01 | As platform owner, I want organization isolation. | Server checks + RLS; SELECT/INSERT/UPDATE/DELETE negative tests, not just hidden buttons. |
| NFR-02 | As user, I want files to be private. | No public storage links bypassing ticket/proposal check; time-limited access where applicable. |
| NFR-03 | As administrator, I want reliable audit trail. | Actor, action, time, target, tenant, outcome; role, status, and permission changes traceable. |
| NFR-04 | As developer, I want repeatable environment. | SQL migrations, demo seed without real personal/client data, `.env.example` without secrets, README. |
| NFR-05 | As reviewer, I want visible security evidence. | Test cases for A/B isolation, privileges, attachments, invite codes, reopen/auto-close, and documented security report. |

## F. Technical points for appropriate phases

- `US-10`: clarify read-only historical scope of inactive organization before RLS migration.
- `US-01/US-04`: finalize retry/history model for repeated rejected registration requests with auth workflow.
- `US-27`: finalize concrete MIME/signature allowlist and anti-spoofing check in Storage phase.

These are not open business decisions and do not block start of implementation.
