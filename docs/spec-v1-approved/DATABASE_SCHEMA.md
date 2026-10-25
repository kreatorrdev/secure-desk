# SecureDesk — Database Schema (v1.0 APPROVED BASELINE)

**Status:** technical proposal from adopted requirements; **migration not executed**. Table/column names are working; SQL types and RLS expressions verified at implementation. Relative to eight initial tables, 62 decisions require additional tables for membership, assignments, proposals, codes, ticket sharing, and reopen requests. This is elaboration of existing MVP, not introduction of new user modules.

## 1. Core modeling principles

- UUID PK; time in UTC (`timestamptz`), DB migrations under version control, indexes for FK, tenant, and time queries.
- `auth.users` is source of authenticated identity. `profiles` references it; passwords are never copied into a custom table.
- `app_role` and privileged assignments changed only by verified, purpose-built server/admin flow; never arbitrary client-side `UPDATE`.
- Rights are intersection of identity, approval status, role, active organization/assignment, and role on specific ticket.
- `organization_id` is tenant key in every tenant table. Chosen `project_id`, `client_user_id`, reviewer, owner, and collaborator must belong to permitted same context; verify on server **and** where possible through composite FK/unique constraints or transactional DB functions.
- Each active Client at most one membership. Staff/Org Admin may be assigned multiple organizations via their assignment tables. Client transfer performed atomically: deactivate old and approve new, without period of two active memberships.
- Immutable historical author evidence remains after membership ends; content access does not remain due to authorship alone after transfer.

## 2. Core tables

| Table | Proposed important fields (PK `id` unless stated otherwise) | Relationship / constraints |
|---|---|---|
| `profiles` | `id` = `auth.users.id`, `full_name`, `phone`, `app_role`, `account_status`, `created_at`, `updated_at` | `app_role`: client/staff/admin/super_admin (latter is admin subtype); this is **representation proposal**, not user-chosen role. Escalation-sensitive. |
| `organizations` | `id`, `name`, `description`, `industry`, `address`, `email`, `phone`, `contact_person`, `status`, `created_at`, `updated_at` | `status`: pending/active/inactive per flow; concrete validation from requirements. |
| `organization_members` | `id`, `organization_id`, `user_id`, `status`, `approved_by`, `approved_at`, `joined_at`, `ended_at` | Client memberships; `UNIQUE(organization_id,user_id)` with rule on re-membership/history; proposal partial unique `user_id` where `status='active'` for Client membership. |
| `organization_admin_assignments` | `id`, `organization_id`, `admin_user_id`, `assigned_by`, `active`, timestamps | OA scope; Super Admin needs no tenant assignment to operate globally. |
| `staff_organization_assignments` | `id`, `organization_id`, `staff_user_id`, `assigned_by`, `active`, `can_create_project`, timestamps | Staff may be in multiple orgs.; additional project permission is not global staff privilege. |
| `projects` | `id`, `organization_id`, `name`, `description`, `status`, `is_general_support`, `created_by_user_id`, timestamps | Project belongs to one org.; proposal unique General Support per org.; inactive project does not accept new tickets. |
| `tickets` | `id`, `organization_id`, `project_id`, `title`, `description`, `client_user_id`, `created_by_user_id`, `owner_staff_user_id` (nullable), `status`, `priority`, `resolved_at`, `closed_at`, `close_reason`, timestamps | Project from same org. `created_by` ≠ `client_user_id` when opened on behalf. Initial `Open`, system default priority `Medium`. |
| `ticket_collaborators` | `id`, `ticket_id`, `organization_id`, `staff_user_id`, `added_by_user_id`, timestamps | Unique ticket/staff pair; staff of that org. Owner has separate field in `tickets`. |
| `ticket_comments` | `id`, `organization_id`, `ticket_id`, `author_user_id`, `body`, `edited_at`, `created_at` | All authorized ticket readers see comments, no internal field in MVP. Edits max 15 minutes and audit. |
| `ticket_comment_revisions` | `id`, `comment_id`, `editor_user_id`, `previous_body`, `edited_at` | Proposed technical realization of revision trail, RLS read only under parent ticket rules; record not under free client UPDATE/DELETE. |
| `attachments` | `id`, `organization_id`, `ticket_id` nullable, `project_proposal_id` nullable, `uploaded_by_user_id`, `storage_path`, `original_name`, `mime_type`, `size_bytes`, `created_at` | Exactly one of `ticket_id` or `project_proposal_id` (XOR CHECK); private bucket; up to 10 MB; parent access on upload/download. |
| `audit_logs` | `id`, `organization_id` nullable, `actor_user_id` nullable, `event_type`, `target_type`, `target_id`, `outcome`, `metadata_redacted`, `created_at` | Global events have nullable `organization_id`; append-only; users do not manage logs directly; separate global and tenant views. |
| `platform_settings` | `key`, `value`, `updated_by`, `updated_at` | `audit_retention_days` default 365, changes Super Admin only, and those changes themselves audited. |

**Role model control:** application keeps three business roles admin/staff/client, and `super_admin` is technical higher admin variant. Alternatively use separate privileged table instead of enum value; decide at authentication implementation. Never hold freely editable `is_admin` on profile.

## 3. Approval flows and additional access

| Table | Proposed important fields | Rules |
|---|---|---|
| `registration_requests` | `id`, `user_id`, `company_name_text`, `message`, `phone`, `target_organization_id` nullable, `status`, `reviewed_by`, `rejection_reason`, timestamps | Pending/approved/rejected; history of repeated requests without granting access before approval. |
| `new_organization_requests` | `id`, `requested_by_user_id`, `name`, `address`, `email`, `phone`, `description`, `reason`, `status`, `reviewed_by`, `organization_id` nullable, timestamps | Admin creates org. only after manual review; on approval immediate first Client membership. |
| `organization_access_codes` | `id`, `organization_id`, `code_hash`, `active`, `created_by`, `expires_at` nullable, timestamps | Code identifies request, does not authorize. Created/rotated/revoked only by responsible Admin; approved member may share. Store hash not publicly readable active code. |
| `organization_join_requests` | `id`, `user_id`, `organization_id`, `access_code_id` nullable, `status`, `reviewed_by`, `rejection_reason`, timestamps | Admin approves only; pending user does not see org. content. |
| `organization_change_requests` | `id`, `user_id`, `from_organization_id`, `to_organization_id`, `reason` nullable, `status`, `reviewed_by`, timestamps | Old membership active until approval; transition atomic; cross-org approved by Super Admin or coordinated admins of both involved organizations. |
| `project_proposals` | `id`, `organization_id`, `proposed_by_user_id`, `title`, `description`, `reason`, `desired_deadline`, `proposed_priority`, `status`, `reviewer_staff_user_id` nullable, `recommendation`, `decided_by_admin_user_id`, `project_id` nullable, timestamps | Author + assigned reviewer + admin have access; staff recommends, admin makes final decision. Attachments via `attachments`. |
| `ticket_participant_requests` | `id`, `organization_id`, `ticket_id`, `requested_by_user_id`, `candidate_client_user_id`, `status`, `reviewed_by_user_id`, timestamps | Request submitted by author; candidate must be active Client of **same** organization; owner/admin approves. |
| `ticket_participants` | `id`, `organization_id`, `ticket_id`, `client_user_id`, `approved_by_user_id`, `created_at` | Explicitly approved access; does not create right on other tickets. |
| `ticket_reopen_requests` | `id`, `organization_id`, `ticket_id`, `requested_by_user_id`, `reason`, `status`, `reviewed_by_user_id`, `reviewed_at`, timestamps | Resolved only within 7 days, mandatory reason, `Pending/Approved/Rejected`; one open Pending per ticket; Approved → ticket `Assigned`; Rejected after original seven-day window expired → ticket closes without resetting window. |

## 4. Relationships — readable view

```text
auth.users ──1:1── profiles
profiles(Client) ── organization_members ── organizations
profiles(Staff) ── staff_organization_assignments ── organizations
profiles(Admin) ── organization_admin_assignments ── organizations
organizations ── projects ── tickets ── ticket_comments
                            │       ├── ticket_collaborators (staff)
                            │       ├── ticket_participant_requests ── ticket_participants (client)
                            │       ├── ticket_reopen_requests
                            │       └── attachments (private)
                            └── project_proposals ── attachments (private)
organizations ── registration/join/change/new-org requests
organizations ── audit_logs (scoped), global events have nullable organization_id
```

## 5. Indexes, constraints, transactions — initial proposal

- `UNIQUE(projects.organization_id, projects.id)` and corresponding tenant links for `tickets`, and `(tickets.organization_id, tickets.id)` when referenced from comments/attachments; do not allow `ticket.organization_id=A` + `project.organization_id=B`.
- Active Client membership unique per user; choose correct DB approach if membership table also holds historical rows.
- One General Support per organization (`UNIQUE`/partial index) and idempotent activation.
- Indexes `tickets(organization_id, status, priority)`, `tickets(owner_staff_user_id,status)`, `ticket_collaborators(staff_user_id,ticket_id)`, `ticket_participants(client_user_id,ticket_id)`, `audit_logs(organization_id,created_at)`, and `ticket_reopen_requests(ticket_id,status)`.
- One pending reopen request per ticket; `resolved_at IS NOT NULL` while ticket `Resolved`; `closed_at` and `close_reason` when `Closed`.
- `attachments.size_bytes <= 10*1024*1024`, MIME and actual format allowlist; content validation is application/storage responsibility, not DB CHECK alone.
- Comment editable only until `created_at + 15 minutes`; verify on server and through controlled DB routine/constraint, do not rely on browser clock.
- Automatic closure should check status, `resolved_at + 7 days`, and absence of Pending reopen in **one atomic operation**; no overlap with human action, audit in same transaction.
- Inactive organization status blocks new private operations; exact read-only historical scope finalized as technical RLS decision before that migration.

## 6. RLS — guidelines by table set, not finished SQL

1. `profiles`: read own and minimum tied to permitted ticket; admin by scope. Privileged fields not changed by free user update.
2. `organizations`, `organization_members`, org assignments: active confirmed membership or assignment; pending gets only own request status without enumeration. Super Admin/global Admin scope verified.
3. `projects`: Client via active org.; staff via org assignment; OA only own tenant; write only Admin or staff with special permission.
4. `project_proposals`: author, assigned reviewer, responsible Admin; attachment identical parent permission.
5. `tickets`: Client only `client_user_id = auth.uid()` or approved `ticket_participants`; staff only owner/collaborator; Admin by scope; verify each write individually, do not grant broad tenant UPDATE.
6. `ticket_comments`, `attachments`, ticket history: visibility inherits permission of specific ticket or project proposal; 15-minute comment edit tied to author.
7. `ticket_reopen_requests`: originating Client submits only while ticket Resolved within window; owner/admin process; audit recorded via controlled server/DB path.
8. `audit_logs`: Super Admin global, OA tenant; staff/client may read **separate filtered activity view** of permitted ticket, never raw security audit.

## 7. Technical points finalized in appropriate phase

- Read-only historical RLS for inactive organizations.
- Retry/history model for registration requests.
- Concrete Storage allowlist (e.g. JPEG/PNG/WebP with PDF/TXT/CSV/DOCX), MIME + signature check and anti-spoofing rules.

Business relations and authorization scope are approved and these points do not block Phase 1.
