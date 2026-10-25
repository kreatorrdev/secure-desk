# SecureDesk — Phase 2 / Gate 2 final verification

**Result: GATE 2 PASSED LOCALLY — October 6, 2026.** For anonymous, Pending, Client, Staff, organization Admin and Super Admin there are positive and negative checks, with self-escalation rejected. In verified scope no blocking error found for moving to Phase 3.

## Approved condition and scope

Basis is [DEVELOPMENT_ROADMAP.md](spec-v1-approved/DEVELOPMENT_ROADMAP.md), [PERMISSIONS_MATRIX.md](spec-v1-approved/PERMISSIONS_MATRIX.md), [DATABASE_SCHEMA.md](spec-v1-approved/DATABASE_SCHEMA.md) and [DECISIONS.md](spec-v1-approved/DECISIONS.md). All seven approved files confirmed identical to original ZIP bytes. Sources and ten previously applied migrations not changed.

Verified: eight private business tables, local signup/email/login, cookies and server identity, Pending status, safe local SA setup, approval/rejection/retry, atomic Client/company/General Support flow, separate Staff/Admin assignments, create-project flag, revisions, scoped audit and administrative forms. This closes defined local Gate 2; organization codes/transfer, full project/proposal module, tickets and Storage belong to next phases.

## Permissions matrix

| Identity | Confirmed allowed access | Confirmed denials |
| --- | --- | --- |
| Anonymous | Public Auth forms; confirming GET does not consume email token | All private tables and admin RPC/pages; invalid/forged token |
| Pending / Rejected | Own status and history; rejection reason; only eligible Rejected Client may send new attempt | Organizations/projects/assignments/audit; approving and changing own privileges |
| Client A | Own status; company A, active projects A and own approved membership | Company/projects B, others' profile/status, admin RPC/forms and direct writes |
| Client B | Own status; company B, active projects B and own approved membership | Company/projects A, admin privileges and direct writes |
| Staff | Projects of assigned company; own active Staff assignment; separate create-project permission | Unassigned company, global role changes, admin forms/audit, direct writes |
| Organization Admin | Data and audit A, registration review in A; Staff assignment/permission/revocation A | B/global audit/unrouted requests, global role and Admin assignment, cross-org UUID manipulation |
| Super Admin | Global company/review/access scope; controlled approval, routing and role/assignment RPC | Self change of own SA role, granting SA through signup/forms, direct table-write and Client role transition outside active membership |

Direct profiles SELECT remains limited to own status; administrative details from separate verified DTO/RPCs. JWT alone, role/organization_id from form or user Auth metadata do not grant business rights. Pending route to company changes review scope without membership. Staff/Admin role alone without company assignment does not grant company access.

## Currently executed checks

| Set | Result | Evidence / command |
| --- | --- | --- |
| SQL/RLS and transactions, all ten files | 841 / PASS, even after new web data | npm run db:test; supabase/tests/ |
| New real Auth/Data API/SSR-cookie matrix | 362 / PASS | npm run check:gate2:local -- --create-demo |
| Native Next.js Auth forms / refresh / logout | 38 / PASS | npm run check:auth:web -- --create-demo |
| Native registration review | 61 / PASS | npm run check:registration:web -- --create-demo |
| Native own retry / history | 44 / PASS | npm run check:registration:retry:web -- --create-demo |
| Native role/assignment forms | 76 / PASS | npm run check:access:web -- --create-demo |
| Local SA setup wrapper protections | 5 / PASS | npm run test:admin:guards |
| Read-only connection and valid/invalid anon JWT | 3 / PASS | npm run check:supabase |
| Code, types and production build | PASS | npm run lint, npm run typecheck, npm run build |

Four native web sets total 219 checks; SQL assertion count not increased. Earlier backend SDK probes remain historical evidence in their documents and not added to this total. New harness is scripts/check-gate2-local.mjs; uses only explicitly local origin/Docker project and public local key. Passwords, confirmation tokens and sessions stay in memory. Native web probes run on restarted production build at 127.0.0.1:3000.

362-check set creates six new fictional Auth accounts, confirms email and real login, then verifies seven identities (with two Clients and anonymous). Exact rows of all eight tables, private columns, all three direct write attempts per table/identity and protected GET/navigation have verified results. Controlled decisions use real JWT RPCs; DB owner serves only local temporary SA bootstrap, trial Client membership/Auth ban break and cleanup. SDK session uses installed SSR cookie adapter; separate native tests verify real login/Server Action POSTs.

Specifically confirmed:

- Client A → B and OA A → B remain closed even with known UUID or changed metadata.
- Same Client token loses company/project access immediately after end of trial membership. This verifies RLS revocation; user transfer workflow comes in Phase 3.
- Same Staff/OA token and OA cookies immediately lose scope after revocation; global demotion removes administrative page.
- Temporarily blocked trial OA has no business read/RPC access with old JWT.
- Stale forms and concurrent approval/retry/permission calls cannot overwrite later decision; one success leaves one matching write/audit.
- Client membership, profile, request and unique active General Support created consistently; failure rolls back transaction.
- XSS content displayed as text; foreign Origin, forged cookies, hidden actor/role/status/UUID, File/duplicate fields and invalid reasons rejected.
- Rejection remains in history; new attempt has new UUID/number, stays Client/Pending and does not grant membership.

## Fix in verification and data preservation

First new API matrix passed all role/read/write rows, but stopped at wrong expected error code for SA attempt to change active Client with membership. Database correctly returned business validation 22023; test expected 42501. Test fixed, with additional check of unchanged Client role and active membership. Application and SQL not changed for this case. Cleanup of first probe passed; six accounts/two companies and their history retained. Final new matrix passed 362 checks.

All probes of this final step together retained 25 new fictional accounts and eight new companies. All new accounts have Client role, their Staff/Admin assignments and create-project privileges extinguished, and their Auth sessions total 0. Client demo memberships and audit/registration history remain for review. User real account is only permanent active Super Admin.

Final state: 57 profiles, 67 requests, 18 companies (16 active / 2 pending), 12 Client membership episodes, 16 General Support projects, 10 Staff assignments, 10 Admin assignments, 121 audit events and 10 migrations. Pre/post hash by initial UUIDs confirms no earlier business row changed. Full final SQL ROLLBACK probe also preserves all then-stored rows. No reset or cloud write; .env.local unchanged. Local results/snapshots in ignored .tools/verification/, without credentials.

Final review of 111 versioned/new repo files found no literal configuration keys/tokens or common personal privileged-token prefixes. Git confirms local env/results stay ignored and applied migrations/approved sources have no diff. This is concrete control of this step; broader dependency/security audit remains Phase 6.

## Boundary of this Gate and next step

SQL covers database permissions, real API verifies JWT/RLS/RPC, and native HTTP forms verify Server Actions and cookie flow. Full browser JS-hydration, keyboard/WCAG/mobile, rate limiting, dependency audit and broader security/failure telemetry belong to hardening phase; not presented as executed by this Gate. Boundaries of previous visual review in [ACCESS_MANAGEMENT_UI.md](ACCESS_MANAGEMENT_UI.md).

T-01 historical access to inactive organizations finalized before that module; now non-SA business access closed, with minimal revocation/review DTO exceptions already documented. T-02 retry/history model implemented and verified. T-03 Storage MIME/signature rules come in Phase 5.

Next portion is Phase 3 — organizations and projects. First micro-step prepares organization display in user approved scope, with English text, dark/light tokens and empty/loading/error states. Codes, requests/transfer and full projects/proposals go in their small steps. Tickets and dashboard remain in Phase 4. Approved specification not rewritten for implementation status.
