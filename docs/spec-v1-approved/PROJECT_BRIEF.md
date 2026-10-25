# SecureDesk — Project Brief (v1.0 APPROVED)

## 1. Purpose

SecureDesk is a secure client portal for a small IT/cybersecurity support agency. It supports organizations, user memberships, project proposals, projects, and IT/security tickets, with data isolation, activity auditability, and a portfolio showcase of a real engineering process. It is intended for demonstration on GitHub, LinkedIn, Upwork, and a personal portfolio. It is not justified to present it as production-safe before testing and review.

**Sources of rules:** the attached project plan + decisions 1–62 in `DECISIONS.md`. This document distinguishes **adopted business rules** from **proposals for technical implementation**.

## 2. User roles and domain

- **Client:** self-registers, waits for approval, belongs to one active organization; sees that organization’s active projects, own tickets, and individually approved shared tickets.
- **Staff:** self-registers, but only an administrator can assign the staff role; may be assigned to multiple organizations, sees their projects and only tickets where they are owner/collaborator. Creates projects only with explicit permission.
- **Organization Admin:** limited to assigned organizations; manages their memberships, staff assignments, projects, requests, and audit view within scope; does not assign administrative privileges.
- **Super Admin:** global management, including granting/limiting admin rights, global audit, and log retention period. Super Admin is a privileged admin subtype, not a free choice at registration.
- **Pending/Rejected:** account/request state, **not an additional privileged role**. Registration alone does not grant access to organization data.

**Security principle:** identity, global role, organization membership, staff assignment to an organization, staff assignment to a ticket, and separate project permission are not the same thing. Access is enforced on the server and through PostgreSQL/Supabase RLS.

## 3. Main business flows — adopted

1. **Registration and approval.** Single form (name, email, password, company name, message to admin, phone); email verification as part of the planned auth flow; before approval only status display. Admin manually verifies company affiliation; rejection has a reason and allows a new request. User may propose a new organization with business/contact details and justification. Approving a wholly new organization makes the submitter the first Client member.
2. **Organization access.** Client has one active organization. A change request does not revoke existing access until approved; after approval old access ends, historical data remains in the old organization. Approved member may initiate inviting a colleague via organization code; using a code never means automatic access.
3. **Projects.** Admin and specially authorized staff create projects. Client sees their organization’s projects and may submit a project proposal with name, description, justification, deadline, priority, and attachments; staff gives a recommendation, admin decides. Organization activation creates `General Support`.
4. **Tickets.** Each ticket belongs to an active organization project. Client opens it; admin/staff may open on their behalf, but both the actual actor and the user for whom it was opened are recorded. Staff/admin set priority (`Low/Medium/High/Critical`); new tickets start at `Medium`. One staff member is owner, others may be collaborators. Client sees own and explicitly shared tickets, not all organization tickets.
5. **Communication and attachments.** All ticket comments are visible only to authorized viewers of that ticket. Author may edit a comment in the first 15 minutes, with a revision trail. Attachments are private, inherit ticket permissions; allowed types are images, PDF, TXT, CSV, DOCX, up to 10 MB per file. Project proposals have separate attachment access control.
6. **Ticket lifecycle.** Statuses: `Open`, `Assigned`, `In Progress`, `Waiting for Client`, `Resolved`, `Closed`. Staff sets `Resolved`. Client may accept the solution and close the ticket; `Closed` is final. While `Resolved`, within 7 days client may request continuation for the same problem with justification; owner approves or rejects, while request is pending ticket stays `Resolved`. On approval it moves to `Assigned`. If there is no response and no pending request after 7 days, system automatically sets `Closed` and records the reason. Owner Staff has no regular manual close of `Resolved` tickets; responsible Admin has only exceptional manual close with mandatory reason and audit.
7. **Dashboard and audit.** Dashboard is role-tailored and shows actions awaiting processing. No separate notification system in MVP. Security audit is globally visible to Super Admin, to responsible Admin per organization; staff/client see only relevant business history of permitted tickets. Default log retention 365 days; global policy changed by Super Admin.

## 4. MVP scope

**Included:** Auth and verification; pending/rejected/approved flows; organization requests, code, and organization change; limited administrators and staff assignments; projects/proposals/General Support; basic tickets and workflow stages; ticket sharing proposal/approval; comments and edit history; private attachments; automatic closure via safe periodic job; audit and relevant security events; RLS and negative tests; responsive UI (English, dark + light); demo data and accounts; documentation and deployment.

**Out of MVP per original plan:** billing, real-time chat, video calls, complex email notifications, mobile app, AI features, advanced analytics, and real client data. Internal staff-only comments are not included because it was decided that all ticket comments are shared with all authorized ticket viewers.

## 5. Technology stack (from initial plan)

Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL/Storage, Zod, RLS, Git/GitHub, Vercel. Use migrations and version schema changes; verify current versions and recommended API patterns **only when setting up the project**, do not guess in advance. Secrets are never stored in the repository; `.env.example` has no real keys.

## 6. Definition of Done — MVP

- Demo flow: registration → pending → review/approval → organization → project → ticket → assignment → work/comments/attachments → resolved → acceptance/justified request/automatic closure.
- Client A does not see organization B data, others’ unshared tickets, or private attachments; staff has no access to others’ unassigned tickets; org admin does not exceed assigned scope; user cannot escalate own privileges.
- Positive and negative permission tests at application and RLS level; for each new table decide `SELECT/INSERT/UPDATE/DELETE`.
- Record membership, priority/status, sharing, files, comments, and important administrative/security actions; no passwords/tokens in audit.
- Automatic closure is idempotent, checks both seven-day window and pending reopen request.
- UI has dark/light, clear keyboard flow, error/empty/loading states, and controlled forms. Hiding UI buttons **is not** a security mechanism.
- Demo environment uses fictional data; README, architecture diagram, migrations, and security report exist. Public presentation must not overstate security level.

## 7. Specification status

Business specification is approved for implementation. Five previously open business points are closed: exceptional admin close, administrative management of organization code, rejected reopen after deadline expiry, cross-org transfer, and `Medium` as default priority. Remaining technical points (historical RLS for inactive organizations, registration retry model, and concrete Storage MIME/signature allowlist) are finalized in their phases and do not change business scope.

## 8. Collaboration principle

One small functional unit = brief explanation → implementation → positive test → negative test → review and confirmation. Do not move to dashboard before basic identity, membership, and access model. Related frontend and backend features may be developed together, but do not skip RLS for speed.
