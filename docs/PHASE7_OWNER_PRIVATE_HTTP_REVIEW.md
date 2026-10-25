# SecureDesk — real owner private HTTP review

12 October 2026. **107 PASS / 0 FAIL, 13 user-executed HTTPS GET requests.** Native logout, 275 post-logout HTTP checks, and live SQL at 14:43 UTC were subsequently confirmed. This is owner/Super Admin subscope; full Phase 7 remains open.

## What was actually confirmed

In a new user Chrome tab, without agent control of that tab, personal login shows Active/Approved. Helper before attachments runs fresh /account GET, verifies exact owner identity by comparison with local expected hash, Active/Approved and admin navigation. Email and HTML stay in memory only, not in result.

Eight existing attachments — JPG, WebP, DOCX, CSV, PDF, PNG, exact 10 MiB TXT and small TXT — give application HTTP 200, no redirect. Total is 10.488.380 bytes; for each expected size and original SHA-256 confirmed. Measured Content-Type application/octet-stream, attachment with original UTF-8 filename, private/no-store/max-age=0, nosniff, CSP sandbox/default-src none and Referrer-Policy no-referrer.

Known CSV with wrong company, peer ticket, unknown ticket and unknown attachment UUID give four HTTP 404 responses. Each has private/no-store/max-age=0, nosniff and only Attachment not available. None exposes original bytes.

Real result starts at 14:25:00.408 UTC and has revision owner-get-r2. User sent sanitized JSON; all expected target/label sets, 107 PASS/0 FAIL, 13 requests, eight files, four denials and total byte count were independently reviewed. This is not agent wire-response interception, but review of result from user-executed verifiable helper. Cookie/Authorization/Set-Cookie values, response bodies, email, provider errors and keys are not in result.

## Helper, privacy and previous attempts

Canonical private file is securedesk-owner-get-v2.js. Sends only GET to exact HTTPS origin, uses browser existing same-origin session without reading cookie values, does not follow redirect, adds unique query for positive/parent test and limits time/size of read. Does not send email, write business or Storage data, change rights. Usual application Auth refresh during GET is not disabled nor marked as business write.

Twelve actually executed local mock/boundary tests pass: wrong origin/path/UUID before network, login/other identity/Pending stop, oversize cancellation, invalid bytes, file leak on wrong parent, raw error/body/cookie privacy, React comment separator and execution of exact v2 copy without global function. Local mock PASS is separate from real 107 hosted checks.

First real attempt at 14:18:04.890 UTC: STOPPED, four PASS/one FAIL, one /account GET and zero file reads. Fresh owner identity confirmed; old combined account check rejected. Parser did not allow space after #, which appears when removing React comment separator; local regression reproduces that. Real response body was not saved, so first attempt cause is inference.

Second attempt at 14:21:33.337 UTC: STOPPED, seven PASS/one FAIL, one account GET. New separate Active, Approved and review-navigation checks pass, but result still contains old combined FAIL. Updated canonical file does not have that old check; difference mechanism was not determined. New separate v2 file in IIFE prepared. Both original JSON/screenshot STOPPED evidence and pre-repair source copies preserved.

Private result/review and source/plan fingerprints remain in .tools/verification/phase7/. Owner screenshot with email stays private and is not public evidence package.

## Boundary and continuation

**F04 confirmed; F01/F03 confirmed only for owner and stated eight/four paths.** Other Client/Staff/scoped Admin application byte flows, proposal parent, server content bypass, upload-capability/replay/current-rights boundaries, native-form transport and practical UI/business job outcomes were not verified thereby. [Remaining tasks](PHASE7_REMAINING_WORK.md) keep their status.

After this cycle user first reported Welcome back, then again Active and fresh /account Active. Latest logout is **unresolved**, no new logout/file-denial PASS. Active is saved profile status; logout is assessed by new server-verified visit. Earlier dated owner logout/denial evidence was not overwritten.

[Auth refresh review](PHASE7_SESSION_REFRESH_REVIEW.md) confirms retirement of fictional access before this personal owner login. Zero sessions in that report refers to time that probe ended; it does not claim personal owner session now absent. No app/deployment/CSP/protection change, public publishing or Markdown push.

## Latest logout cycle and independent live SQL — 12 October

Logout is now actually observed in separate agent Chrome tab: native Sign out → Signing out disabled → Welcome back. Then new /account navigation ends on /login. User in own uncontrolled tab confirms same login screen and runs unchanged earlier reviewed GET helper: **275 PASS / 0 FAIL across 13 paths** at 14:37:40.025 UTC. Original and unique-query CSV give HTTP 404, generic denial and protective headers; seven protected HTML responses have strict streaming /login directive, without identity. Streaming HTTP 200 is not renamed to 307 and is not claim about browser navigation; real native navigation is observed separately. Native POST wire payload/status were not collected.

Independent Supabase SQL at **14:43:32.596795 UTC**, BEGIN READ ONLY/ROLLBACK, confirms: **25 all non-Auth table digests**, full previously reviewed catalogue/inventory payload, owner hash/Active/Approved, original eight file/object sets, exactly newly completed test membership and marked audit. Seven fictional accounts banned, zero their rights; **zero for all owner/other sessions and refresh rows**. Number 24 in Auth refresh preservation check refers to unchanged tables after excluding five intentionally changed tables; number 25 here is full non-Auth set with new reviewed profile/member/audit state.

Earlier inconsistent user Welcome back/Active messages remain saved; cause of first user Active was not determined. New native/anonymous/live-SQL cycle has separate PASS and does not rewrite old attempts. Private composite: owner-private-http-final-composite-review-2026-10-12.json; new reviewed runtime baseline: reviewed-current-retired-baseline-2026-10-12.json. Maintenance checkpoint, old backups and helpers remain preserved.

Separate new backup helper for new state has six guard tests, JS/PowerShell syntax PASS, offline PREPARED, missing-input stop before Docker/hosted requests and READY. Compares full current snapshot, including Auth digests and new synthetic history; rejects stale copy, active session and any other change. User hidden prompt is next required step; **this new copy is not yet executed**. Not new fixture/data writing. [Private backup procedure](PHASE7_STANDALONE_BACKUP_PREPARATION.md).

S05 Auth/Data API, owner F04/F01/F03 and latest S03/S04 subscope confirmed. Other role/proposal/server-content/upload replay/native-form/practical UI/hosted business-job matrix and final acceptance remain open. Public Gate 7 remains deferred by user decision; no application/deployment/protection/spec change nor Markdown push.

## New copy of new state actually complete — 12 October, 14:57 UTC

User-executed new procedure has **PASS of all six steps**. Independent review confirms full live snapshot per reviewed 14:43 checkpoint, **29 tables / 85 rows**, 110 functions/ACL, 18 policies and 1.151 archive entries. New database.dump archive has **936.269 bytes**, SHA-256 826da583a045ad5b81c86c2e2e4f060e62ddd5a2b19298c289e941234c3fc5a1. Manifest and all eight private copies/recovered files have same original bytes/hashes; total 10.488.380 bytes.

All new synthetic history from Auth probe is included. Owner and originals preserved, all seven test accounts retired, sessions/refresh=0. Client/restore containers independently confirmed removed; network=none and scheduler off on recovery. Original local or hosted database was not restore/reset meta. Entered credentials were not saved; archive stays private due to Auth hashes and business data. This is not full managed Auth/API/Storage service recovery.

Private source: hosted-current-reviewed-backup-storage-restore-2026-10-12T14-57-39-181Z.json; independent review: current-reviewed-backup-result-review-2026-10-12.json. Earlier PREPARED/expected-input-FAIL/harness records remain history. Old helpers/copies and maintenance checkpoint were not overwritten.

User now asks agent to finish all remaining work possible without them and report only when personal login, private input or special approval remain. Next autonomous check is read-only hosted scheduler permission boundary and preparation of exact new business-job fixture scenarios with isolated probe. Phase 7 remains open for remaining matrix and final acceptance; no Markdown push.
