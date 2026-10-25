# SecureDesk — new copy of database and test Storage files

October 10, 2026. **EXECUTED AND INDEPENDENTLY REVIEWED — PASS for fresh database and eight file-byte attachments; Gate 7 is not complete.** Approved v1.0 was not changed.

The database holds the link between tickets and attachments, name/size/hash and access rules. File content is stored by a separate Storage service. Previously successfully restored checkpoints had empty Storage; they do not prove return of later uploaded files. The new test covers a fresh database and actual bytes of eight already prepared benign owner attachments (seven allowed formats, with two TXT examples).

## What the new test does

1. TLS verify-full and SQL read-only: confirms exact securedesk-dev project, ledger of 27 migrations, unchanged owner profile/Approved request, deactivated seven fictional identities and existing exact companies/projects/tickets.
2. Accepts only exactly eight ready owner attachments on the reviewed Company A ticket, their known names/MIME/sizes/SHA-256 and corresponding eight private objects. Preparation guard was confirmed at actual execution: fresh hosted inventory contains exactly these eight attachments/objects. Unknown, extra, uploading or mismatched object stops workflow before copy and download.
3. Saves new private full database.dump archive on E:, without overwriting earlier archives. Only GET reads actual bytes of those eight known Storage paths with existing backend key. Each response is time/size limited and must fully match prepared SHA-256/size. Saves eight .bin files and manifest of their DB/Storage links, without key or password.
4. Re-reads snapshot. Change during copy aborts PASS: we do not accept mismatched copy.
5. Restores dump only in a NEW temporary PostgreSQL container: network=none, no published ports/bind mounts, scheduler off. Does not restore/reset hosted or existing local database. Compares 29 table digests, exact ledger, function definitions/owner/ACL/security configurations, 18 policies and attachment/private bucket links.
6. Restores saved bytes to private filesystem of that isolated container and reads them back. All eight must be identical to archive/original fixture hashes and match restored attachment links. Verifies disk archive/manifest were not changed. Removes only the exact newly created container, verifying its ID, name, owner label, image, user and isolation; private E: copy remains.

## Confirmed preparation

- 55/55 local tests: rejection of other project/namespace/owner, unknown users/files, active test privileges/sessions, wrong parent/bucket, path traversal, fake metadata/hash and unsafe/other container; limited GET reads and rejection of oversized/corrupt bytes. Mock GET is not actual Supabase result.
- Node/PowerShell syntax PASS; all 27 migration and eight original fixture hashes verified; local Docker/cert/image preflight PREPARED.
- Both new SQL queries were actually parsed/executed read-only in existing local database. All 29 compared tables / 6956 rows unchanged before/after those reads. Actual local database was correctly rejected by exact hosted guard.
- Storage GET path follows installed supabase/storage-js download code; no reusable signed download URL, redirects or new privileges.
- App code, Supabase privileges, production deployment and GitHub code export were not changed. All helpers and proofs are in ignored `.tools/` folder; Markdown remains local.

Private proofs: hosted-populated-backup-preparation.json, hosted-populated-backup-local-query-check.json and hosted-populated-recovery-helper-review.json in `.tools/verification/phase7`. Earlier empty/pre-resume backup helpers and their dated proofs were not changed and are not run for this new inventory.

## Private input and execution

In the existing VS Code PowerShell terminal run only this command:

```powershell
& 'E:\portfolio\secure-desk\.tools\backup-hosted-demo-storage.ps1'
```

First hidden prompt: saved Supabase DATABASE password, which was reset earlier (not SecureDesk login password). Second: existing backend sb_secret key saved in Vercel, not publishable key and not personal access token. Do not send values in conversation. Do not change application data during the test. Wrapper restores previous process environment values and releases SecureString/BSTR; helper does not record credentials or publish raw errors. JavaScript string memory is not a guarantee of cryptographically verifiable RAM wiping.

Criterion for final result (actually confirmed in dated result below): PASS for fresh database, catalog/ACL/RLS and eight saved/restored files, removed exact temporary container, preserved live databases and private E: archive. If verification stops, partial copy remains private for review; no PASS claim or blind reset.

## Boundaries

This is a test of PostgreSQL data/ACL and file-byte recovery in isolated filesystem. It does not represent full operational recovery of Supabase managed Auth/API/Storage services or login with restored Auth hashes. It does not verify privileges of all user roles on hosted attachments and does not replace HTTPS cookie/header/replay/revocation matrix. Previously reported download after logout remains history with unconfirmed cause; repeated fresh account/CSV checks were rejected, without code fix.

## Actual copy of database and eight Storage files — October 10, 14:12 UTC

The actual user-run result was verified: **PASS — fresh database and all eight known private attachments were saved and trial-restored in isolation.** Read-only inventory confirms eight ready attachment rows and exactly eight linked ticket-attachments objects; seven test identities are banned, with no active privileges/sessions/refresh tokens. Owner profile and first Approved request unchanged.

New database.dump archive has **879.560 bytes / 1.151 catalog entries**, SHA-256 4442eaff1bb772cfd18b91d280fc58a02cd32ea9c509c96a73e849f083082f5e. Eight separately saved file-byte files total **10.488.380 bytes**, including exact 10 MiB TXT. Archive and manifest saved in E:/portfolio/secure-desk/.tools/verification/phase7/hosted-populated-2026-10-10T14-12-45-659Z/. Not sent to GitHub.

Actual isolated restore compared **29 tables / 79 rows, 27 migrations, 110 function definitions with owner/ACL/security metadata, 18 policies, 22 public and one private RLS table, three private buckets and all file links**. All eight files were read from actual Storage, saved privately, restored to isolated filesystem and read back with identical sizes/SHA-256.

Independent follow-up local review confirmed existing dump archive/manifest, all eight saved bytes against originals and recovery proof, and unchanged hashes of reviewed helpers. Docker review confirms no remaining container with this test label. Runtime proof confirms network=none, no ports/bind mounts, scheduler off, unchanged hosted snapshot and removed exact temporary container. Live databases were not restored/reset; credentials were not saved.

Private proofs: hosted-populated-backup-storage-restore-2026-10-10T14-12-22-809Z.json and hosted-populated-recovery-result-review.json. This completes verification of this database/file-byte copy. Full operational recovery of managed Supabase Auth/API/Storage services or login with restored Auth hashes is not claimed. Full hosted file-role/parent/replay/revocation, HTTPS cookie/header and maintenance/schedule verification remain open; **Gate 7 is not complete**. No change to application code, deployment, approved specification or actual privilege assignments.
