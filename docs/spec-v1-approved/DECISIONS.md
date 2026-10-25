# SecureDesk — decision register (v1.0 APPROVED)

**Status:** business specification approved to begin implementation. Sources are the initial project plan, 62 answers from discussion, and five subsequently confirmed alignments. This is a requirements record, **not proof that features are implemented**. Labels: **U** = adopted from answer; **I** = later changed/clarified; **P** = technical proposal finalized in the appropriate phase. When a later answer changes an earlier one, the later one prevails, but the change trail is preserved.

## 01–10: organizations, registration

| # | Choice | Agreed meaning |
|---|---|---|
| 01 | C, supplement | User may request a new organization; admin then processes and approves the request. |
| 02 | own variant | Client belongs to **one** active organization at a time. May request a change; no self-service switch. |
| 03 | B | Client sees all projects of their organization, but primarily only own tickets; exception is explicitly approved sharing (40, 56). |
| 04 | C | Detailed organization profile: name, contact, address, industry, and additional business fields. |
| 05 | C | Organization may be inactive; authorized users may retain limited historical view. |
| 06 | C | Registration requires name, email, password, company name, message to administrator, and contact phone. |
| 07 | A | Signed-in, not-yet-approved user sees only the request status page. |
| 08 | A | New registration requests are in a separate Admin “Pending Requests” panel. |
| 09 | A | Future staff also use self-registration; only admin assigns staff role. |
| 10 | A | Rejected user sees reason and may submit a new request. |

## 11–20: roles, projects, and tickets

| # | Choice | Agreed meaning |
|---|---|---|
| 11 | C | Super Admin exists and additional administrators with limited rights. Their scope is further clarified with 35B. |
| 12 | B | Staff sees only tickets directly assigned to them; additional collaborator role is also explicit assignment (20, 41, 51). |
| 13 | C | Member may initiate inviting a colleague, but admin always confirms membership. Invitation method clarified by 49B. |
| 14 | B + supplement | Projects created by admin or specially authorized staff; client may **propose** a project, not publish directly. |
| 15 | C → I(39,55) | Usually client creates ticket. **Exception:** admin/staff may create ticket on behalf of a specific client, with separate record of actual creator. |
| 16 | A | Every ticket must belong to a project; 42B introduces default General Support. |
| 17 | B | Statuses: `Open`, `Assigned`, `In Progress`, `Waiting for Client`, `Resolved`, `Closed`. |
| 18 | B | Priorities: `Low`, `Medium`, `High`, `Critical`. |
| 19 | B + confirmed alignment | Priority set by staff/admin; new ticket gets default priority `Medium`. |
| 20 | C | One responsible staff member + additional collaborators. |

## 21–30: lifecycle, interface, audit

| # | Choice | Agreed meaning |
|---|---|---|
| 21 | B → I(58,62) + confirmed alignment | Standard closure is client acceptance or automatic closure after seven days. Owner Staff has no regular right to manually close `Resolved`. Responsible Admin may perform **exceptional administrative closure** with mandatory reason and audit record. |
| 22 | A → I(58,59,62) | Formerly: reopening `Closed` within 7 days. **Replaced:** `Closed` is final; within seven days return to work is possible only from `Resolved`. |
| 23 | A | All ticket comments visible only to users who already have access to that ticket; no internal comments in MVP. |
| 24 | A | Author may edit comment within 15 minutes; edit must be recorded. Deletion not approved by this decision. |
| 25 | B | Attachments: images, PDF, TXT, CSV, DOCX; up to 10 MB per file, with actual type and access checks. |
| 26 | A+B+C | Detailed audit log covers business, membership, administrative, and selected security events. Do not log secrets. |
| 27 | C | For MVP no separate notification system; relevant requests shown on dashboard (60). |
| 28 | A | User interface in English. Documentation may be in Serbian. |
| 29 | B + supplement | Cybersecurity Dark look + additional light theme and switching. |
| 30 | C | Core system parts developed connected/in parallel, but access checks are not deferred. |

## 31–40: more on organizations, admin, and requests

| # | Choice | Agreed meaning |
|---|---|---|
| 31 | C | New organization request: name, address, phone, email, description, and justification. |
| 32 | A | Moving to new organization does not revoke old access until approved; on approval previous active membership ends. |
| 33 | A | Single registration form; user cannot assign self staff/admin privileges. |
| 34 | A → I(49) + confirmed alignment | Any approved member may share a valid organization code. Only responsible Admin may create, rotate, or revoke code. Entering code only starts a request; membership always requires admin approval. |
| 35 | B | Super Admin is global; other admins limited to organizations assigned to them. |
| 36 | A | Staff sees all projects of assigned organizations, but only tickets they are engaged on. |
| 37 | C | Project proposal includes name, description, reason, desired deadline, estimated priority, and attachments. |
| 38 | C | Staff gives recommendation on project proposal; administrator makes final decision. |
| 39 | C | Staff/admin may create ticket on behalf of client, with audit of who actually opened it. Supplement to 15. |
| 40 | B | Client may propose sharing their ticket with a colleague; access is separately approved (56). |

## 41–50: collaborators, attachment, organization invite code

| # | Choice | Agreed meaning |
|---|---|---|
| 41 | A | Additional staff collaborator comments and adds attachments; status/priority change and completion management by responsible staff (admin within authority). |
| 42 | B | On organization activation, `General Support` project is created. |
| 43 | C → I(58,59) | To return a resolved ticket requires client justification and responsible staff approval; does not reopen `Closed`. |
| 44 | A | Ticket attachments are private and inherit ticket permissions. |
| 45 | C | Audit log retention period configurable; default 365 days (who changes it: 61). |
| 46 | A | Admin manually verifies company affiliation, contacting authorized person when needed. |
| 47 | A | If admin approves request for wholly new organization, organization is created and submitter becomes first approved Client member. |
| 48 | A | On transfer, historical tickets/comments remain in old organization with author record, but user loses access. |
| 49 | B | Members may share organization code; entry is membership request, **never automatic authorization**; admin confirms each request. |
| 50 | A | Limited admin manages members and staff assignments of their organizations, but cannot promote anyone to administrator. |

## 51–62: practical permissions and ticket completion

| # | Choice | Agreed meaning |
|---|---|---|
| 51 | A | Staff assignment to organization gives view of its projects; ticket visible only if owner or explicitly listed collaborator. |
| 52 | B | Staff creates project only with additional approved permission. |
| 53 | A | Project proposal visible to author, authorized staff reviewing it, and administrator of that organization. |
| 54 | A | Client may open ticket in any active project of their organization. |
| 55 | A | Ticket opened on behalf of client records both actual actor and client for whom it was opened; client sees it as own ticket. |
| 56 | A | Author proposes participant from same organization; owner staff or responsible admin approves access to specific ticket, comments, and attachments. |
| 57 | A | Owner may add staff collaborators assigned to organization; admin may change assignment. Audit log records changes. |
| 58 | B + explicit supplement | Staff sets `Resolved`; client acceptance moves to `Closed`. **If client closes, no reopen.** Only while `Resolved` and within next seven days may they request continued work for same problem with justification. |
| 59 | A → I(58,62) | While request is reviewed, ticket stays **Resolved** (not Closed), request has `Pending` status; after approval ticket becomes `Assigned`. If owner unavailable, admin may take over processing/reassignment. |
| 60 | A | Role-based dashboard with rows of actions awaiting processing: registration, projects, tickets, reopen requests, etc. |
| 61 | A | Super Admin sees global security audit and alone changes global retention; organization admin sees events of their scope; staff/client do not see security audit, only permitted history of own/accessible tickets. |
| 62 | A | If no client reaction seven days from `Resolved`, system automatically moves ticket to `Closed`, **except when a pending reopen request exists**. Record automatic action in audit. |

## Final ticket status view (later change takes precedence)

`Open → Assigned → In Progress ↔ Waiting for Client → Resolved`.

From `Resolved`: (1) client accepts → `Closed` (final), (2) within 7 days submits justified request for same problem → ticket stays `Resolved`, request is `Pending`; if owner accepts → `Assigned`, (3) without reaction and without pending request after 7 days → automatic `Closed`. From `Closed` **no transition back**. Owner Staff has no regular manual `Resolved → Closed`; responsible Admin has only exceptional, justified, and audited administrative close.

## Subsequently confirmed alignments

1. **Manual closure:** standard paths are Client acceptance or automatic closure after 7 days. Responsible Admin may exceptionally manually close ticket only with mandatory justification and audit record; Owner Staff does not have this exceptional privilege.
2. **Organization code:** any approved member may share valid code, but only responsible Admin may issue, rotate, or revoke code. Code alone never grants membership.
3. **Rejected reopen after deadline expiry:** if seven-day window already expired while `Pending` request awaited decision, rejecting request closes ticket without resetting window; system/audit records reason.
4. **Cross-org transfer:** Super Admin or, without their intervention, administrators of both involved organizations (source and destination) may approve. Access transfer must be atomic.
5. **Default priority:** new ticket gets `Medium`; authorized Staff/Admin may change it later.

## Technical points that do not block implementation

- **T-01 — Archived organization:** business rule is `inactive` + limited historical view. Exact read-only scope and RLS policies finalized before deactivation/archive migration.
- **T-02 — Repeated/rejected registration requests:** UI and database must preserve history and prevent privileges before approval; detailed retry model finalized with auth workflow.
- **T-03 — Storage allowlist:** business allows images/PDF/TXT/CSV/DOCX up to 10 MB; concrete MIME/signature types (e.g. JPEG/PNG/WebP) finalized in Storage phase and tested against spoofing.

These technical points do not change adopted business logic and **do not block Phase 1**.
