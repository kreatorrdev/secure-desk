# Organization change requests — Phase 3

Date: 7 October 2026. Local application and Supabase; no cloud writes.

## User flow

Active Client gets **Your organization transfer** on account and **Request organization transfer** on company profile. On /organizations/transfer they enter destination company code and optional reason. Request stays Pending: current membership and access last until decision. One user can have at most one Pending transfer.

Responsible administrators open **Review transfers** on account/profile, i.e. /organizations/transfers. Source administrator confirms departure, destination administrator confirms arrival. First consent does not change membership. Second valid consent completes transfer. Super Admin can alone make final decision. Administrator of either involved company can reject request with reason; rejection does not change membership.

Completion in one transaction closes old membership episode and opens new with same change time. There is exactly one active Client membership. Same JWT and browser cookie immediately lose access to old company/projects and gain new company and its General Support. Old membership, requests and audit remain preserved. Future tickets are not selected by this procedure.

Display has Pending/Reviewed/All filters, pagination 25 records with lookahead row, English text, loading/empty/error states and existing System/Light/Dark theme. New user page shows only own history. Does not reveal private destination data before membership nor old company name after loss of access.

## Approved scope and technical choices

Foundation is US-06, rule 32 and subsequently confirmed consent of both companies, and row 29 in PERMISSIONS_MATRIX. Code serves exclusively for submitting request; membership arises only through separate decision. Initial join flow from previous step remains separate.

Thirteenth migration 20261007180000_organization_transfers.sql adds:

- organization_change_requests: own user, source/destination, exact initial membership episode, access revision, code UUID, reason, status, reviewer and time, rejection reason and revision.
- organization_change_approvals: immutable historical consents of source/destination administrators, with profile and assignment revisions.

Both tables have RLS and no direct application or service_role table grants. Four authenticated RPCs with SECURITY DEFINER and empty search_path check real Auth identity, live role and scope: own_organization_transfer_context, submit_organization_transfer, review_organization_transfer and organization_transfer_requests. Private transfer_consent_valid is not available to application.

Administrative consent is valid only while profile, confirmed/non-anonymous/non-banned Auth identity, assignment and company are eligible, with same revisions. Revoke then re-grant assignment does not revive old consent. New one is required. SA decision does not add fictional consents.

Before send/approval identity, request, relevant memberships, companies and assignments are locked. Expected revision prevents overwriting old decision. Before completion both active companies, exact source episode, unchanged Client access and active destination General Support are checked. Code is checked on submission; later code revocation does not cancel already submitted request.

For this small MVP transfer writes use shared transaction advisory lock, then existing identity/org locks. Thus concurrent transfers are serialized and opposite consent lock order is avoided. This limits parallel throughput and should be re-evaluated if volume grows. Existing controlled role/assignment writes were not reworked.

Code entry shares private limit of previous join flow: five attempts in 15 minutes per confirmed identity. Invalid, expired, revoked, same-company or unusable code gives generic response. Code is not returned in error nor written to audit. Reason is at most 2000 characters. Additional network/multi-account limit belongs to hardening phase.

Administrator gets limited DTO for transfer in their scope: submitter name/email, names of two companies, status, reason, time and live decision capabilities. No company contacts, member list, source code, hash, assignment UUID or other global profile. Client DTO does not return email/name or company data they currently may not read.

Server Actions repeat Auth/role check, accept only allowed fields and pass decision to DB authorization. Arbitrary actor/user/company/status/role parameters cannot extend rights. Approval requires confirmation of effect; rejection reason. Stale forms give readable message. Redirects and notices are predefined; private pages inherit no-store protection.

## Executed checks

| Set | Result |
| --- | --- |
| New SQL test with rollback | 100 / PASS |
| Full SQL/RLS set, 13 files | 1095 / PASS (995 previous + 100 new) |
| Real Auth/API/native Next.js form/cookie test | 364 / PASS |
| ESLint, including trial script | PASS |
| TypeScript and production build | PASS |
| Browser: SA history/filter, mobile and desktop view | PASS |

SQL covers anonymous and service_role bans, all roles, unapproved/unconfirmed/banned identities, private grants, own request, foreign UUIDs, both consents, SA decision, rejection, old revisions, revoke/regrant and ban of previous reviewer, inactive company/General Support, changed source episode, quota and immutable history. Intentionally caused error on final audit write proves rollback of entire transfer: source stays active, no new membership, request stays Pending and no partial completion audit.

Command npm run check:organizations:transfers:web -- --create-demo creates eleven new fictional accounts and two companies per trial, exclusively on verified local Docker project/origin. Business changes use real Auth RPCs and native Next.js forms. Owner write serves only temporary fixture bootstrap and final revocation of trial privileges.

364 checks include signup/email/login, all roles, private/no-store, unexposed tables, fake parameters, copied forms, Origin, XSS text, first/second OA approval, stale form, same-session revocation and new access, SA native approval, native rejection/retry, concurrent OA consents, revocation/regrant, shared UI/RPC quota, DTO/audit privacy and filters. Two earlier trials stopped due to test preparation (approval before routing) and wrong interpretation of HTML metadata title as available content. Test script was fixed; two full trials are PASS, including repeat with earlier transfer history. Cleanup of all four trials is confirmed.

Intentional foreign-Origin POST causes expected Invalid Server Actions request in server log, without business change.

Browser review uses existing SA session and fictional data. Confirmed were loading, empty Pending list, Reviewed filter, approved/rejected history, literal script text, Dark at viewport 390 × 844 and Light at 1280 × 900 without horizontal overflow. Browser error/warn list is empty. Theme/viewport restored to previous System/default state. Evidence transfers-browser-mobile-dark.jpg, transfers-browser-desktop-light.jpg and transfers-browser-preview.jpg remain in ignored .tools/verification/.

Fresh login for every role, browser click on approval and browser error-retry were not repeated; real form submission, access and decisions are covered by native HTTP/API test. This is not complete browser E2E nor final Gate 3.

## Preserved data

All ten earlier business tables have unchanged count/hash check after migration and SQL rollback. Each API trial checked unchanged previous UUID/rows by hash. No reset or history deletion.

All four trials together retained 44 fictional accounts and eight companies. Final: **133 profiles, 36 companies, 13 migrations**. One previous permanent Super Admin. Trial privileged roles, active Staff/Admin assignments/project permissions and Auth sessions of all 44 accounts: **0**. Active codes: **0**. No change to approved sources, .env.local or previously applied migrations.

## Remaining in Phase 3

Transfer micro-step is complete. Next are active projects and General Support display, then project proposal with attachments, staff reviewer and administrative decision. After their checks comes final Gate 3: Client cannot directly create active project, Staff requires special permission, proposals have limited visibility, and transfer immediately revokes old access.

Gate 3 remains open. User will be notified when everything in Phase 3 and final verification are done. Phase 4 is ticket module with role-based dashboard.
