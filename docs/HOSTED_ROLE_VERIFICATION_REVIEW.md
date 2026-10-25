# SecureDesk — hosted Auth/API role verification and its continuation

October 10, 2026. **First actual test: 167 PASS / 1 FAIL; test access fully revoked. Business conflict fix applied and deployed. Actual continuation is 182 PASS / 0 FAIL; every test session/privilege revoked again. Gate 7 is not complete.**

## What we verify

Client of company A sees own ticket, but not ticket of another Client from same company or company B data. Staff gets access with current assignment. Organizational Admin sees only own company. Pending and Staff without assignment have no business access.

Test uses actual Supabase Auth logins and Data API with publishable key and separate user tokens. Backend secret serves for supported management of fictional Auth identities only. Limited trusted SQL prepares test business privileges; that is not proof of administrator UI flows. Email is not sent for these identities.

## First actual attempt and fix

Original `.tools/check-hosted-role-api.ps1` executed at 09:02:49 UTC on then one-owner/empty business inventory. It added seven fictional accounts, two companies, two General Support projects and three tickets. Login/access matrix and direct forbidden writes passed. Admin controlled priority change once; stale replay did not give expected result.

All seven identities banned in finally; memberships ended, assignments deactivated and profiles returned to Client/Pending. Zero active test privileges, sessions and refresh tokens; old JWT access and refresh rejected. Owner profile/Approved request preserved, exactly one Super Admin. Business history preserved, without new attachments/Storage bytes.

Provider logs revealed automatic retry of custom 40001 conflict. New migration 27 changes business conflicts to PT409, with existing refresh messages. Application/catalog/data hashes and 4.204 local SQL/RLS checks passed. Original FAIL was not converted to PASS nor deleted. Diagnosis, application, deployment and boundaries: [HOSTED_CONFLICT_FIX_REVIEW.md](HOSTED_CONFLICT_FIX_REVIEW.md).

## Exact scope of continuation

Private `.tools/resume-hosted-role-api.ps1` targets only existing securedesk-dev. Verifies original credential-free retired checkpoint, same seven UUIDs, exact owner, 27 migrations and 22 corrected function hashes. Does not add new Auth identities, companies, projects or tickets.

Before reactivation saves new full private copy of current database. Changes existing test passwords to random values in memory only, removes ban from those seven, restores intended test assignments and adds three new Client membership episodes. Previous ended memberships remain in history. Pending does not get business access. Actual owner and local database are not changed.

Verification covers allowed/denied rows, peer/tenant scope, changed parent, self-elevation of role, direct assignment/ticket/audit writes, service-only maintenance, controlled Admin edit, PT409/HTTP 409 with same stale payload and without duplicate audit, injected create fields and Staff revocation/regrant in same session.

## How private continuation was executed

In VS Code PowerShell terminal:

~~~powershell
& 'E:\portfolio\secure-desk\.tools\resume-hosted-role-api.ps1'
~~~

First hidden input is saved Supabase DATABASE password. Second is existing backend sb_secret key saved in Vercel. Do not enter publishable key or personal access token. Send only final status in conversation.

Values pass only through temporary process environment variables restored in finally; BSTR is released. DB password to client goes via standard input, not through argument/URL/file/log. Generated passwords and Auth tokens are not stored. Raw SDK/error objects are not printed; diagnostics contain only allowed code/status/duration.

Do not run original create helper and one-owner backup helper again without new review: their guards expect old empty state.

## Guards and final revocation

Verify-full TLS with CA check, exact project/PG 17.11, verified historical backup hash and original 26 migration hashes plus new 27 hash. Guard rejects populated local database, active/unexpected fixture accounts, new objects or drift. SQL writes are transactional, limited to those IDs and have timeout. Repeated setup rejected.

Finally independently attempts ban of all seven even with partial reactivation. Revokes their Staff/Admin assignments, ends new memberships, returns profiles to Client/Pending and removes only their Auth sessions/refresh tokens. Owner and history remain. For PASS full matrix and proven revocation of all identities required, zero active privileges/sessions, rejected old tokens and unchanged owner hash.

Original checkpoint/FAIL remain saved. New proof is hosted-role-api-resume.json with hosted-role-resume-checkpoint.json. Leave terminal open until completion. If process interrupts, first review exact checkpoint; do not repeat provisioning blindly.

## Actual completed preparation of continuation

JavaScript and PowerShell parser, missing-input guard and actual read-only rejection of local database: PASS. Isolated PG 17.11 restore with network=none, no ports/bind mounts and scheduler off: PASS.

Isolated SQL test created initial history, revoked access twice, reactivated same seven, preserved three previous ended memberships and added three new episodes. Count of identities/companies/projects/tickets remained same; duplicate setup rejected; second revocation left zero active privileges/sessions and same owner hash. Original archive unchanged, dedicated temporary container/volumes removed.

Proofs: hosted-role-resume-isolated.json, hosted-role-resume-local-guard.json and hosted-role-resume-missing-input-guard.json under `.tools/verification/phase7/`. Helpers and proofs are ignored in Git.

## Boundaries

Isolated SQL test alone is not actual hosted Auth reactivation nor HTTP 409 proof; subsequent actual runtime now separately confirms both in reviewed scope. Matrix does not cover Vercel HTTPS cookies/React forms, upload/download bytes, complete email sending or production security. Fresh copy is now separately restored in isolation; does not cover later test changes or Storage bytes. Remaining criteria are in [GATE7_VERIFICATION.md](GATE7_VERIFICATION.md).

Supported Auth admin procedures: [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid).

## Actual final result — October 10, 11:25 UTC

Actual continuation executed October 10 at 11:25:06–11:25:52 UTC: **182 PASS / 0 FAIL**, full reviewed Auth/Data API matrix completed. Stale edit received PT409 / HTTP 409 for 66 ms, without additional ticket edit or audit. Same Staff JWT immediately lost access after revocation; after regrant old privilege revision remained stale. All seven test identities banned, with zero active business privileges/sessions/refresh tokens. Owner profile/Approved request preserved; exactly one Super Admin. No saved credentials or resets.

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match pre-resume checkpoint, exact ledger 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mounts, scheduler off; temporary container removed, archive unchanged. This is the copy before the repeated test, not after it. No Storage objects/bytes; populated-byte recovery still remains.

Next are actual HTTPS verification of session/forms and attachments. Six local fictional files prepared: small TXT, exact 10 MiB TXT, one byte over limit, CSV, fake PNG with text content and unsupported HTML. Manifest records sizes/hashes/expectations; nothing uploaded. Chrome control connection did not respond even after documented recovery attempt. User was asked to open deployed /account and log in personally; browser results not marked PASS.

Private proofs: `.tools/verification/phase7/hosted-role-api-resume.json`, hosted-role-resume-checkpoint.json, hosted-role-resume-backup-isolated-restore.json and https-fixtures/manifest.json. Original FAIL and initial checkpoint remain saved.

Continuation command is kept here as execution record. For next HTTPS whole, this successful fixture test need not be repeated.
