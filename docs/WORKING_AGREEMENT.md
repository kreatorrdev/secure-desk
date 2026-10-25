# SecureDesk — working agreement, explanations, and approvals

**25 October 2026:** [agreed closed demo acceptance is complete](PHASE7_CLOSED_DEMO_ACCEPTANCE.md), including the last Vercel cron GET 200 evidence. No automatic new phase, public release, or repetition of successful checks. Public roadmap scope remains deferred; earlier open statuses below are history, and other agreement rules stay in force.

24 October — [F05/P06 Origin verification is complete](PHASE7_ORIGIN_COMPLETION.md): 16 actual responses in 10:53:07–10:53:18 Europe/Budapest: 12 application 403s for foreign/null/missing and four correct-Origin anonymous 404s, all private/no-store/nosniff and expected bodies. Six Vercel API steps confirm the new key, its revocation, and preserved original protection/keys; temporary CLI session signed out, all three owned auth folders independently absent. 773 source/evidence hashes, previous 760 unchanged. Two initial interruptions are preserved, both with zero application requests; they are not rewritten as PASS. No new SecureDesk login, file, Storage request, or SQL in this package. Client request Origin was checked; header received on server was not independently recorded. Completed Client/Staff/Closed/Saving and owner empty/missing/link/logout UI are not repeated. Two main items remain: [genuine Vercel daily caller](PHASE7_VERCEL_DAILY_NEXT_WINDOW.md) and final preservation/closed-demo acceptance. Last 205/15 SQL and byte evidence remains 23 October 20:21:54, before the later owner UI cycle; new full 205 archive or new zero-session SQL is not claimed. App/spec/deployment/schedule and user maintenance change were not modified; no commit/push. Older dated statuses below are history. Gate 7 is open.

Updated 11 October 2026. Does not change business specification v1.0 APPROVED.

## Already approved scope

- SecureDesk MVP step by step per docs/spec-v1-approved/; explanations in English, product in English.
- Required local reviews, fixes, and tests; documentation of all significant actions and actual results.
- Local Git commits and tested code in the existing private kreatorrdev/secure-desk repository.
- Separate GitHub history without Markdown files. Original history with local documents is not sent to GitHub.
- Closed Vercel demo with All Deployments authentication and separate securedesk-dev database.
- Independent execution of everything possible through Phase 7, asking only for genuinely missing input or specific confirmations.
- After Phase 7 completion, explain remaining options and a reasonable order of next steps.

For the same already approved work, general permission is not requested again. Private entry of a required password is not new approval for general work.

## Independent work

Review of code/specification/settings, official documentation, preparation and implementation within the MVP, appropriate tests, local documents/Git, code-only push, and the already approved closed deployment. Backup/isolated trial restore may be prepared without user input; an actual read-only connection requires a private DB password when unavailable.

Preparation is not application. Local PASS does not replace hosted PASS. We do not reset the populated local database or change approved business documents. Fictional test accounts do not represent approval of new rights for real people.

## Specific confirmation or user input

- The first hosted Super Admin was **individually approved and applied**: exact SecureDesk Demo Owner, Client/Pending → Super Admin/Active, and first request Approved. This is not confirmed again.
- New/broader security-sensitive assignment, new Auth destinations, public opening of the application/repository, or weakening protections require specific confirmation. Existing correct Site URL and redirect are already approved.
- Irreversible deletion of real data/accounts/copies; cost, domain/paid service, and legally binding terms.
- Sending messages or publishing portfolio/social content. A draft is not permission to send.
- Confidential data to a new destination: confirmation must define data, destination, and purpose.
- The owner personally enters and stores new authentication secrets in the browser; DB password is entered only in a hidden local prompt.

Browser tool rules require confirmation for new/broader sensitive access and capture of new password/secret input. AGENTS.md requires understanding key decisions, not universal confirmation of every change. Scope and specific prior confirmations are respected without repetition.

Passwords, secret keys, and session tokens are not requested in conversation and are not written to Git/documentation. Sandbox limitation is not the same as user or automatic rejection; only the actual event is described.

## Recording work

For each significant step: intent/reason, approved scope, actual change versus preparation, test and its boundary, relevant error/fix, remaining check, and next step. DEPLOYMENT_PHASE7.md explains procedure; GATE7_VERIFICATION.md keeps criteria and evidence. Private helpers/results/screenshots stay in .tools/. Screenshots with private email are not public portfolio material.

## Current state

27 hosted migrations. Local code commit 7b1d505; GitHub code-only beec078, 4 commits / 226 files / zero Markdown in every commit. Vercel Production 5MyBiZ6C6XM4Nq81nufLoWYq5DAV is Ready (30 s). All three addresses actually return Vercel authentication without login. First hosted Auth/API attempt has 167 PASS / 1 FAIL on stale change; all seven fictional accounts are banned and their business access/sessions shut down. Owner and Approved request unchanged. Cause, new PT409 migration, and prepared resume: [HOSTED_CONFLICT_FIX_REVIEW.md](HOSTED_CONFLICT_FIX_REVIEW.md). Actual resume is 182 PASS / 0 FAIL; PT409/HTTP 409 and immediate revocation confirmed, so all test access was shut down again. Actual owner registration/email/login and exact first Super Admin assignment are PASS. Pending pages and anonymous API access checked in limited scope.

Maintenance after the owner re-saved the Storage secret and redeploy actually returned 200. The test had zero attachments/files; it does not represent deletion of old files or daily scheduled execution. Auto-close and first nightly audit-retention have actual successful scheduled calls with empty test inventory. Nightly Vercel maintenance call was not confirmed because morning review exceeds Hobby one-hour log retention.

Empty pre-migration backup was restored successfully in isolation. One-owner checkpoint from 9 October with 26 migrations was also saved successfully and restored in isolation after owner private DB password entry: 25 tables/digests, owner/Approved request, ledger, and RLS verified. Storage was empty in that historical checkpoint; after first TXT upload populated-byte recovery remains. Provider protections reviewed with no changes. All four code-history revisions passed recognized secret/contact and Markdown checks. Function preimage before migration 27 is not a full current copy/restore; pre-resume populated DB checkpoint is now separately restored; post-test DB and Storage-byte recovery remain.

## Remaining major pieces

1. Full hosted matrix of other roles: first partial attempt and access revocation documented; fix applied. Actual resume finished with 182 PASS / 0 FAIL. This piece is complete in the reviewed Auth/Data API scope.
2. Fuller hosted role/tenant/session/logout/HTTP flows.
3. HTTPS attachments: 10 MiB, formats, download, revocation, and replay.
4. Scheduled retention/maintenance calls and test with controlled candidate.
5. Later backup/restore with test business data and Storage bytes.
6. Final review of risk, abuse controls, leakage, screenshots, and documentation.

Domain, own SMTP, public demo/repo, and Markdown on GitHub deferred by owner decision. Gate 7 is not complete and production readiness is not confirmed.

## Follow-up result 11:25 UTC

The actual resume ran on 10 October at 11:25:06–11:25:52 UTC: **182 PASS / 0 FAIL**, full reviewed Auth/Data API matrix complete. Stale write got PT409 / HTTP 409 for 66 ms, without additional ticket or audit change. Same Staff JWT immediately lost access after revocation; after regrant old rights revision stayed stale. All seven fictional identities banned, with zero active business rights/sessions/refresh tokens. Owner profile/Approved request preserved; exactly one Super Admin. No saved credentials or reset.

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match pre-resume checkpoint, exact ledger 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mount, scheduler off; temporary container removed, archive unchanged. This is copy before repeated test, not after. No Storage objects/bytes; populated-byte recovery still remains.

Next are actual HTTPS session/form and attachment checks. Six local fictional files were prepared: small TXT, exact 10 MiB TXT, one byte over limit, CSV, fake PNG with textual content, and unsupported HTML. Preparation manifest records sizes/hashes/expectations from before send time; later user screenshot confirms small TXT upload. Chrome control connection did not respond even after documented recovery attempt. Owner was asked to open published /account and log in personally; browser results are not marked PASS.

## First shared HTTPS upload — 10 October

User screenshot from 10 October (display 11:47 UTC) confirms message Your private file was uploaded., securedesk-small.txt, 82 B, and author SecureDesk Demo Owner. PASS is limited to display of successful small TXT send. Production ticket was intended destination, but URL is not visible on crop; agent Chrome control unavailable. Original 82 bytes/SHA-256 verified against preparation manifest, which remains unchanged historical record. Download and comparison of actual downloaded bytes not yet verified. 10 MiB limit, negative formats, role/replay/revocation, cookies/HTTP/logout, and Storage byte recovery remain open. Current database/Storage inventory not re-read; earlier zero-file state applies only to dated checkpoints. Private evidence: .tools/verification/phase7/hosted-https-small-upload-user-proof.json/png.

## Downloaded small TXT — 10 October, 12:32 UTC

Owner reported downloaded file C:/Users/rcf11/Downloads/securedesk-small.txt. File read from exact reported path and compared to prepared original: **PASS — both have 82 bytes, fully identical content and SHA-256 d5834e33cae9ac6d0e4e6d6f3870bca6a92d0f01642392442871e1f813e1debf**. Evidence: .tools/verification/phase7/hosted-https-small-download-byte-comparison.json. This confirms integrity of that user-downloaded file after previously documented upload. HTTP headers/cookies and browser request itself were not reviewed by agent. Exact 10 MiB, rejection of oversized/fake/unsupported file, other formats, role/replay/revocation, and Storage-byte recovery remain open; Gate 7 is not complete. Preparation manifest and earlier upload evidence remain unchanged.

## Agreed folder for test downloads — 10 October

Owner confirmed C:/Users/rcf11/Downloads as folder for all files downloaded in this SecureDesk test. Do not ask for path again for each file; read only specific names of prepared test files, not unrelated private files. Ask for another path only if expected file is not found or owner changes destination.

## Actual database copy and eight Storage files — 10 October, 14:12 UTC

Actual user-run result verified: **PASS — fresh database and all eight known private attachments saved and trial-restored in isolation.** Read-only inventory confirms eight ready attachment rows and exactly eight related ticket-attachments objects; seven test identities banned, zero active rights/sessions/refresh tokens. Owner profile and first Approved request unchanged.

New database.dump archive has **879.560 bytes / 1.151 catalogue entries**, SHA-256 4442eaff1bb772cfd18b91d280fc58a02cd32ea9c509c96a73e849f083082f5e. Eight separately saved file-byte files total **10.488.380 bytes**, including exact 10 MiB TXT. Archive and manifest saved in E:/portfolio/secure-desk/.tools/verification/phase7/hosted-populated-2026-10-10T14-12-45-659Z/. Not sent to GitHub.

Actual isolated restore compared **29 tables / 79 rows, 27 migrations, 110 function definitions with owner/ACL/security metadata, 18 policies, 22 public and one private RLS table, three private buckets, and all file links**. All eight files read from actual Storage, saved privately, restored to isolated filesystem, and read back with identical sizes/SHA-256.

Independent follow-up local review confirmed existing dump archive/manifest, all eight saved bytes against originals and recovery evidence, and unchanged hashes of reviewed helpers. Docker review confirms no remaining container labeled for this test. Runtime evidence confirms network=none, no ports/bind mount, scheduler off, unchanged hosted snapshot, and removed exact temporary container. Live databases were not restored/reset; credentials not saved.

Private evidence: hosted-populated-backup-storage-restore-2026-10-10T14-12-22-809Z.json and hosted-populated-recovery-result-review.json. This completes verification of this database/file-byte copy. Full operational recovery of managed Supabase Auth/API/Storage services or login with restored Auth hashes is not claimed. Full hosted file-role/parent/replay/revocation, HTTPS cookie/header, and maintenance/schedule checks remain open; **Gate 7 is not complete**. No application code, deployment, approved specification, or actual rights assignment change.

## Actual hosted file-access result — 10 October, 15:47–15:48 UTC

**244 PASS / 0 FAIL** in actual securedesk-dev Auth/Data API/Storage attempt. Seven fictional accounts logged in with real Auth passwords; all eight existing file metadata rows/list/detail RPCs were available to Client A, assigned Staff owner, and Admin A. Pending, peer Client, Client B, and unassigned Staff had zero rows/denied metadata. Anonymous access and changed company/ticket/file IDs rejected.

Direct private Storage GET of known CSV rejected for anonymous and all seven user sessions; user signed download URL, substituted completion/cleanup, and direct attachment update/delete failed. These are actual API results; positive file bytes have separate owner download/backup evidence.

Client membership, Staff assignment, and Admin assignment revoked separately. Same original JWT immediately lost attachment SELECT/list/detail access, including repeated request for known attachment. Final revocation: all seven accounts banned; zero active profiles/memberships/assignments/sessions/refresh tokens; old JWT read and refresh rejected. One existing owner Super Admin and Approved request unchanged.

All original attachments, storage.objects/buckets, tickets, projects, organizations, and registration_requests rows preserved before/after test; functions/policies unchanged. Earlier membership history retained; new test episodes completed. No new Storage upload/delete, company/project/ticket, or assignment to a real person.

Independent review verified all 244 individual statuses, seven expected role rows, same-JWT revocation and final retirement evidence, exact eight-file set, hashes of reviewed helpers, and new private pre-test dump archive: **881.362 bytes, SHA-256 ae5f3f8e6684cc3b7db3afd4e610ee06445ca54bdf90cca08d1a652fa27b5d3b**. That new archive was not separately restored; earlier database + eight-file isolated restore remains dated PASS. Credentials not saved. Private records: hosted-file-access-2026-10-10T15-48-27-614Z.json, hosted-file-access-checkpoint.json, and hosted-file-access-result-review.json.

Reviewed hosted metadata/parent/direct-Storage-denial/current-revocation piece is complete. Vercel application HTTPS cookies/header/browser flow, content server-bypass, upload-capability replay, proposal access, and controlled maintenance/schedule outcomes remain separate. Earlier reported download after logout has unconfirmed cause; later manual direct denials and this API result do not erase its history. **Gate 7 remains open.** Application code/deployment unchanged; Markdown stays local.

## Controlled maintenance test preparation — 10 October, 16:13 UTC

Separate private check-hosted-maintenance-candidate.ps1/.mjs and plan prepared. **38/38 guard tests and 10/10 actual local Storage API checks PASS**, Node/PowerShell syntax and rejection of missing private input before network PASS. Local new UUID/82-byte object created, metadata/bytes verified and removed through API; original local Storage/attachment/Auth/profile/bucket digests preserved. First read-only attempt with empty SQL result saved as historical FAIL and fixed before upload.

Hosted Prepare was NOT run and no new hosted candidate exists. Reviewed flow creates one new private 82-byte orphan through Storage API and waits actual 24 hours + 90 seconds from server creation time. Does not change Storage metadata by SQL. Check before deadline returns WAIT; after deadline requires sole eligible owned candidate and guides owner to existing Vercel Cron manual Run. After user-reported 200 verifies actual absence and preservation of original eight files/owner/retired rights. If object already absent, OBSERVED_ABSENT does not prove executor. Scheduled caller and wire/log evidence remain separate.

Code-only export review: 4 reachable commits / 243 blobs, zero Markdown/private paths/recognized credential patterns/owner-email matches; clean beec078, no remote fetch or new push. Browser tool did not return state in time; no UI change or hosted browser check claim. Application, deployment, schedule, protection, and approved v1.0 specification unchanged. Gate 7 remains open. Private proof: hosted-maintenance-candidate-preparation.json, timestamp local API result, and code-export-privacy-review-20261010-file-access.json. [Flow, private input, real deadline, and limits](HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md).

## Actual maintenance candidate created — 10 October, 17:22 UTC

**PREPARED confirmed** from actual user-run result. One new private attachment-quarantine object of 82 bytes created through Storage API. Source bytes/SHA-256, intended metadata, and actual server creation time verified in helper; record confirms eight ready original attachments, owner, and retired test access preserved. No file deleted, SQL Storage metadata, application, protection, schedule, or deployment changed.

Server creation time: 2026-10-10T17:22:54.825664+00:00. Earliest Check time with actual 24 hours + 90 seconds: **2026-10-11T17:24:24.825Z**, i.e. **11 October 2026, 19:24:24.825 Europe/Budapest**. For simple owner instruction: **11 October after 19:25 local**. Before that time no cleanup attempt for this test.

Independent local review verified proof/checkpoint agreement, exact object ID/bucket/path/82-byte hash, 28 protected table digests, computed deadline, and unchanged hashes of five previously reviewed helper/test source files. That review does not represent new hosted SQL/API read. Original preparation proof remains historical record before creation.

Private evidence: hosted-maintenance-candidate-2026-10-10T17-22-51-989Z.json; hosted-maintenance-candidate-checkpoint.json (WAITING_24_HOURS); hosted-maintenance-candidate-prepared-review.json. All stays in .tools/ and original local Git; no credentials or Markdown push.

After 11 October, 19:25: check-hosted-maintenance-candidate.ps1 -Mode Check, with two hidden private inputs. Do not repeat Prepare. Possible WAIT/READY/OBSERVED_ABSENT outcomes and manual Run flow described in [HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md](HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md). **Actual removal/manual outcome/scheduled caller not yet PASS; Gate 7 remains open.** No reminder or automatic future run created.


## Anonymous HTTPS/header check: prepared resume — 10 October

**28 guard tests and 264 actual local HTTP checks across 13 paths PASS**; 14 local tables and hosted maintenance checkpoint hash unchanged. Two earlier STOPPED traces from helper assumption about streaming redirect retained; helper now recognizes documented strict /login meta directive without claiming observed browser navigation. Application code unchanged.

Three actual anonymous hosted GET /login requests confirm HTTP 302/Vercel outer gate. Owner sees SecureDesk Welcome back in Chrome; automated connection did not return state, no UI change. Reviewed same-origin GET-only Snippet ready for owner run. **Actual application HTTPS/header test not yet executed**, cookie attributes and authenticated/native form flows not measured; Gate 7 remains open.

Maintenance candidate remains WAITING_24_HOURS, Check from 11 October after 19:25 Europe/Budapest. Strict protected-digest guard not weakened; authenticated/business write probes remain separate until checkpoint resolves. [Purpose, privacy, evidence, and Chrome steps](HOSTED_HTTPS_READONLY_REVIEW.md). Private evidence: hosted-readonly-https-preparation-review.json and hosted-readonly-https-browser-handoff.json. Documents stay local; no Markdown push, new deployment, rights, or approved specification change.


## Actual anonymous HTTPS/header check — 11 October

**275 PASS / 0 FAIL across 13 paths**, owner-executed Chrome Snippet at 00:18:22 Europe/Budapest. Seven protected responses give streaming /login directive; original and fresh CSV requests are HTTP 404 with generic denial. HSTS/private-no-store on all 13, production CSP/fresh script nonce on 11 HTML responses, and client-nonce spoof denial pass. JSON independently reviewed against all target/check sets and totals; raw HTTP/cookie/header values not collected.

Full cookie/native form/session/role/proposal/upload replay matrix is separate. Local JS helper replaced with safe result text saved as evidence and restored byte-identical to original; initial source-guard stop and earlier syntax FAIL not erased. No app/deployment change, business or Storage write calls from helper, or new rights; new hosted SQL inventory not executed. Private evidence: hosted-anonymous-https-result-review.json. [Scope, results, and history](HOSTED_HTTPS_READONLY_REVIEW.md); [preparation for next session probe](HOSTED_SESSION_COOKIE_REVIEW.md). Maintenance Check remains from 11 October after 19:25; Gate 7 remains open and Markdown stays local.


## What we continue before 24-hour check — 11 October

Owner requested exact list of what can be done before existing maintenance check and what waits. [PHASE7_REMAINING_WORK.md](PHASE7_REMAINING_WORK.md) created: source/local isolated preparation, evidence, and privacy can proceed now; hosted Auth/business/Storage changes wait for strict checkpoint resolution. Deadline passing alone or manual cleanup does not complete phase 7 or confirm daily caller.

Limited local review completed: inventory 379 Phase 7 files; 168 JSON evidence + 49 top-level local MD reports / 3.381.432 bytes scanned for six recognizable credential patterns, zero matches. All existing Phase 7 paths ignored; no tracked .tools/private env, original local repo has no remote. Code-only beec078 export clean, zero current Markdown files; earlier full-history scan not repeated. Eight key evidence review files inventoried/hashed, maintenance checkpoint hash unchanged.

Archives, SQL snapshot content, raw logs, and images not body/pixel reviewed. Zero pattern findings is not guarantee all evidence lacks sensitive data; screenshot redaction and complete final privacy review remain open. No network call, hosted SQL read, new session, Storage/business change, publication, or new deployment. Private evidence: populated-evidence-text-boundary-review-2026-10-10T22-33-19-713Z.json. Markdown stays local.

## Completed independent preparation — 11 October

Owner approved completing everything useful before existing maintenance check. Existing hosted archive restored only into new network-isolated temporary container, with cron execution off. Existing auto-close/audit-retention tests have 42 + 58 = **100 PASS**, with synthetic rows within rollback transactions. After each probe 29 copied table digests/functions/policies and owner/file metadata preserved; archive/checkpoint hash unchanged; container independently confirmed absent. First SQLSTATE 42883 FAIL preserved, wrapper search_path fixed, app/migration/test sources unchanged. Actual hosted business outcomes not proven by this.

All 47 original top-level UI screenshots visually reviewed: three have owner contact, three personal browser labels; provider/account/credential screens stay private. Hidden text not recovered, originals not changed, no public package. 37 future scenarios / 6 groups are EXPECTED ONLY, with 18 source/spec hashes and 8/8 original fixture files. Fresh registry audit at 07:01 UTC: production 0 known findings, full 5 High development entries from one open braces advisory; package/lock and existing app/deployment unchanged.

[Review and private evidence](PHASE7_PRE_MAINTENANCE_REVIEW.md), [exact expectations](HOSTED_RUNTIME_SCENARIOS.md), [guide](DEMO_OWNER_GUIDE.md), and [plan after phase](AFTER_PHASE7_PLAN.md) saved. Hosted Auth/Storage/business probes wait for maintenance Check from 11 October after 19:25 Europe/Budapest. No new hosted inventory/session, active database reset, guard weakening, public release, or Markdown push. **Phase 7 remains open.**


## Fresh read-only Chrome maintenance review — 11 October, 18:53 UTC

[Actual UI and byte review](PHASE7_MAINTENANCE_UI_REVIEW.md) confirms 28 protected table digests, full snapshot/retirement shape, owner and eight original file/object metadata sets, 27 migrations, 110 whole functions, and 18 policies. Sole eligible object is intentional 82-byte candidate; actual native Storage download has identical bytes/hash. Existing checkpoint and five helper hashes remain unchanged. Read-only SQLSTATE 42725/42601 attempts and repair history preserved; final v5 passes. Original CLI Check and local EXPLAIN not executed.

Database cron execution succeeded today confirmed read-only for audit-retention 03:15 and auto-close 18:53 UTC; controlled hosted business outcomes and Vercel daily caller remain separate. Existing Vercel Run prepared but waits exact action-time confirmation for removal of sole test file only. No deletion/completion PASS, new Auth/business session/write, app/deployment/schedule/protection change, or reset. **Phase 7 remains open; documentation and evidence stay local/private, without Markdown push.**


## Bounded anonymous UI test — 11 October

[Login and access request](PHASE7_ANONYMOUS_UI_REVIEW.md) now have actual Chrome layout/label/keyboard evidence: desktop and 320/390/768 CSS widths, no horizontal overflow, associated labels, sensible Tab order, and keyboard disclosure. No form/email sent, no account/session created, temporary viewport restored. Full authenticated U02, server validation, and session/file/role/business scenarios remain open. Maintenance Run and postcheck still wait exact confirmation. No app/deployment/guard/checkpoint change, public package, or Markdown push.


## Approved manual Run and actual postcheck — 11 October, 19:15–19:16 UTC

[Actual maintenance UI review](PHASE7_MAINTENANCE_UI_REVIEW.md) now records owner action-time confirmation, repeated full guard/fresh 82-byte comparison, one Vercel Run, and independently read GET 200 at 19:15:02.541 UTC. SQL at 19:16:00.929741 UTC confirms candidate absent, zero eligible objects, and all preserved protected 28 digests/owner/retired-7/original-8/catalogue invariants. Fresh Storage UI empty. Direct authenticated NoSuchKey GET and new byte comparison of original eight remain pending, with prepared read-only one-key helper without Docker. Strict checkpoint unchanged until full composite review; original CLI Check not executed.

Daily caller not confirmed by manual call. Vercel Hobby UI longer Timeline requires Pro; existing 03:30 UTC daily window outside current available scope. No upgrade/schedule/protection/app/deployment change or automatic reminder. **Phase 7 remains open.** Documents/evidence stay local/private without Markdown push.


## Completed manual maintenance check — 11 October, 20:29 UTC

[Final review](PHASE7_MAINTENANCE_UI_REVIEW.md) assembles actual Vercel GET 200 at 19:15:02.541 UTC, fresh pre-Run full SQL/82-byte evidence, post-Run SQL/UI absence, authenticated Storage NoSuchKey with positive CSV auth control and all eight identical original files (10.488.380 bytes), then new read-only SQL at **20:29:57.063204 UTC**. All 28 protected table digests, 27 migrations, 110 whole functions/ACL, 18 policies, three private buckets, owner Active/Approved, and seven retired identities without rights/sessions remain preserved. Zero other eligible objects.

Private composite review is PASS; original WAITING checkpoint archived byte-for-byte as hosted-maintenance-candidate-checkpoint-before-terminal-2026-10-11.json (same SHA-256 75d9bd64cf2da2149055385e0c68aaeda51004e2196e200dca4ab6803c5942ae). Current checkpoint has existing terminal manual status REMOVAL_VERIFIED_AFTER_MANUAL_REPORT and explicit independent UI/SQL/API provenance. All original candidate/digest fields and helpers preserved. **Original CLI Check not executed, Run not repeated, daily caller not confirmed.** Maintenance ban on new Auth/business probes is now resolved; each next probe still requires its own fresh controlled precheck and final preservation/retirement.

Earlier CommandNotFound from path and first invalid_private_input before Storage request remain separate FAIL records; later actual PASS does not overwrite them. No application, deployment, schedule, protection, cost, or public publication change. **Phase 7 remains open** for session/application file-role/proposal/business/UI/final matrix. Documents and evidence stay local/private, without Markdown push.


## Owner session continuation — 12 October 2026

[Actual scoped owner-session review](PHASE7_OWNER_SESSION_REVIEW.md) records personal Active login, two auth-cookie attribute rows without values, matching fresh CSV/small-TXT bytes, and desktop labels/keyboard navigation. Read-only SQL at 09:44:49.583941 UTC preserves all 24 non-Auth digests, full catalogue and owner/original-eight/retired-seven invariants. Owner session/refresh counts are measured separately from immutable business data.

Controlled Chrome 10 MiB download and wrong-parent navigation are client-blocked, not HTTP-denial/header PASS. Three synthetic localhost controls, including one without sandbox, are also blocked; allow-downloads is not established as a fix and was not applied. The user saw Ticket not available in a new tab while /account remained Active; the agent fresh ticket/list succeeded. User navigation through the company list remains under review. The attempted 320 viewport remained actual 1521 and is not responsive PASS. New logout/controlled refresh/full file-role/proposal/business/UI/final acceptance remain pending. No application/deployment/security/schedule/approved-spec change or Markdown push occurred.


### New 10 MiB and logout evidence — 12 October, 09:52–09:56 UTC

Owner through company list in new uncontrolled tab downloads exact 10.485.760 bytes, same SHA-256 as original. App/CSP unchanged; controlled-tab block remains history and does not prove app defect. Actual Sign out busy/redirect and new /account navigation end on /login. SQL at 09:56:40.380963 UTC confirms owner/non-owner sessions and refresh=0 with preserved non-Auth/catalogue/owner/original-8/retired-7 invariants. **S03 confirmed; S04 fresh original/unique-query file denial awaits owner result.** Vercel Enabled schedule observed, but current 30-minute log does not cover daily window: no daily PASS/failure conclusion or repeated Run. [Exact new evidence](PHASE7_OWNER_SESSION_REVIEW.md). Phase 7 remains open for rest of matrix.


### Both fresh file denial responses confirmed — 12 October

After logout owner manually enters known CSV unique-query URL, then original URL in uncontrolled Chrome tab, without new login. Both show Attachment not available.; screenshot and sanitized user observation saved privately. **S04 user-native UI denial confirmed**, with S03 fresh account denial and post-logout SQL sessions/refresh=0. Wire HTTP headers/status not captured; full role/parent/refresh/proposal/business/UI/final matrix remains open. [New owner-session review](PHASE7_OWNER_SESSION_REVIEW.md).
