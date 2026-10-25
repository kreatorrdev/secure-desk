# SecureDesk — review of backup of the current demo checkpoint

October 9, 2026. **Executed and verified — PASS for the historical one-owner/empty-Storage checkpoint from October 9.**

The October 10 checkpoint was verified before the first upload: 27 migrations, owner plus seven deactivated test identities, two companies/two projects/three tickets and zero attachments/Storage objects. After that, a user snapshot confirms a small TXT attachment; a fresh full Storage inventory was not read. Do not run this strict one-owner helper again without a new review. Before reactivation, the new resume script saved a full copy with 27 migrations and test business data; its subsequent isolated restore passed. That copy represents the pre-resume checkpoint, not later changes. Before the 27th migration, a function/catalog preimage was saved, which is not a full backup. [Conflict fix and continuation review](HOSTED_CONFLICT_FIX_REVIEW.md).

The first backup was created before migrations. We now want to verify that the existing schema, owner account, and request decision can be restored. Creating an archive is not enough: the test must load it and verify the data.

## Exact scope

- securedesk-dev only (zljdbilnlwdjyeoogzaz), PostgreSQL 17.11 and the exact ledger of 26 reviewed migrations.
- One existing, email-confirmed SecureDesk Demo Owner, Super Admin/Active, first request Approved.
- No companies, tickets, attachments, or Storage objects; three private buckets.
- Hosted connection with verify-full TLS and server-side read-only protection.
- Backup remains on E: in the ignored `.tools/verification/phase7/hosted-current-…/` space. It contains private Auth/business data, not the DB password.
- Restore exclusively in a new dedicated Docker container: network=none, no ports/bind mounts, cron.launch_active_jobs=off.
- Compare digests of 22 business tables, Auth users/identities and Storage buckets; RLS/ledger and existing owner status.
- Only the created temporary space is removed, after verifying its ID/label. The archive remains. Live databases are not restored or reset.

The database does not contain Storage bytes. The inventory of that historical checkpoint was empty; a later test with fictional attachments must include separate storage and return of actual files. This test is not recovery of all Supabase managed services nor a test of login with a restored password.

## How the user runs it

In the VS Code PowerShell terminal:

```powershell
& 'E:\portfolio\secure-desk\.tools\backup-current-hosted-demo.ps1'
```

Enter the saved **database password** via a hidden prompt. The API publishable/secret key is not the DB password. Only the final PASS or error message goes in the conversation.

## Completed preparation

Syntax PASS; absent private input rejected before client/network; actual populated local snapshot rejected, with read-only reads and zero local writes. Private proof: `.tools/verification/phase7/current-backup-helper-preparation.json`.

An intentional missing-input attempt created a FAIL/input test record; that is not an actual hosted backup attempt. The user ran the script and sent the final PASS message. Private report `.tools/verification/phase7/hosted-current-backup-restore.json` was reviewed and confirms actual PASS. After adding other fixtures, this strict checkpoint guard requires a new review.

## Actual result

The test started October 9 at 21:07:24 UTC. The archive is 850.600 bytes and 1.151 catalog entries. All 25 table digests match; exactly 26 migrations, 22 public and 1 private RLS table, three private buckets, owner Active/Super Admin and Approved request preserved. Hosted snapshot and source archive unchanged. Temporary space removed; both live databases untouched. DB password not saved.

In that historical checkpoint actual Storage bytes were zero. The next recovery test after fixtures must include their populated database and separate files. Login with restored Auth hash and full managed Supabase services are not in scope for this test.

## New copy and actual isolated restore — October 10

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match the pre-resume checkpoint, exact ledger of 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mounts, scheduler off; temporary container removed, archive unchanged. This is the copy before the repeated test, not after it. No Storage objects/bytes; populated-byte recovery still remains.

The database password or backend key was not used in this follow-up test: the already saved private archive was read. Supabase managed Auth/API/Storage services were not restored nor was login with restored Auth hashes tested. Proof: `.tools/verification/phase7/hosted-role-resume-backup-isolated-restore.json`.

## Boundary of existing copies after the first attachment

User snapshot from October 10 (display 11:47 UTC) confirms the message Your private file was uploaded., securedesk-small.txt, 82 B and author SecureDesk Demo Owner. PASS is limited to display of successful upload of the small TXT. Production ticket was the intended destination, but URL is not visible on the screenshot; agent Chrome control is unavailable. Original 82 bytes/SHA-256 verified against the preparation manifest, which remains an unchanged historical record. Download and comparison of actual downloaded bytes are not yet verified. The 10 MiB limit, negative formats, role/replay/revocation, cookies/HTTP/logout and Storage byte recovery remain open. Current database/Storage inventory was not re-read; earlier zero-file state applies only to dated checkpoints. Private proof: `.tools/verification/phase7/hosted-https-small-upload-user-proof.json/png`.

No existing pre-upload archive represents recovery of a subsequently uploaded file. Helpers that expect empty attachment/Storage inventory must not be run again without a separate review.

## Downloaded small TXT — October 10, 12:32 UTC

The user reported downloaded file C:/Users/rcf11/Downloads/securedesk-small.txt. The file was read from the exact reported path and compared to the prepared original: **PASS — both have 82 bytes, fully identical content and SHA-256 d5834e33cae9ac6d0e4e6d6f3870bca6a92d0f01642392442871e1f813e1debf**. Proof: `.tools/verification/phase7/hosted-https-small-download-byte-comparison.json`. This confirms integrity of that user-downloaded file after the previously documented upload. HTTP headers/cookies and the browser request itself were not reviewed by the agent. Exact 10 MiB, rejection of oversized/fake/unsupported file, other formats, role/replay/revocation and Storage-byte recovery remain open; Gate 7 is not complete. Preparation manifest and earlier upload proof remain unchanged.


## Preparation of fresh copy with actual test files — October 10

Separate private backup-hosted-demo-storage.ps1/.mjs were prepared, without execution on the hosted project. 55/55 guard/mock-stream tests and Node/PowerShell syntax PASS; 27 migration/eight source fixture hashes verified. New read-only SQL test in the existing local database compares 29 tables / 6956 rows before/after, with no change; local database was correctly rejected as hosted fixture. Guard expectation is exactly eight known ready owner attachments/private objects; fresh inventory not yet read. New copy should include the database and actual GET file bytes, with restore only in a new network=none container and return of bytes to its filesystem. No new privileges or resets; credentials entered only in hidden local prompt and not stored. Actual copy/restore still pending, as is full managed-service recovery/HTTPS matrix. [Scope, private input and boundaries](HOSTED_STORAGE_RECOVERY_REVIEW.md). Gate 7 remains open; Markdown was not sent to GitHub.

## Actual copy of database and eight Storage files — October 10, 14:12 UTC

The actual user-run result was verified: **PASS — fresh database and all eight known private attachments were saved and trial-restored in isolation.** Read-only inventory confirms eight ready attachment rows and exactly eight linked ticket-attachments objects; seven test identities are banned, with no active privileges/sessions/refresh tokens. Owner profile and first Approved request unchanged.

New database.dump archive has **879.560 bytes / 1.151 catalog entries**, SHA-256 4442eaff1bb772cfd18b91d280fc58a02cd32ea9c509c96a73e849f083082f5e. Eight separately saved file-byte files total **10.488.380 bytes**, including exact 10 MiB TXT. Archive and manifest saved in E:/portfolio/secure-desk/.tools/verification/phase7/hosted-populated-2026-10-10T14-12-45-659Z/. Not sent to GitHub.

Actual isolated restore compared **29 tables / 79 rows, 27 migrations, 110 function definitions with owner/ACL/security metadata, 18 policies, 22 public and one private RLS table, three private buckets and all file links**. All eight files were read from actual Storage, saved privately, restored to isolated filesystem and read back with identical sizes/SHA-256.

Independent follow-up local review confirmed existing dump archive/manifest, all eight saved bytes against originals and recovery proof, and unchanged hashes of reviewed helpers. Docker review confirms no remaining container with this test label. Runtime proof confirms network=none, no ports/bind mounts, scheduler off, unchanged hosted snapshot and removed exact temporary container. Live databases were not restored/reset; credentials were not saved.

Private proofs: hosted-populated-backup-storage-restore-2026-10-10T14-12-22-809Z.json and hosted-populated-recovery-result-review.json. This completes verification of this database/file-byte copy. Full operational recovery of managed Supabase Auth/API/Storage services or login with restored Auth hashes is not claimed. Full hosted file-role/parent/replay/revocation, HTTPS cookie/header and maintenance/schedule verification remain open; **Gate 7 is not complete**. No change to application code, deployment, approved specification or actual privilege assignments.
