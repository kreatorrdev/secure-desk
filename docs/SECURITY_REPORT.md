# SecureDesk — Phase 6 security report

**25 October 2026 — closed-demo acceptance complete:** [Final acceptance](PHASE7_CLOSED_DEMO_ACCEPTANCE.md) and the [actual Vercel cron observation](PHASE7_VERCEL_DAILY_COMPLETION.md) record GET 200, `vercel-cron/1.0`,09:45:49.11 GMT+1 within the reviewed schedule hour. The original public roadmap/demo/repository/publication scope remains deferred. This updates closure status, not the date or breadth of earlier SQL/byte/recovery/dependency evidence. No new app login, API execution, SQL, hosted byte read or backup was performed by the agent for this final observation. Earlier open-J01 statements below are dated history.

**Phase7 status,24 October 2026:** [Final 205 read-only preservation](PHASE7_FINAL205_READONLY_COMPLETION.md) is reviewed at 09:33:21 UTC:205 rows,15 file metadata/objects, stable credentials, retired fictional rights and zero sessions/refresh. The [approved schedule-only production release](PHASE7_VERCEL_0900_COMPLETION.md) was verified Ready at 09:51:47 UTC, with existing protection/keys preserved and both temporary CLI sessions retired.813 evidence/source hashes are frozen. The actual Vercel scheduled caller remains open for25 October 08:00–08:59 UTC; [closed-demo acceptance](PHASE7_FINAL_ACCEPTANCE_DRAFT.md) is still a draft. This is not a new hosted byte read, full 205 backup, public release or fresh dependency-vulnerability assessment. Older dated observations below remain historical evidence with their stated limitations.

Date: 8 October 2026. Scope: local demonstration in E:\portfolio\secure-desk, Next.js 16.3.8 / React 19.2.8, Node 24.19.0, Supabase CLI 2.119.0, PostgreSQL 17.11. Authority: unchanged v1.0 approved specification. This is implementation verification, not an independent penetration test or a certification of production security. Final Gate evidence and counts are recorded in GATE6_VERIFICATION.md.

## Method and boundaries

The review combines source/grant inspection, rollback-only pgTAP tests, real Supabase signup/email/password sessions, authenticated API/RPC calls, native Next.js form POSTs, private upload/download HTTP routes, concurrent workers and actual cron ticks, browser keyboard/mobile checks, dependency audit and secret inspection. Positive tests prove intended behavior; negative cases replace organization/ticket/attachment IDs, privilege fields, native hidden inputs, revisions and sessions. Synthetic fixtures are local and ordinary decisions execute under their actual authenticated identities. Database owner access is limited to creating the temporary local test administrator, precise time/fault fixtures and scoped cleanup; it is not used to claim regular-user authorization success.

Systematic matrix: 22 public RLS tables, SELECT/INSERT/UPDATE/DELETE for 17 caller states including anonymous and service_role, plus role/tenant fixtures and protected column/schema checks. All 89 SECURITY DEFINER routines inspected have empty search_path, no PUBLIC EXECUTE and no anonymous EXECUTE. Direct INSERT/UPDATE/DELETE grants are absent for authenticated and service_role on public business tables; service_role remains privileged for private Storage bytes and is kept server-only. Sensitive organization-code/transfer records are RPC-only. Actual business RPC tests complement table-grant checks.

No cloud writes, deployment, dependency downgrade, database reset, business-rule changes, Git push or new permanent administrator were part of Phase 6. Existing applied migrations and the approved documents are protected by before/after hashes. A settings revision legitimately advances when the audit test changes and restores the 365-day retention policy; this is recorded separately from immutable prior business rows.

## Findings and changes

| Finding | Severity / status | Change and proof |
| --- | --- | --- |
| Missing centralized browser restrictions | Defense improvement; fixed | Fresh nonce CSP on HTML, same nonce on framework scripts, no production unsafe-inline/eval, no inline handlers, objects, framing or foreign form targets. Added nosniff, no-referrer, frame denial, permissions restrictions, COOP/CORP and HTTPS-only HSTS. Native headers and actual hydrated UI are checked. |
| Global Proxy CSP overwrote the stricter private-download CSP during integration | Security regression caught before Gate completion; fixed | Route-specific response policy preserves sandbox/default-src none for both proposal and ticket download routes. Added a boundary test and actual proposal/download header assertions, rebuilt and reran affected flows. |
| Auth relied on provider limits without an application account guard | Abuse-hardening gap; locally mitigated | Bounded normalized-subject HMAC counters for login/register/resend/confirmation, monotonic windows, capacity fail-closed, forwarding-header spoof resistance. The provider remains an independent boundary. Unit boundaries and actual native attempts are tested. The application guard is per-process, not distributed. |
| Duplicate authentication fields accepted their first value | Input ambiguity; fixed | Auth readText rejects duplicates; native duplicate identity cannot choose the first/last identity, and passwords are never reflected. |
| Default 404 relied on CSP-blocked inline styles and lacked a main landmark | Accessibility/compatibility issue; fixed | A dedicated not-found screen uses the existing styled AuthShell, keyboard skip and safe recovery links under the same strict policy. Actual browser/response verification follows the rebuild. |
| Auth screens had no keyboard skip link | Accessibility improvement; fixed | Skip to content and focusable main, with a visible focus outline; verified by Tab and Enter in the actual browser. |
| Old test assumptions used first form, absent dashboard, first 100 registrations and Windows command-line SQL | Verification defects; fixed | Tests select the sign-out form, require anonymous dashboard login, iterate review result pages and pass owner SQL through stdin. These changes make older checks exercise the current application without deleting earlier fixtures or weakening denials. |
| CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm in braces | Upstream High; OPEN, transparent residual | Full npm audit reports five High affected package entries from one advisory through the development lint/glob chain. Installed/latest braces 3.0.3 has no patched release in the official advisory/registry as of this review. No compatible fix is available; npm's proposed older ESLint configuration is an incompatible framework downgrade and was not applied. npm audit --omit=dev reports zero known vulnerabilities. |

The open High concerns denial of service when vulnerable development tooling parses attacker-controlled brace patterns. It is a development dependency, not a currently audited production runtime dependency. Run lint/test tooling only on controlled source in this local demo; before CI handles untrusted pull requests, recheck the upstream fix and isolate/limit those jobs. This reduces exposure but does not fix the library. Gate 6 permits transparently identified High findings; this residual prevents claiming a clean full dependency scan.

Primary advisory: [GitHub GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Framework version checked against the [Next.js September 2026 security release](https://nextjs.org/blog/september-2026-security-release): the project uses the listed patched 16.3.8. These are review-date observations, not permanent guarantees.

## Approved threat coverage

| Threats | Implemented control and exercised evidence |
| --- | --- |
| T-01, T-02, T-03: cross-company, peer Client and unassigned Staff access | Database tenant/parent invariants, RLS and fresh server reads; table matrix, actual organization/project/ticket roles, copied native Actions, unauthorized file routes and immediate revocation checks. |
| T-04, T-05, T-20: escalation, Admin overreach and definer bypass | Stored role/state, scoped assignments, explicit grants and validated transactional RPCs; forged metadata/body fields, direct writes, OA A/B and service-role grant inspection. |
| T-06, T-07: codes and transfers | Hashed, controlled codes, dedicated attempt guard, pending request without automatic access, atomic approved transfer; real native code/transfer tests and denial of old-parent/file access. |
| T-08, T-09: on-behalf identity and sharing | Active same-company candidate and true actor, controlled owner/Admin approval and explicit participants; raw/native ticket creation, before/after sharing and revocation. |
| T-10: file disguise, excessive body, parent access | Private bytes, actual content/MIME allowlist, bounded input, safe attachment response and repeated parent checks; file validators, real uploads/downloads, unauthorized/stale IDs and malformed bodies. This is not antivirus scanning. |
| T-11, T-12: edits and status manipulation | Server clock, 15-minute comment revision history, explicit state transitions and terminal Closed; current SQL and real API/native ticket tests. |
| T-13, T-14: reopen deadline and scheduler race | Resolved-only reasoned request, exact UTC deadline, pending exclusion, serialized/idempotent maintenance; boundary/race/rollback tests and real cron runs. |
| T-15, T-16: secret leakage and audit scope/tampering | Server-only credentials, redacted business/security events, denied raw writes, tenant-scoped Admin view and separate parent activity; source/bundle/log inspection, raw/native audit scopes and worker rollback tests. |
| T-17, T-18: Auth abuse, CSRF/session and XSS | Verified SSR identity, rotating refresh, origin checks, normalized attempt limits, text-only rendering and nonce CSP; real login/refresh/logout/replay/CSRF, repeated attempts and stored HTML probes. |
| T-19: inactive company | Current organization state checked for writes; readable history policy is implemented and documented by Phase 3; organization/project/ticket/upload denial matrices test inactive scopes. |

The threat baseline remains unchanged. Coverage means the documented cases passed, not that every possible input or configuration has been proven safe.

## Reproduction

See MIGRATION_RUNBOOK.md for exact local setup and Gate command. Use the local production build, not only the development server. check:gate6:local -- --create-demo runs ordinary role flows and the additional native security test. SQL tests roll back. Native security checks inspect actual response nonce/header behavior, submit a foreign Origin with no resulting account, repeat wrong login/resend/confirmation attempts, send duplicate identity fields, store HTML-looking title/comment as literal text, copy a comment action across forbidden actors, and revoke an already logged-in owner before replaying the saved form.

Check the retained fictional HTML probe as a scoped administrator: its title and description must display literal angle brackets, not an image/script, and the browser document must not gain the probe's xss data attribute. No credentials are persisted in the practice target. Raw evidence stays in ignored local verification folders. The public report includes methods and results without tokens, passwords, service keys or email confirmation links.

## Residual risks and explicit limitations

- The development-only High advisory remains unpatched. Five npm package entries represent one upstream issue, not five independent vulnerabilities. The zero production audit is not a guarantee against unknown vulnerabilities.
- Application auth limits reset on restart and are not shared across replicas. They do not replace Supabase's direct Auth endpoint limits. Hosted provider settings, real SMTP quotas, CAPTCHA and any shared/edge guard must be considered for the actual deployment. See [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).
- SSR cookies support the browser SDK and are JavaScript-readable; no HttpOnly claim is made. A stolen valid access token may remain usable on the direct API until its one-hour expiry after logout. Fresh business role/state/scope checks revoke changed permissions immediately. Hosted inactivity/time-box policies and risk-based session controls are not verified here. See [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) and [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
- Service-role compromise is a privileged-system compromise. Keeping it server-only and restricting routes reduces exposure; rotation, hosting secret controls and incident response still require deployment review.
- Content inspection does not detect all malware. Files are downloaded as attachments and never executed by the application. No third-party antivirus, DLP, content disarm or bulk abuse/storage quota service was added.
- Audit is controlled and redacted for implemented events. Not every arbitrary direct RLS denial automatically creates a custom application audit event. Auth/provider logs and broader monitoring/alerts need an operational design. Retention is 365 days by default and destructive only for records beyond the selected policy.
- Browser verification covers representative keyboard, labels, focus, themes, mobile/desktop, loading/empty/unavailable screens and a stored XSS probe. It is WCAG basics, not a complete WCAG conformance audit, screen-reader certification, all-browser suite or performance/load test. Actual native role tests are not described as manual browser sessions for every role.
- The populated local history was preserved; a destructive fresh-install reset was not performed in Phase 6. No backup restore or hosted migration replay was claimed.
- The local Docker/Windows machine, listening ports, TLS, Vercel/Supabase deployment settings and real tenant data handling were not independently security-audited. Local services are a development environment, not an Internet-facing production deployment.

## Related evidence

[GATE6_VERIFICATION.md](GATE6_VERIFICATION.md) records final results, counts and cleanup. [ARCHITECTURE.md](ARCHITECTURE.md) describes trust boundaries. [MIGRATION_RUNBOOK.md](MIGRATION_RUNBOOK.md) documents safe continuation. Earlier Gate reports remain unchanged historical evidence.

## Phase 7 update — 9 October 2026

Repeated production audit: 0 known findings. Full audit retains five High development entries from the same unpatched braces advisory. Quarantine transfer and guarded streaming pass affected local Auth/API/Storage checks; full SQL regression is 4204 PASS. Provider token replay can write temporary bytes for two hours, but cannot overwrite ready permanent bytes or bypass publication permissions. Cleanup is delayed/bounded. Hosted SMTP, provider/shared limits, HTTPS, cron and backup/restore remain unverified. [GATE7_VERIFICATION.md](GATE7_VERIFICATION.md) records current limits; historical Gate 6 totals remain local dated evidence.

## Phase 7 update — 10 October 2026: hosted retry conflict

The first real hosted Auth/API suite recorded 167 passing checks and one failed stale-write expectation. Seven fictional identities were banned and all their business access/sessions retired; the real owner was unchanged. Repeated provider 40001 logs matched a documented custom-serialization retry problem. Migration 27 changes 32 explicit business error sites in 22 reviewed functions to PT409, preserving function properties, RLS/grants and existing rows. Six application actions accept the new conflict code with existing refresh messaging.

The isolated change/replay proof, all 4,204 local SQL/RLS assertions, ESLint and production build/TypeScript passed. Exact hosted application and post-commit catalogue/table checks passed; beec078 is deployed Ready behind Vercel authentication. Initial FAIL evidence remains. The same-identity resume helper passed isolated SQL/guard checks, but the separate real hosted resume now passed 182 checks, including PT409/HTTP 409, same-JWT revocation, stale revoke/regrant and final retirement of all seven identities. This corrects a runtime interoperability issue, not a certification of production security. [Detailed local review](HOSTED_CONFLICT_FIX_REVIEW.md) and [current Gate 7 scope](GATE7_VERIFICATION.md) distinguish completed checks from remaining HTTPS file/session/maintenance/recovery work.

## Actual hosted resume result — 10 October, 11:25 UTC

The actual resume ran on 10 October at 11:25:06–11:25:52 UTC: **182 PASS / 0 FAIL**, full reviewed Auth/Data API matrix complete. Stale write got PT409 / HTTP 409 for 66 ms, without additional ticket or audit change. Same Staff JWT immediately lost access after revocation; after regrant old rights revision stayed stale. All seven fictional identities banned, with zero active business rights/sessions/refresh tokens. Owner profile/Approved request preserved; exactly one Super Admin. No saved credentials or reset.

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match the pre-resume checkpoint, exact ledger of 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mounts, scheduler off; temporary container removed, archive unchanged. This is the copy before the repeated test, not after it. No Storage objects/bytes; populated-byte recovery still remains.

These proofs cover the reviewed Auth/Data API matrix and pre-resume populated database recovery. Browser HTTPS forms/cookies/logout, actual attachment bytes and later populated Storage recovery are still open. Six harmless local attachment fixtures were prepared. The later user screenshot confirms the first small TXT upload; browser control did not respond, and download byte comparison and the rest of the hosted file matrix remain pending.

## First user-performed HTTPS upload — 10 October

User snapshot from October 10 (display 11:47 UTC) confirms the message Your private file was uploaded., securedesk-small.txt, 82 B and author SecureDesk Demo Owner. PASS is limited to display of successful upload of the small TXT. Production ticket was the intended destination, but URL is not visible on the screenshot; agent Chrome control is unavailable. Original 82 bytes/SHA-256 verified against the preparation manifest, which remains an unchanged historical record. Download and comparison of actual downloaded bytes are not yet verified. The 10 MiB limit, negative formats, role/replay/revocation, cookies/HTTP/logout and Storage byte recovery remain open. Current database/Storage inventory was not re-read; earlier zero-file state applies only to dated checkpoints. Private proof: `.tools/verification/phase7/hosted-https-small-upload-user-proof.json/png`.

## Preuzeti mali TXT — 10. oktobar, 12:32 UTC

The user reported downloaded file C:/Users/rcf11/Downloads/securedesk-small.txt. The file was read from the exact reported path and compared to the prepared original: **PASS — both have 82 bytes, fully identical content and SHA-256 d5834e33cae9ac6d0e4e6d6f3870bca6a92d0f01642392442871e1f813e1debf**. Proof: `.tools/verification/phase7/hosted-https-small-download-byte-comparison.json`. This confirms integrity of that user-downloaded file after the previously documented upload. HTTP headers/cookies and the browser request itself were not reviewed by the agent. Exact 10 MiB, rejection of oversized/fake/unsupported file, other formats, role/replay/revocation and Storage-byte recovery remain open; Gate 7 is not complete. Preparation manifest and earlier upload proof remain unchanged.

## Actual hosted file-access result — October 10, 15:47–15:48 UTC

**244 PASS / 0 FAIL** in actual securedesk-dev Auth/Data API/Storage attempt. Seven fictional accounts logged in with actual Auth passwords; all eight existing file metadata rows/list/detail RPCs were available to Client A, assigned Staff owner and Admin A. Pending, peer Client, Client B and unassigned Staff had zero rows/denied metadata. Anonymous access and changed company/ticket/file IDs were rejected.

Direct private Storage GET of known CSV rejected for anonymous and all seven user sessions; user signed download URL, injected completion/cleanup and direct attachment update/delete failed. These are actual API results; positive file bytes have separate owner download/backup proofs.

Client membership, Staff assignment and Admin assignment were separately revoked. Same original JWT immediately lost attachment SELECT/list/detail access, including repeated request for known attachment. Final revocation: all seven accounts banned; zero active profiles/memberships/assignments/sessions/refresh tokens; old JWT read and refresh rejected. One existing owner Super Admin and Approved request remained unchanged.

All original attachments, storage.objects/buckets, tickets, projects, organizations and registration_requests rows preserved before/after probe; functions/policies not changed. Earlier membership history retained, new test episodes ended. No new Storage upload/delete, company/project/ticket or assignment to real person.

Independent review verified all 244 individual statuses, seven expected role rows, same-JWT revocation and final retirement proofs, exact eight-file set, hashes of reviewed helpers and new private pre-test dump archive: **881.362 bytes, SHA-256 ae5f3f8e6684cc3b7db3afd4e610ee06445ca54bdf90cca08d1a652fa27b5d3b**. That new archive was not separately restored; earlier database + eight-file isolated restore remains dated PASS. Credentials not saved. Private proofs: hosted-file-access-2026-10-10T15-48-27-614Z.json, hosted-file-access-checkpoint.json and hosted-file-access-result-review.json.

Reviewed hosted metadata/parent/direct-Storage-denial/current-revocation whole is complete. Vercel application HTTPS cookies/header/browser flow, content server-bypass, upload-capability replay, proposal access and controlled maintenance/schedule outcomes remain separate. Previously reported download after logout has unconfirmed cause; later manual direct denials and this API result do not erase its history. **Gate 7 remains open.** Application code/deployment were not changed; Markdown remains local.

## Controlled maintenance test preparation — 10 October, 16:13 UTC

Separate private check-hosted-maintenance-candidate.ps1/.mjs and plan prepared. **38/38 guard tests and 10/10 actual local Storage API checks PASS**, Node/PowerShell syntax and rejection of missing private input before network PASS. Local new UUID/82-byte object created, metadata/bytes verified and removed through API; original local Storage/attachment/Auth/profile/bucket digests preserved. First read-only attempt with empty SQL result saved as historical FAIL and fixed before upload.

Hosted Prepare was NOT run and no new hosted candidate exists. Reviewed flow creates one new private 82-byte orphan through Storage API and waits actual 24 hours + 90 seconds from server creation time. Does not change Storage metadata by SQL. Check before deadline returns WAIT; after deadline requires sole eligible owned candidate and guides owner to existing Vercel Cron manual Run. After user-reported 200 verifies actual absence and preservation of original eight files/owner/retired rights. If object already absent, OBSERVED_ABSENT does not prove executor. Scheduled caller and wire/log evidence remain separate.

Code-only export review: 4 reachable commits / 243 blobs, zero Markdown/private paths/recognized credential patterns/owner-email matches; clean beec078, no remote fetch or new push. Browser tool did not return state in time; no UI change or hosted browser check claim. Application, deployment, schedule, protection, and approved v1.0 specification unchanged. Gate 7 remains open. Private proof: hosted-maintenance-candidate-preparation.json, timestamp local API result, and code-export-privacy-review-20261010-file-access.json. [Flow, private input, real deadline, and limits](HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md).

## Actual maintenance candidate created — October 10, 17:22 UTC

**PREPARED confirmed** from actual user-run result. One new private attachment-quarantine object of 82 bytes created through Storage API. Source bytes/SHA-256, dedicated metadata and actual server creation time verified in helper; record confirms eight ready original attachments, owner and retired test access preserved. No file deleted, SQL Storage metadata changed, application, protection, schedule or deployment changed.

Server creation time: 2026-10-10T17:22:54.825664+00:00. Earliest Check time with actual 24 hours + 90 seconds: **2026-10-11T17:24:24.825Z**, i.e. **October 11, 2026, 19:24:24.825 Europe/Budapest**. For simple user instruction: **October 11 after 19:25 local**. Before that time no cleanup attempt for this test.

Independent local review verified proof/checkpoint consistency, exact object ID/bucket/path/82-byte hash, 28 protected table digests, calculated deadline and unchanged hashes of five previously reviewed helper/test source files. That review does not represent new hosted SQL/API read. Original preparation proof remains historical record before creation.

Private proofs: hosted-maintenance-candidate-2026-10-10T17-22-51-989Z.json; hosted-maintenance-candidate-checkpoint.json (WAITING_24_HOURS); hosted-maintenance-candidate-prepared-review.json. Everything remains in `.tools/` and original local Git; no credentials or Markdown push.

After October 11, 19:25: check-hosted-maintenance-candidate.ps1 -Mode Check, with two hidden private inputs. Do not repeat Prepare. Possible WAIT/READY/OBSERVED_ABSENT outcomes and manual Run flow described in [HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md](HOSTED_MAINTENANCE_CANDIDATE_REVIEW.md). **Actual removal/manual outcome/scheduled caller not yet PASS; Gate 7 remains open.** No reminder or automatic future run created.

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

## Owner session continuation — 12 October 2026

[Actual scoped owner-session review](PHASE7_OWNER_SESSION_REVIEW.md) records personal Active login, two auth-cookie attribute rows without values, matching fresh CSV/small-TXT bytes, and desktop labels/keyboard navigation. Read-only SQL at 09:44:49.583941 UTC preserves all 24 non-Auth digests, full catalogue and owner/original-eight/retired-seven invariants. Owner session/refresh counts are measured separately from immutable business data.

Controlled Chrome 10 MiB download and wrong-parent navigation are client-blocked, not HTTP-denial/header PASS. Three synthetic localhost controls, including one without sandbox, are also blocked; allow-downloads is not established as a fix and was not applied. The user saw Ticket not available in a new tab while /account remained Active; the agent fresh ticket/list succeeded. User navigation through the company list remains under review. The attempted 320 viewport remained actual 1521 and is not responsive PASS. New logout/controlled refresh/full file-role/proposal/business/UI/final acceptance remain pending. No application/deployment/security/schedule/approved-spec change or Markdown push occurred.

### New 10 MiB and logout evidence — October 12, 09:52–09:56 UTC

User through company list in new uncontrolled tab downloads exactly 10.485.760 bytes, same SHA-256 as original. App/CSP were not changed; controlled-tab block remains history and does not prove app defect. Real Sign out busy/redirect and new /account navigation end at /login. SQL at 09:56:40.380963 UTC confirms owner/non-owner sessions and refresh=0 with preserved non-Auth/catalogue/owner/original-8/retired-7 invariants. **S03 confirmed; S04 fresh original/unique-query file denial awaits user result.** Vercel Enabled schedule was observed, but current 30-minute log does not cover daily window: no daily PASS/failure conclusion nor repeated Run. [Exact new evidence](PHASE7_OWNER_SESSION_REVIEW.md). Phase 7 remains open for rest of matrix.

### Both fresh file denial responses confirmed — October 12

After logout user manually enters known CSV unique-query URL, then original URL in uncontrolled Chrome tab, without new login. Both show Attachment not available.; screenshot and sanitized user observation saved privately. **S04 user-native UI denial confirmed**, with S03 fresh account denial and post-logout SQL sessions/refresh=0. Wire HTTP headers/status were not captured; full role/parent/refresh/proposal/business/UI/final matrix remains open. [New owner-session review](PHASE7_OWNER_SESSION_REVIEW.md).
