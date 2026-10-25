# SecureDesk — controlled roles and organization assignments

Status: October 6, 2026, local backend step completed. The ninth migration was applied without reset. Nine test files, 778 SQL/RLS checks (119 new) and 49 real Auth/RPC checks — PASS. ESLint — PASS. This is a historical backend result; the new read model and forms were completed in [ACCESS_MANAGEMENT_UI.md](ACCESS_MANAGEMENT_UI.md). Gate 2 later passed locally; see [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md).

## Rules and example

Sources are the unchanged spec-v1-approved/DECISIONS.md (#09, #33, #35, #50, #52, #61), USER_STORIES.md (US-08/09, US-15, NFR-01/03) and PERMISSIONS_MATRIX.md.

Ana registers with the same form as every other user. A confirmed email leaves a Client/Pending profile. Super Admin can approve her latest unrouted request as Staff. Approval does not create Client membership, a company, or General Support. Ana has no access to any company until the responsible administrator assigns her separately.

Organization Admin of company A can assign an already approved Staff user to company A and separately enable or disable permission to create projects. They cannot grant a global Staff/Admin role, assign an Admin, or manage company B. Only Super Admin grants or revokes global privileged roles and administrative scope. These operations do not assign the Super Admin role and cannot change an existing Super Admin account.

| Operation | Super Admin | Organization Admin | Staff / Client / Pending |
| --- | --- | --- | --- |
| Approve initial Staff/Admin request | yes | no | no |
| Change global Client/Staff/Admin role | yes, subject to conditions below | no | no |
| Assign / revoke Staff | all companies | own companies | no |
| Staff permission to create projects | all companies | own companies | no |
| Assign / revoke organization Admin | yes | no | no |

Staff grant requires an active company. Super Admin can explicitly grant Admin scope to a pending or active company: existing registration review already supports such pending scope. A new grant to an inactive company is rejected. Revocation of an existing assignment remains available to the responsible administrator even when the company is inactive; that does not open historical review of an inactive company (T-01 remains for its phase).

## Technical decisions in this step

- Initial Staff/Admin approval requires the latest Client/Pending request without organizational routing, a confirmed and eligible Auth account, with no prior membership or assignment history. Approval, profile change, and audit are one transaction.
- Global role change requires an active account and expected access_revision. A Client with active membership cannot be switched by this call: that would require a separate explicit membership change. Existing reviewed requests and memberships are not overwritten.
- An actual role change clears all old Staff and Admin assignments and deletes Staff create-project permission. Restoring a role does not revive old assignments. Re-assignment is a separate administrative decision.
- Demoting a privileged account to Client leaves the account Active without company access. It does not assign Client membership. Membership/transfer use their own controlled flows. Privilege can be revoked on a blocked/deleted Auth account too; that does not remove the Auth ban. A new privileged grant requires an eligible Auth account.
- No self role/assignment change. Existing Super Admin accounts are protected from these operations; the first local Super Admin still uses the separate setup from LOCAL_SUPER_ADMIN.md.
- Profile access_revision advances when global role or account state changes. Assignment revision advances on write. Both are checked for assignment change. Null assignment revision means the assignment does not exist yet, not that an existing one should be overwritten.
- The same decision with current revision is a no-op without duplicate audit. An old revision is rejected even after Staff → Admin → Staff or revoke → regrant cycles.

## Migrations and API

20261006200000_controlled_access_management.sql adds three revision columns/triggers and four authenticated-only RPCs. 20261006201000_role_revocation_scoped_audit.sql adds company audit for implicit revocations through role change. Applied migrations, including the eighth, were not subsequently rewritten.

| RPC | Purpose |
| --- | --- |
| approve_privileged_registration(request UUID, role, reason) | SA approves latest unrouted request as Staff/Admin |
| change_account_role(user UUID, expected access revision, new role, reason) | SA changes global role while revoking old assignments |
| set_staff_organization_assignment(org UUID, Staff UUID, expected access revision, expected assignment revision, active, can_create_project, reason) | SA or responsible OA changes Staff assignment/permission |
| set_organization_admin_assignment(org UUID, Admin UUID, expected access revision, expected assignment revision, active, reason) | SA changes administrative scope |

All operations require a reason (trimmed 1–2000 characters). Actor is confirmed auth.uid(); role comes from stored profile, never from editable Auth metadata or a browser parameter. SECURITY DEFINER functions have empty search_path, explicit schema names, and closed PUBLIC/anon/service_role EXECUTE. Private write helpers are not callable through the application. No new direct table-write grants were given, including to business Super Admin. Profile access_revision column is not publicly extended through SELECT grant; scoped read model for future forms comes in the next step.

Locking uses existing registration actor/target order: actor advisory + Auth/profile share, target registration advisory + profile update, then org/assignment locks and fresh scope checks. Role change/revocation follow the same locks as the current write. RLS reads valid profile and assignments from the database; an old JWT does not retain revoked organizational rights. A request already in progress may finish before revocation, but new requests after its commit have no revoked access.

Audit stores actor, tenant, assignment/profile/request UUID, outcome, and redacted business data. Global role change has global audit. Each cleared assignment additionally gets its company event: the responsible OA sees their event, without another tenant or global role data. No event records password, token, or keys. Failed audit rolls back the entire write, revisions, and other audit events in the transaction. Permanent monitoring of failed attempts/retention remains for the appropriate security phase.

## Checks and boundaries

    npm run db:test
    npm run check:access:local -- --create-demo
    npm run lint

controlled_access_management.test.sql has 119 positive and negative pgTAP checks. All SQL fixture changes are BEGIN/ROLLBACK: no persistent SQL test roles or accounts. The full set has 778 checks across nine files; it passed even after retained API demo data.

check-access-management.mjs verifies real public local signup, Mailpit confirmation, password login, RLS, and RPCs. Personal passwords/keys are not used or printed. The test retains three fictional accounts and two fictional companies/General Support projects after a full run. Local owner write serves only for isolated fixture Super Admin and companies; verified business changes use real Auth JWT RPC calls. This is not a Next.js/native browser form or visual check.

49 checks cover:

- pending/self/anonymous denials and Auth metadata escalation attempt;
- two concurrent Staff approvals with one success and one audit;
- Staff in multiple companies and separate create-project permission;
- two concurrent permission writes and stale revision rejection;
- OA A → org B denial;
- OA revocation during scoped write and denial of their next call;
- global role change during Staff permission write, with assignments finally cleared;
- scoped audit without global/cross-org leakage;
- immediate access loss on existing session, stale role/assignment ABA checks, and controlled demotion;
- restoration of trial privileges and closure of all new Auth sessions.

During this step the first API attempt stopped after the signup/login part due to parsing of test script output. Three pending fictional accounts were retained; trial role was restored and their three sessions closed. Then the core API set passed 47 checks. After adding company audit the final set passed 49 checks. We do not delete trial request/audit history. All new trial Staff/Admin/SA roles were revoked at the end.

Final local state of this step: 27 profiles, 33 registration requests, 8 companies, 5 Client memberships, 7 General Support projects, 4 Staff and 4 Admin assignment rows, 55 audit events, and 9 migrations. Nine new fixture accounts have Client role, their assignments inactive, and 0 Auth sessions. The user's existing Super Admin remains the only permanent SA. Hash check by fixture identities confirmed all earlier rows in eight business tables preserved (new revision columns excluded from old comparison). Hosted database and .env.local were not changed.

The subsequent scoped read model and administrative forms were completed in [ACCESS_MANAGEMENT_UI.md](ACCESS_MANAGEMENT_UI.md), with 841 SQL and 76 native web checks. The final Gate 2 matrix later passed locally in [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md). Organizations/projects and dashboard continue per approved DEVELOPMENT_ROADMAP.md.

Technical sources: [Supabase database functions](https://supabase.com/docs/guides/database/functions), [PostgreSQL 17 locking](https://www.postgresql.org/docs/17/explicit-locking.html).
