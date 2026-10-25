# SecureDesk — Permissions Matrix (v1.0 APPROVED)

Source: `DECISIONS.md` (#1–62). Matrix describes **business-intended permissions**, not implemented RLS policies. In documentation and code separate: (1) identity/session, (2) global role, (3) organization scope, (4) assignment to specific ticket/project, (5) additional functional permission. No access based solely on user-supplied `organization_id` or `role` parameter.

## 1. Legend

- **SA** — Super Admin: global scope.
- **OA** — Organization Admin: only organizations assigned to them.
- **S** — Staff: organizations assigned to them; ticket only if owner or explicit collaborator.
- **C** — Client: one active organization, own ticket or specially approved shared ticket.
- **P** — Pending/Rejected: no private organization access; sees only own status/response to request.
- **✓** — allowed under stated conditions; **—** — not allowed; **T** — technical detail finalized in appropriate phase.

## 2. Administration and data access

| Action | SA | OA | S | C | P |
|---|:---:|:---:|:---:|:---:|:---:|
| See all organizations and global data | ✓ | — | — | — | — |
| See profiles and data **in own scope** | ✓ | ✓ | only necessary for work | only own and permitted collaborators | own status |
| Approve / reject registration and membership | ✓ | ✓ (own org.) | — | — | — |
| Approve creation of **new** organization | ✓ | ✓ only if request in their explicitly assigned admin scope; otherwise SA | — | — | — |
| Create/edit organizations | ✓ | ✓ (assigned, without global privileges) | — | — | — |
| Deactivate organization | ✓ | ✓ (assigned; exact read-only historical RLS = T-01) | — | — | — |
| Assign or revoke global admin role | ✓ | — | — | — | — |
| Assign staff to organization | ✓ | ✓ (own only) | — | — | — |
| Grant staff special permission to create project | ✓ | ✓ (in own organization) | — | — | — |
| Assign Client membership to organization | ✓ | ✓ (in own) | — | — | — |
| Request transfer from one organization to another | — | — | — | ✓ (own request) | — |
| Approve transfer between organizations | ✓ | ✓ only as coordinated confirmation by admin of **both** orgs.; alternatively SA approves alone | — | — | — |
| Share organization code / initiate invite | ✓ | ✓ | ✓ (approved member) | ✓ (approved member) | — |
| Issue / rotate / revoke organization code | ✓ | ✓ (own org. only) | — | — | — |
| Accept member based on code without admin approval | — | — | — | — | — |

**Important:** user without approval may submit intended registration/organization request, but thereby does not get `SELECT` over company data nor right to change own `app_role`. Do not expose public list of all organizations.

## 3. Projects and proposals

| Action | SA | OA | S | C | P |
|---|:---:|:---:|:---:|:---:|:---:|
| View active projects | ✓ | ✓ (own org.) | ✓ (assigned orgs.) | ✓ (own org.) | — |
| Create or edit active project | ✓ | ✓ (own org.) | ✓ only with `can_create_project` for that org. | — | — |
| Submit project proposal | ✓ if business-needed | ✓ if business-needed | — | ✓ (own org.) | — |
| View project proposal | ✓ | ✓ (own org.) | ✓ only if assigned for review | ✓ own only | — |
| Give recommendation on proposal | ✓ | ✓ | ✓ only authorized reviewer | — | — |
| Make final decision on proposal | ✓ | ✓ (own org.) | — | — | — |
| Create `General Support` | automation on organization approval, not free public API | | | | |

**Note for coding verification:** `can_create_project` does not mean staff may arbitrarily open others’ tickets or become admin. Project and ticket must always belong to same organization.

## 4. Tickets: basic access and changes

| Action | SA | OA | S | C | P |
|---|:---:|:---:|:---:|:---:|:---:|
| View tickets | all | all from assigned org. | owner/collaborator only | own + explicitly shared | — |
| Create ticket for self | business as needed | business as needed | — | ✓ on active project of own org. | — |
| Create ticket **on behalf of Client** | ✓ | ✓ in own org. | ✓ in assigned org. | — | — |
| Set / change priority | ✓ | ✓ in own scope | ✓ if owner | — | — |
| Set owner / change assignment | ✓ | ✓ in own scope | — (except explicitly foreseen collaborator additions) | — | — |
| Add staff collaborators | ✓ | ✓ in own scope | ✓ if owner and candidate is staff of that org. | — | — |
| Add public ticket comment | ✓ | ✓ | ✓ on assigned | ✓ on own/shared | — |
| Edit own comment first 15 min | ✓ | ✓ | ✓ | ✓ | — |
| Add/receive private ticket attachment | ✓ | ✓ | ✓ on assigned | ✓ on own/shared | — |
| Propose sharing ticket with Client colleague | — | — | — | ✓ as author; colleague from same org. | — |
| Approve ticket sharing | ✓ | ✓ in own scope | ✓ if owner | — | — |
| Set `Resolved` | ✓ in admin scope | ✓ in own scope | ✓ owner | — | — |
| Accept solution → `Closed` | — | — | — | ✓ Client for whom ticket was opened | — |
| Submit justified request while `Resolved`, within 7 days | — | — | — | ✓ Client for whom ticket was opened | — |
| Approve/reject Pending return request | ✓ as fallback | ✓ if owner unavailable/per jurisdiction | ✓ owner | — | — |
| Reopen `Closed` | — | — | — | — | — |
| Exceptionally manually close `Resolved` before deadline | ✓ with mandatory reason + audit | ✓ own org. only, with mandatory reason + audit | — | only by accepting solution | — |

**Client participant on shared ticket:** read/comment/attach within assigned access; does not automatically get right to accept solution, request reopen, or propose further sharing — those are powers of original `client_user_id`/author per adopted logic. If different behavior desired, new business decision required.

**On-behalf ticket:** `created_by_user_id` marks actual staff/admin actor, `client_user_id` business user. Only approved Client from same organization may be chosen; this operation must not bypass staff org assignment.

## 5. Audit, retention, and files

| Action | SA | OA | S | C |
|---|:---:|:---:|:---:|:---:|
| Read global security audit | ✓ | — | — | — |
| Read security audit of assigned orgs. | ✓ | ✓ | — | — |
| Read business history of accessible ticket | ✓ | ✓ | ✓ | ✓ |
| Change global audit retention (default 365 days) | ✓ | — | — | — |
| Change/remove audit records via user UI | — | — | — | — |
| Download project proposal attachment | ✓ | ✓ in own org. | ✓ assigned reviewer only | ✓ proposal author |
| Download ticket attachment | ✓ | ✓ in own org. | ✓ assigned ticket only | ✓ own/approved shared ticket only |
| Access public unauthorized storage URL | — | — | — | — |

## 6. Mandatory technical conditions for every policy

1. In SQL policies do not rely on `role`/`org_id` from browser; use server/DB-confirmed tie to identity.
2. When creating/changing project/ticket validate matching `organization_id` with parent, including DB constraints against cross-tenant FK manipulation.
3. Protect `INSERT`, `UPDATE`, `DELETE` against escalation and self-change of `app_role`, `membership_status`, `approved_by`, or `client_user_id`.
4. Define RLS rules for every private table, including attachment metadata, sharing request, reopen requests, and audit.
5. Membership/assignment revocation immediately affects future queries and temporary access links; Storage access re-checked when issuing link.
6. Unauthorized attempts have tests `Client A → Org B`, `Client A → another’s ticket in Org A`, `Staff → unassigned ticket`, `OA → foreign org.`, `normal user → Super Admin`, `participant → privileged transition`.
7. Soft-deletion/archiving is preferred technical strategy for historical business data, but exact DELETE policies confirmed before SQL migrations.

## 7. Technical points for implementation

- **T-01:** exact read-only historical scope of inactive organization.
- **T-02:** retry/history model for rejected registration requests.
- **T-03:** concrete Storage MIME/signature allowlist and anti-spoofing checks.

Business permissions are approved; these points are finalized before corresponding migrations/policies.
