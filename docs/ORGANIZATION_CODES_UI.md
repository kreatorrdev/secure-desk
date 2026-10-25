# SecureDesk — organization codes and initial requests / Phase 3

**Date: October 7, 2026. Result: local implementation and checks passed.** Gate 3 remains open; transfer of already approved members is next micro-step.

## User flow

Responsible Organization Admin or Super Admin opens **Organization profile → Organization code**. **Issue code** issues code, **Replace code** revokes previous and issues new, and **Revoke code** stops new requests with that code. Form requires confirmation of change consequences. Valid code may be passed to approved member or intended colleague, and approved member may share it further.

Code shown only in issue response. Refresh or reopening page shows state and expiry, without ability to read source code. If administrator loses it, they issue replacement. Expiry is seven days; this is documented technical default because specification allows expires_at but does not prescribe duration.

New colleague registers and confirms email. On **Your access request**, while initial application Pending and not yet routed to company, they get **Have an organization code?**. Entering valid code routes their existing request to **Pending Requests** of responsible administrator. User stays Pending and has no access to organization, projects or people. They get only own submission status, without name, contacts or company UUID.

Administrator independently verifies data and uses existing **Approve / Reject** forms. Approval atomically activates Client account and first membership; rejection keeps reason and uses existing retry procedure. Revoke or replace code does not cancel already submitted requests or memberships.

## Link to existing model

This small step covers initial Client membership from US-07 and rules 34/49. Verified registration_requests decision already activating first membership exists. Therefore code entry does not create second independent request for same application: it routes same Pending request and records immutable organization_code_submissions submission proof.

Status, reason, reviewer and decision history remain in registration_requests. organization_code_submissions stores request, user, code and organization UUIDs and time, without source code. Specification organization_join_requests table is working technical proposal; its initial flow achieved here with existing request and separate proof, without duplicating decisions. Seven approved sources not changed.

Already approved Client, Staff or Admin cannot through this entry get new membership or change organization/role. Transfer requests and consent of source/destination company belong to next transfer step. Pending request administrator already routed cannot self-change destination via another code.

## Database and protection

Twelfth migration 20261007160000_organization_access_codes.sql adds:

- organization_access_codes: 32 cryptographically random bytes, represented as 64 hex characters; SHA-256 hash stored. One active record per company.
- organization_code_submissions: one immutable proof per initial registration_request UUID.
- private organization_code_attempts: at most five attempts in 15 minutes per confirmed Pending account. Wrong entry returned as result, so counter remains recorded.

New tables have RLS and no direct application SELECT/INSERT/UPDATE/DELETE grants. Private counters not exposed to Data API. Four authenticated RPCs have SECURITY DEFINER and empty search_path. Identity, Auth eligibility, current role and company scope verified on every call.

organization_access_code_state returns to administrator only id, created_at, expires_at and is_usable. manage_organization_access_code locks company/assignment and verifies expected code UUID from form. Two simultaneous replacements cannot silently overwrite each other. Issuing requires active company; OA scope re-verified, including immediate revocation. SA can revoke code for inactive company, and cannot issue new code for it.

submit_organization_access_code locks confirmed identity and their request, verifies attempt limit, then under org lock re-verifies active code, expiry and active company. Code, actor, target company, membership and status cannot be imposed by arbitrary form fields. Repeated same valid entry is idempotent.

Invalid, expired, revoked or unusable code gives same generic response. Valid entry does not return private company data. UI Server Actions repeat identity/authorization, accept only specified fields, do not show raw DB errors and do not return entered code. Issued code display and private pages inherit private/no-store proxy protection.

Audit records issue, revoke and submission with actor/target UUIDs; no source code or hash in metadata. Previously applied migrations and existing write procedures not changed.

## Executed checks

| Set | Result |
| --- | --- |
| New SQL test in rollback transaction | 88 / PASS |
| Full SQL/RLS set, 12 files | 995 / PASS (907 previous + 88 new) |
| Auth/API and real native Next.js forms/cookies | 218 / PASS |
| TypeScript and production build | PASS |
| ESLint, including new test script | PASS |
| Browser: existing SA session, fictional company | PASS |

New command is npm run check:organizations:codes:web -- --create-demo. Uses only confirmed local Docker project, local public key and origin. Creates eight new fictional accounts and two companies, then removes trial privileges, assignments, codes and sessions.

Checks cover all roles and A/B isolation, direct grant bans, forged metadata/hidden field parameters, copied action forms, wrong Origin, stale forms, issue/rotate/revoke/expiry, non-disclosure of source code after refresh, submission without membership, existing administrative approval/rejection, same-session access only after approval, duplicate and concurrent rotation, shared UI/RPC limit and OA assignment revocation.

Intentionally sent foreign-Origin request caused expected Next.js Invalid Server Actions request in server log. Check confirms no business change. That is negative test, not regular usage error.

Browser review covered profile → Organization code, issue, replace, one-time display and source code gone after refresh, final revoke, dark theme at 390 px and light theme at 1280 × 900. No horizontal overflow; browser no recorded error/warn messages. Theme and viewport restored to previous System/normal state.

JPEG evidence codes-browser-mobile-dark.jpg and codes-browser-desktop-light.jpg saved in ignored .tools/verification/. Captured only after revoke, without source code. Browser review through new login of every role, entry with Pending account and intentional error-retry state not executed; those approaches and real form submission covered by stated native HTTP/API matrix.

## Retained data and boundaries

Hash control of all eight earlier business tables matches snapshot before migration, including final browser review. No reset or cloud write. Retained eight new fictional accounts, two companies and probe history.

Final: 89 profiles, 28 companies, 12 migrations. One earlier permanent Super Admin. Active codes: 0. Privileged roles, active Staff/Admin assignments, project permissions and Auth sessions of new trial accounts: 0. No change to .env.local, approved sources or previously applied migrations.

Attempt limit is per confirmed identity; additional network-source limiting and coordinated multi-account attempts belong to hardening phase. This result is not completion of all Gate 3 or production security checks.

## Next micro-step

Organization change request: old access lasts until decision. Transfer may be approved by SA or coordinated responsible administrators of both companies. Final change must atomically end old membership and activate new, so at most one active Client membership exists and access to old company stops immediately. After that review follow projects/proposals from Phase 3.
