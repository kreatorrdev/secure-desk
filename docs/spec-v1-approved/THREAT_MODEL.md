# SecureDesk — initial Threat Model (v1.0 APPROVED BASELINE)

**Status:** assessment and control plan, **not confirmation that controls are implemented or tested**. Scope: multi-tenant portal for IT/cybersecurity support agency per `PROJECT_BRIEF.md`. Sources: original plan (RLS, OWASP, audit, storage) and 62 business decisions. Risk rating is preliminary assessment, not formal penetration test.

## 1. What we protect (assets)

- Authentication identity and sessions; user roles and privileged assignments.
- Organizations, business information, memberships, and submitted requests.
- Projects/proposals (may contain sensitive technical descriptions), tickets, comments, and attachments.
- Audit log, global retention settings, and security events.
- Supabase/Vercel secrets and server-side privileged keys; integrity of migrations and scheduled jobs.
- Trust between organizations A and B and trust among users within same organization.

## 2. Actors and trust boundaries

**Legitimate:** visitor, Pending/Rejected, Client, Staff as owner/collaborator, OA in own org., Super Admin, automated backend scheduler. **Attacker models:** anonymous user; legitimate Client attempting to read others’ tickets; Client from org. A accessing org. B; Staff attempting to expand assignment; OA exceeding tenant scope; compromised regular account; access attempt via leaked URL or invite code.

```text
[Internet / browser - UNTRUSTED]
       | Auth and data requests
       v
[Next.js server/API - session and rights verification]
       | user-limited context
       v
[Supabase Auth] --- [PostgreSQL + RLS] --- [Private Storage]
       ^                    ^                        ^
       |                    |                        |
[Privileged server-only routines / Admin operations / periodic job]
       (special trust, least privilege, audit)
```

Boundary: **no browser parameter** (`role`, `organization_id`, `ticket_id`, filename, status) is proof of authorization. Neither UI hiding replaces server check/RLS. Privileged service-role key must never reach client; if server routine bypasses RLS, it must have stricter check and minimal privilege itself.

## 3. Threat register and mandatory checks

| ID | Threat / abuse example | Priority* | Planned control | Test / evidence |
|---|---|---|---|---|
| T-01 | Cross-tenant IDOR/BOLA: Client A requests org. B `ticket_id`. | Critical | RLS + server authz, tenant FK/association, do not rely on ID unpredictability. | A SELECT/INSERT/UPDATE/DELETE on B; all forbidden. |
| T-02 | Horizontal breach within same org.: Client sees colleague ticket without sharing. | Critical | Authorship `client_user_id` or approved `ticket_participants`, per-ticket check. | Client A and Client B same org.; A does not see B except after sharing approval. |
| T-03 | Staff reads all organization tickets though assigned to one only. | High | Org assignment opens projects only; ticket access via owner/collaborator. | Staff may see project, cannot see adjacent unassigned ticket. |
| T-04 | Client writes self `staff`, `admin`, `super_admin` or approves membership. | Critical | No write paths to privileged fields, controlled transactions, RLS/role grant only privileged server. | Forged body, direct DB attempt, mass-assignment test. |
| T-05 | OA from org. A changes users, RLS, or audit of org. B. | Critical | Admin–org. assignment scope and separate global Super Admin privilege. | OA A does not read/change B nor promote self/other to admin. |
| T-06 | Org invite code guessed, enumerated, or interpreted as access. | High | Sufficient entropy code/hash, attempt limiting, no org detail exposure; manual admin approval ALWAYS. | Correct code without approval gives no SELECT; bruteforce and enumeration rate-limit. |
| T-07 | Transfer to another org. leaves old active access or gives two active Client memberships. | Critical | Atomic membership change + DB unique constraint + revocation of rights and new Storage URLs. | Test transfer A→B and immediate access attempt to A. |
| T-08 | Admin/staff opens ticket on behalf of nonexistent or foreign client. | High | Validate `client_user_id` as approved Client of that org.; preserve actual `created_by`. | Forged `client_user_id`, different orgs., audit actor. |
| T-09 | Sharing proposal with user of another organization or self-approval. | High | Candidate active in same org.; approval only owner/OA/SA; RLS active after approval. | Before/after approval; candidate from org. B; forged `approved_by`. |
| T-10 | Private upload: script disguised as PDF, oversized file, malware, or foreign URL. | High | Private Storage; type/content allowlist, size ≤10MB, parent permission inheritance, safe serving, do not execute file. | Forbidden types, double extension, unauthorized GET, signed URL rules. |
| T-11 | Comment silently changed after 15 min or previous content lost. | Medium | Server/DB time, controlled edit operation, revisions and append-only audit. | Author edit 14/16 minutes; other user; history review. |
| T-12 | Status manipulation: Client sets `Resolved`; collaborator changes priority; `Closed` returned to `Assigned`. | High | Server state machine + controlled DB transition, owner/admin check, `Closed` terminal. | Negative tests for each forbidden change. |
| T-13 | Reopen after deadline, without reason, with different problem, or while `Closed`. | High | Resolved-only + seven days from `resolved_at`, mandatory reason, owner approval, protection against duplicate Pending request. | Window −1/+1 second; Closed; pending duplicate; client outsider. |
| T-14 | Scheduled auto-close closes ticket with Pending reopen request or double-logs closure. | High | Atomic update with conditions (Resolved, window, no Pending); idempotence; authorized scheduler and audit. | Simultaneous approve/job; Pending requests; repeated job. |
| T-15 | Secret leakage in browser bundle, `.env`, log, or public repository. | Critical | Server-only configuration, `.env.example` without secrets, secret scanning, audit redaction. | Grep/build inspection/secret scan and log payload review. |
| T-16 | Audit tampering or exposing global security events to org admin. | High | Append-only controlled write; global SA only, tenant filter for OA; separate filtered activity view for Client/Staff. | OA A requests log B/global; user UPDATE/DELETE on audit. |
| T-17 | CSRF/session hijack/credential stuffing in auth and approval flow. | High | Official auth/SSR pattern, secure cookies where applicable, CSRF protection for changes, rate limiting, email verification. | Unauthorized approve, invalid session, repeated login attempts. |
| T-18 | XSS through ticket description, comments, proposals, or filename. | High | Safe output/escape, avoid unsafe HTML, CSP where applicable, limit content and file display. | Injected HTML/JS does not execute on dashboard. |
| T-19 | Inactive organization activity despite archiving. | Medium | Check org. status on business writes and project/ticket selection; separately define history read. | Deactivation and attempts at new tickets/uploads; exact read-only historical scope finalized before RLS migration. |
| T-20 | Over-privileged DB routine or unverified Server Action bypasses RLS. | Critical | Least privilege, explicit caller checks, clearly documented definer/source boundaries, bypass tests. | Invocation from Client/Staff role with substituted parameters. |

*Priority is initial qualitative assessment for planning checks; not result of CVSS analysis.

## 4. Additional rules from decisions

- Seven-day window applies to ticket in `Resolved`. **Client who accepted and closed ticket has no reopen.** If pending request exists, job must not auto-close until processed. If Pending request rejected after original seven-day window expired, ticket closes without resetting window; event audited.
- Client sees all projects of their organization, but only **own and explicitly approved tickets**. Project is not proof of access to all its tickets.
- Attachments are private and follow parent ACL; project proposal is not same as active project or ticket ACL.
- `Staff` does not get project control merely because they see project; `can_create_project` is separate permission.
- Record incident and denial events safely; PostgreSQL RLS denial alone does not guarantee sufficiently readable audit record. Plan controlled server-side security event logging without secrets.
- Demo accounts and seed are synthetic. Do not test on real client or sensitive data.

## 5. Test plan by phase

**Before dashboard:** identity, roles, membership, admin scope, basic RLS negative tests. **Before tickets UI:** owner/collaborator/client isolation + tenant FK. **Before attachment feature:** allowlist, Storage privacy, parent access. **Before deploy:** end-to-end roles, direct API abuse, IDOR/BOLA, escalation, reopen window, scheduled-job race, XSS/CSRF, dependency warnings, secret scan. After that compile separate `SECURITY_REPORT.md` with method, findings, reproduction steps in demo environment, resolution status, and testing limitations.

## 6. Confirmed policies and technical points for implementation

- Admin-only exceptional manual close must require reason and leave audit trail; Staff does not get this privilege.
- Organization codes issued/rotated/revoked only by responsible Admin; sharing code is not authorization.
- Cross-org transfer requires Super Admin decision or consent of admins of both orgs.; membership change must be atomic.
- Technically remains to clarify how readable history of inactive organization is.
- Technically remains concrete image allowlist and PDF/DOCX content handling at implementation.

## 7. Security criterion for portfolio

It is not enough to write “we use Supabase RLS.” For each key threat attach executed positive and negative test, expected/observed result, and document any remaining risk. Do not claim project is fully protected against OWASP threats without actual checks.
