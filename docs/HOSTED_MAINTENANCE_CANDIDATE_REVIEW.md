# SecureDesk — controlled test of private attachment maintenance

**Current October 11 after 20:29 UTC: manual maintenance of this candidate is fully proven and terminally complete. Do not run listed historical Prepare/Check/Run commands again. Daily caller and rest of Phase 7 remain open. Details in [final review](PHASE7_MAINTENANCE_UI_REVIEW.md).**

Status — October 10, 2026: **actual hosted candidate PREPARED, waiting actual 24 hours; local preparation PASS**. Gate 7 remains open. Approved v1.0 specification not changed.

## Purpose and existing proofs

Next test verifies removal of one abandoned fictional file through actual Vercel maintenance flow, while preserving eight existing ready attachments and owner. Earlier actual manual Cron Run returned 200 with empty batch; it does not confirm removal of old object or daily scheduled execution. Hosted file metadata/parent/direct Storage denial/same-JWT revocation separately confirmed with 244 PASS / 0 FAIL.

## Reviewed scope

- Exact closed securedesk-dev project zljdbilnlwdjyeoogzaz; all seven existing fictional identities remain banned, with no active privileges/sessions/refresh tokens. Owner and Approved request unchanged.
- Prepare creates only ONE new private attachment-quarantine object of 82 bytes, random UUID without upsert, with dedicated fixture namespace/purpose metadata. Uses known securedesk-small.txt and its actual SHA-256. Does not create public.attachments row, ticket, user or new assignments.
- SQL reads through TLS verify-full and default_transaction_read_only=on; Storage upload/download/remove only via Storage API. storage.objects.created_at or any Storage metadata row not changed with SQL. [Official Supabase rule](https://supabase.com/docs/guides/storage/schema/design) requires managing objects through API.
- Private checkpoint reserved before upload request; unknown outcome not automatically retried. After successful upload records actual Storage object ID, server creation time and earliest check time: 24 hours + 90 seconds. Before that deadline no cleanup attempt for this test.
- Saves current digests of 28 tables outside storage.objects, existing file/object metadata set, owner and functions/RLS policies. Changed inventory, other object or new privileges abort test before manual run. If data/privilege changes intentionally during wait, checkpoint review required; do not overwrite it or weaken guard.
- If candidate exists, Check verifies ownership, exact bytes, age by database hour and that only it is eligible for cleanup. Only then guides user to existing Vercel Settings → Cron Jobs → Run. For this test does not read CRON_SECRET, create bypass or change protection or schedule.
- After user-reported status 200 verifies absence of that single object and its bytes, eight original attachments and protected rows. Status 200 is user report, without independent wire/log capture; this proof does not confirm daily scheduled caller.
- If object already missing at Check, result is OBSERVED_ABSENT: actual absence and preserved files, with unconfirmed cause/executor. Not automatic PASS of manual/scheduled invocation. Separate runtime/log proof required.
- In failed preparation cleanup limited to object just successfully created after re-verification of identity/metadata/bytes. Unconfirmed cleanup or unknown upload outcome require review, without blind repeat.

## Actual local preparation verification

**38/38 guard tests PASS**: changed target/namespace/bucket/path/hash/size/owner/time/deadline, foreign ID, other parent, extra/missing file, changed original table digests/policies/functions and re-active test privileges rejected. Boundary of actual 24 hours + 90 seconds and database hour verified. Authentication or Storage service failure not accepted as proof file absent.

**10/10 actual local API checks PASS** on exact http://127.0.0.1:54321, with verified local Docker labels and local service-role key without printing. One new UUID/82-byte object uploaded, metadata and server time read read-only SQL, download bytes/hash identical, then only that new object removed through API. SQL inventory and API confirm absence. Previous Storage/bucket/attachment/Auth user/profile digests identical before/after; hosted service not contacted.

First local read-only attempt stopped before upload due to empty SQL result for absent row. Null result interpretation corrected; earlier FAIL saved. Repeated actual local test passed. Actual SDK missing-object shape is StorageApiError, HTTP 400 / statusCode 404 / NoSuchKey; helper distinguishes from AccessDenied, NoSuchBucket and provider error. [Supabase error codes](https://supabase.com/docs/guides/storage/debugging/error-codes) preserves explanation of old/new codes.

Node and PowerShell syntax PASS. Actual hosted helper rejects missing private inputs in input phase before Docker/network, without new object. Private preparation proof records hashes of all five reviewed source/test files. Hosted Prepare/Check test not run.

Private proofs in `.tools/verification/phase7`: hosted-maintenance-candidate-preparation.json; maintenance-candidate-local-api-probe-2026-10-10T16-12-01-306Z.json; historical maintenance-candidate-local-api-probe.json; new input-denial timestamp result. Private helpers: check-hosted-maintenance-candidate.ps1/.mjs and hosted-maintenance-candidate-plan.mjs. No credentials in proofs.

## User private input and waiting

In PowerShell run:

```powershell
& 'E:\portfolio\secure-desk\.tools\check-hosted-maintenance-candidate.ps1'
```

Saved Supabase DATABASE password and existing backend sb_secret key enter only in two hidden prompts. Not available to agent; not new approval but already approved work. Do not enter SecureDesk account password, publishable key, access token or CRON_SECRET. Wrapper restores earlier process environment values and releases SecureString/BSTR; credentials not recorded.

If result is PREPARED, actual 24-hour deadline starts only from server time of new object. Script prints earliest UTC time. After that time:

```powershell
& 'E:\portfolio\secure-desk\.tools\check-hosted-maintenance-candidate.ps1' -Mode Check
```

If WAIT returned, do not run maintenance for this test. If READY returned, follow instructions for existing Vercel Cron manual Run and in local console enter only status 200 from new log, without headers or keys. [Vercel cron job management](https://vercel.com/docs/cron-jobs/manage-cron-jobs) is reference for manual run and logs. If OBSERVED_ABSENT or FAIL returned, save checkpoint and send only status for review.

## Boundaries and documentation

Hosted actual candidate creation is PREPARED and independently reviewed; actual aging/removal, manual outcome and daily invocation still pending. Earlier dated preparation records remain history. Local API upload/delete does not represent hosted PASS. Business auto-close/retention outcomes, full application HTTPS cookie/header/role/download/content-bypass/upload-capability-replay/proposal matrix and final review remain separate. Domain/custom SMTP and public publishing deferred by user decision.

Browser tool connection in this verification did not return state before deadline expiry; Chrome UI not changed. That is not application finding. New hosted steps require private user input and later actual elapsed time; not executed from agent process.

Separate follow-up review of local code-only export confirms 4 reachable commits / 243 blobs / zero Markdown or private paths in history / zero recognized credential patterns or owner email. Export clean, HEAD beec078; no remote fetch or new push. This is limited pattern scan. Application code/deployment not changed. All documentation remains in original local Git; not sent to GitHub.

## Actual maintenance candidate created — October 10, 17:22 UTC

**PREPARED confirmed** from actual user-run result. One new private attachment-quarantine object of 82 bytes created through Storage API. Source bytes/SHA-256, dedicated metadata and actual server creation time verified in helper; record confirms eight ready original attachments, owner and retired test access preserved. No file deleted, SQL Storage metadata changed, application, protection, schedule or deployment changed.

Server creation time: 2026-10-10T17:22:54.825664+00:00. Earliest Check time with actual 24 hours + 90 seconds: **2026-10-11T17:24:24.825Z**, i.e. **October 11, 2026, 19:24:24.825 Europe/Budapest**. For simple user instruction: **October 11 after 19:25 local**. Before that time no cleanup attempt for this test.

Independent local review verified proof/checkpoint consistency, exact object ID/bucket/path/82-byte hash, 28 protected table digests, calculated deadline and unchanged hashes of five previously reviewed helper/test source files. That review does not represent new hosted SQL/API read. Original preparation proof remains historical record before creation.

Private proofs: hosted-maintenance-candidate-2026-10-10T17-22-51-989Z.json; hosted-maintenance-candidate-checkpoint.json (WAITING_24_HOURS); hosted-maintenance-candidate-prepared-review.json. Everything remains in `.tools/` and original local Git; no credentials or Markdown push.

After October 11, 19:25: check-hosted-maintenance-candidate.ps1 -Mode Check, with two hidden private inputs. Do not repeat Prepare. Possible WAIT/READY/OBSERVED_ABSENT outcomes and manual Run flow described in [HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md](HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md). **Actual removal/manual outcome/scheduled caller not yet PASS; Gate 7 remains open.** No reminder or automatic future run created.


## Fresh read-only Chrome maintenance review — October 11, 18:53 UTC

[Actual UI and byte review](PHASE7_MAINTENANCE_UI_REVIEW.md) confirms 28 protected table digests, full snapshot/retirement shape, owner and eight original file/object metadata sets, 27 migrations, 110 full functions and 18 policies. Only eligible object is dedicated 82-byte candidate; actual native Storage download has identical bytes/hash. Existing checkpoint and five helper hashes remain unchanged. Read-only SQLSTATE 42725/42601 attempts and repair history saved; final v5 passes. Original CLI Check and local EXPLAIN not executed.

Database cron execution succeeded today confirmed read-only for audit-retention 03:15 and auto-close 18:53 UTC; controlled hosted business outcomes and Vercel daily caller remain separate. Existing Vercel Run prepared, but awaits exact action-time confirmation for removal of only one test file. No deletion/completion PASS, new Auth/business session/writes, app/deployment/schedule/protection change or reset. **Phase 7 remains open; documentation and proofs remain local/private, without Markdown push.**


## Approved manual Run and actual postcheck — October 11, 19:15–19:16 UTC

[Actual maintenance UI review](PHASE7_MAINTENANCE_UI_REVIEW.md) now records user action-time confirmation, repeated full guard/fresh 82-byte comparison, one Vercel Run and independently read GET 200 at 19:15:02.541 UTC. SQL at 19:16:00.929741 UTC confirms candidate absent, zero eligible objects and all preserved protected 28 digests/owner/retired-7/original-8/catalogue invariants. Fresh Storage UI empty. Direct authenticated NoSuchKey GET and new byte comparison of original eight remain pending, with prepared read-only single-key helper without Docker. Strict checkpoint unchanged until full composite review; original CLI Check not executed.

Daily caller not confirmed by manual call. Vercel Hobby UI longer Timeline requires Pro; existing 03:30 UTC daily window outside current available scope. No upgrade/schedule/protection/app/deployment change or automatic reminder. **Phase 7 remains open.** Documents/proofs remain local/private without Markdown push.


## Completed manual maintenance verification — October 11, 20:29 UTC

[Final review](PHASE7_MAINTENANCE_UI_REVIEW.md) assembles actual Vercel GET 200 at 19:15:02.541 UTC, fresh pre-Run full SQL/82-byte proof, post-Run SQL/UI absence, authenticated Storage NoSuchKey with positive CSV auth control and all eight identical original files (10.488.380 bytes), then new read-only SQL at **20:29:57.063204 UTC**. All 28 protected table digests, 27 migrations, 110 full functions/ACL, 18 policies, three private buckets, owner Active/Approved and seven retired identities without privileges/sessions remain preserved. Zero other eligible objects.

Private composite review is PASS; original WAITING checkpoint archived byte-for-byte under hosted-maintenance-candidate-checkpoint-before-terminal-2026-10-11.json (same SHA-256 75d9bd64cf2da2149055385e0c68aaeda51004e2196e200dca4ab6803c5942ae). Current checkpoint has existing terminal manual status REMOVAL_VERIFIED_AFTER_MANUAL_REPORT and explicit independent UI/SQL/API provenance. All original candidate/digest fields and helpers preserved. **Original CLI Check not executed, Run not repeated, daily caller not confirmed.** Maintenance ban on new Auth/business tests now resolved; each next test still requires its own fresh controlled precheck and final preservation/retirement.

Earlier CommandNotFound due to path and first invalid_private_input before Storage request remain separate FAIL records; later actual PASS does not overwrite them. No change to application, deployment, schedule, protection, cost or public publishing. **Phase 7 remains open** for session/application file-role/proposal/business/UI/final matrix. Documents and proofs remain local/private, without Markdown push.
