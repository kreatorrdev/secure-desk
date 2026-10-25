# SecureDesk — administrative forms for roles and assignments

Status: October 6, 2026, local UI micro-step completed. The tenth migration was applied without a reset. Total 841 SQL/RLS checks across ten files (63 new), 76 real Next.js form/cookie checks, ESLint, TypeScript and production build — PASS. The subsequent final matrix passed locally; see [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md). Numbers below record the previous UI micro-step; dashboard remains in its phase.

## Business foundation and practical example

Sources are unchanged [DECISIONS.md](spec-v1-approved/DECISIONS.md), [PERMISSIONS_MATRIX.md](spec-v1-approved/PERMISSIONS_MATRIX.md), [USER_STORIES.md](spec-v1-approved/USER_STORIES.md) and [DEVELOPMENT_ROADMAP.md](spec-v1-approved/DEVELOPMENT_ROADMAP.md). Backend conditions and decisions are described in [ACCESS_MANAGEMENT.md](ACCESS_MANAGEMENT.md).

Confirmed Pending account Ana is approved as Staff by Super Admin. Ana still has no company access. A separate assignment to company A gives her that scope; create-project permission is chosen separately and starts as No. Organization Admin can change Staff assignments only for their companies. Only Super Admin changes global role and Admin scope. Actual global role change revokes all old Staff/Admin company assignments; restoring a role does not revive them.

## Screen and forms

Active Super Admin and organization Admin on /account have Manage Access. /admin/access shows company search and single-account search by exact email. Pending Requests links to this screen for Super Admin review of an eligible unrouted request.

| Form | Who uses it | Effect |
| --- | --- | --- |
| Approve Staff or Admin access | Super Admin | Approves latest eligible request as Staff/Admin; does not create company or Client membership |
| Change global role | Super Admin | Changes Client/Staff/Admin role with removal of all old Staff/Admin assignments |
| Assign Staff / Update Staff permissions | Super Admin or responsible Admin | Grants access to selected active company and explicitly chooses create-project permission |
| Revoke Staff access | Super Admin or responsible Admin | Revokes only the selected company assignment and its create-project permission |
| Assign / Revoke Admin access | Super Admin | Grants or revokes administrative scope of selected company |

Each form has mandatory business reason (1–2000 characters) and confirmation of understanding the described effect. Only currently available operations are shown. Own and other Super Admin accounts have no form for global role change. Client with active membership requires a separate future membership transition. Ineligible Auth account gets no new grants; allowed revocations/demotion remain per backend rules.

## Minimal read model and protections

Tenth migration 20261006210000_access_management_screen.sql adds two authenticated-only read RPCs: admin_access_organizations and admin_access_target. SECURITY DEFINER functions have empty search_path and verify real active, confirmed, unblocked Auth administrator. PUBLIC, anon and service_role EXECUTE are closed. No extended profiles SELECT or direct table-write grants.

Company search is literal, limited to 100 displayed choices with lookahead message. Exactly selected company is verified separately, even when outside the first 100 results or not matching the filter. Organization Admin receives only companies with their active Admin assignments. Minimal name/status of inactive company serves revocation; it does not open business historical review (T-01).

Technical decision for new Staff assignment: responsible Admin who already knows exact email can see minimal DTO of eligible active Staff candidate even when Staff is not yet assigned to their company. No directory, partial email search, or autocomplete. For existing Staff assignment they can load data needed for revocation even when account is no longer eligible. They do not get Client/Pending details, other company history, Admin assignments, or registration content. Super Admin sees data needed for global decision; details of latest Pending request are limited to that flow.

Server Action repeats getUser and current role, re-reads DTO for exact email/company, compares user UUID, profile access_revision, expected request UUID and assignment revision. Revisions travel as strings for bigint precision. Multiple fields, File values, disallowed roles/permissions and invalid fields are rejected. Actor, account_status, assigned_by, arbitrary active and next parameters do not control the RPC call. Each RPC re-locks/verifies identity, scope and revision in the database. Stale form is rejected even after revoke/regrant or Staff/Admin/Staff cycles.

Private responses are no-store/no-referrer through existing proxy. Success redirects only to local /admin/access, invalidates access/request/account views and shows new data. DB error details are not shown. Existing empty/loading/error states, English text, associated label fields, field errors, checkbox and disabled Saving button.

## Evidence and check boundaries

63 new pgTAP checks cover actor/Auth eligibility, anon/service denials, scoped read, exact/case-insensitive email, absence of directory and other company leakage, bounded literal search, capability flags, bigint revisions and existing table grants. Full SQL set passed even after native web probe; hash of all eight business tables confirmed rollback tests preserve stored data.

Native Next.js probe:

    npm run check:access:web -- --create-demo

76 checks use real public local registration, Mailpit confirmation, password login forms, cookie sessions and native Server Action POSTs. Covers concurrent approval (one success/one stale), copied forms, CSRF, forged role/actor/status/UUID, duplicates and File fields, overlong reason, mandatory confirmation, Staff/Admin grant/revoke, create-project permission, immediate OA access loss with existing session, global role change and stale forms after multiple changes. Dashboard /dashboard remains 404.

Visually reviewed real /admin/access in in-app browser, search for one fictional account and its global role form, in existing ~675 px wide view. Screenshot is in ignored .tools/verification/manage-access-desktop.jpg. Browser did not change user privileges. HTTP harness covers real forms and sessions, but does not substitute full JS-hydration/keyboard/mobile E2E review; that broader review remains its phase. Dark/light tokens come in Phase 3 per roadmap.

One full web probe retained five new fictional accounts and two companies/General Support projects with history. All their trial privileges were revoked, assignments inactive and five accounts have 0 Auth sessions total. All earlier rows in eight tables preserved per pre/post hash control. Final state: 32 profiles, 38 requests, 10 companies, 5 memberships, 9 General Support projects, 6 Staff assignments, 5 Admin assignments, 72 audit events and 10 migrations. User account remains the only permanent active Super Admin. Test passwords/tokens were not stored or displayed. Hosted database, .env.local, previously applied migrations and approved documents were not changed.

## Shared review and continuation

Sign in with existing local Super Admin account, open Manage Access on /account and view company/email fields. Global roles only selection serves global role; company selection opens assignments to that company. Look up account is enough for reading, without submitting a rights-change form. Business reason and confirmation describe the concrete decision before it is written.

Final Gate 2 matrix later passed locally, with 362 real API/cookie and 219 native web checks; details in [GATE2_VERIFICATION.md](GATE2_VERIFICATION.md). Next is Phase 3 — organizations and projects. Tickets and dashboard come in Phase 4.
