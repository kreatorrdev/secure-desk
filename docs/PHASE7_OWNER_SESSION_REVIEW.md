# SecureDesk — real owner session and Phase 7 continuation

Updated 12 October 2026. **Personal login, cookie metadata, new 10 MiB download, logout/fresh account denial and both fresh CSV denial responses confirmed; full refresh/file-role flow not yet complete. Gate 7 remains open.** Application, deployment and approved documents were not changed.

## What was actually confirmed

| Check | Result and boundary |
| --- | --- |
| Personal login | User signed in with existing Demo Owner account; Active/Approved account observed. Agent did not enter or read password. Native POST/redirect traffic was not recorded. |
| Cookie attributes | Two auth chunk rows (.0 and .1): Secure=true, SameSite=Lax, Path=/, HttpOnly=false, Domain=secure-desk-eta.vercel.app without leading dot. Values were not copied or used. |
| Cookie expiry | User overwrote Expires: .0 2027-11-15T21:12:41.876Z; .1 2027-11-15T21:12:41.877Z. That matches source default 400 days. Wire Max-Age/Set-Cookie was not measured; cookie expiry is not unlimited-access deadline. |
| Read-only SQL 11 October | At 21:15:42.289410 UTC: owner has one Auth session and one active refresh row; non-owner session/refresh=0. All 24 non-Auth protected digests, original eight file/object metadata, 27 migrations, 110 complete functions/ACL, 18 policies, three private buckets and retired-7 shape match. |
| Fresh read-only SQL 12 October | At 09:44:49.583941 UTC same non-Auth/catalogue/owner/file/retirement invariants pass. Owner has one session, two historical refresh rows and one active; non-owner session/refresh=0. Auth change measured separately from unchanged business data. |
| Fresh owner CSV/TXT bytes | CSV 80 B and small TXT 82 B downloaded 11 October have same SHA-256 as originals. Headers were not measured. Tool timeout/long waits recorded; do not represent measured application time. |
| Desktop ticket and keyboard | Fresh ticket and company list show known test tickets/eight attachments. Desktop clientWidth=scrollWidth=1521; visible fields have labels. First Tab goes to Skip to content; Enter focuses main; next Tab goes to Company tickets. Next 20 Tab steps reach all eight attachments, file chooser and comment field/button. No form was submitted. |
| Database scheduler log | Read-only log shows succeeded audit-retention 12 October 03:15 UTC and auto-close 09:44 UTC. That does not prove controlled hosted business outcomes or Vercel daily caller. |

HttpOnly=false follows reviewed Supabase SSR pattern; not new cookie setting change. Host-only interpretation based on Chrome Domain display and absence of Domain override in source, without export of raw Set-Cookie.

## Open download diagnostics

Click on 10 MiB attachment in controlled Chrome tab gives ERR_BLOCKED_BY_CLIENT. User reported same block on ordinary click in existing tab. Wrong-parent CSV navigation is also client-blocked: that is not proof of real server 404 or parent isolation.

Isolated local probe uses only synthetic 10 MiB TXT, bound to 127.0.0.1 and does not use database, accounts, env or keys. Server for each of three cases logs 200 and same bytes, but controlled Chrome tab in all three shows ERR_BLOCKED_BY_CLIENT:

1. Existing CSP: sandbox; default-src 'none'.
2. Considered CSP: sandbox allow-downloads; default-src 'none'.
3. Independent control without sandbox directive: default-src 'none'.

**Adding allow-downloads is not proven as fix.** Block and independent controls leave browser-control interference as hypothesis. App-defect/fix PASS was not assigned and production CSP, MIME, attachment disposition, authentication or rights were not changed. Local server was stopped; browser protection/extensions were not disabled.

[MDN sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox) describes allow-downloads, but document alone does not determine cause of this concrete block. [Official OpenAI browser documentation](https://learn.chatgpt.com/docs/chrome-extension) was reviewed as part of diagnostics; specific cause was not confirmed thereby. We do not rely on unverified forum answer or internal browser-use sources.

User then in new uncontrolled tab reported Ticket not available; their new /account shows Active. At agent new original ticket navigation and company list succeed, with preserved SQL invariants. Display difference remains recorded; exact address/traffic of user failed ticket request was not confirmed. Later user click through fresher Company tickets list succeeded; result and file comparison recorded below. New tab was not taken into automatic control.

## What is not yet complete

New controlled logout, fresh account denial and both fresh file denial responses are now confirmed. Wire download headers, full allowed/denied role/parent matrices, refresh/replay revocation scenarios, proposal/content/upload-capability probe or final acceptance are not confirmed. Mobile attempt requested 320 stayed at actual 1521 CSS width; override was reverted and that is not mobile PASS. Busy/server-error/form-submit flow was not verified read-only keyboard. Earlier positive and negative evidence remain separate dated scopes.

Manual maintenance was previously fully resolved; Prepare/Check/Run are not repeated. Public access, domain/custom SMTP and public publishing remain deferred. Documents and evidence are local/private; no GitHub Markdown push.

## Private evidence

E:/portfolio/secure-desk/.tools/verification/phase7/owner-session-ui-2026-10-11/ keeps sanitized login/cookie attributes, three real download comparisons, SQL results 11/12 October, user Ticket not available capture, desktop labels/keyboard and viewport limitation. Cookie screenshot with Value column was not copied to evidence; agent did not recover or use displayed token prefixes.

E:/portfolio/secure-desk/.tools/verification/phase7/download-csp-2026-10-12/ keeps synthetic server, initial/control response logs, Chrome error captures and browser-regression-review.json. Those are local diagnostic controls, without production HTTP-header PASS.

[Remaining work](PHASE7_REMAINING_WORK.md), [37 expected scenarios](HOSTED_RUNTIME_SCENARIOS.md) and [Gate 7](GATE7_VERIFICATION.md) keep scoped statuses.


## Real continuation after diagnostics — 12 October

User through Company tickets list in new uncontrolled tab successfully opened test ticket and downloaded securedesk-exact-10mib.txt. New Downloads file has mtime **09:52:51.853 UTC**, exactly **10.485.760 bytes** and SHA-256 **eb6183addde05c2196ce25e6fa34a4baf20f9bf30d33892f452a9a1e88c9a472**, identical to original; verified at 09:53:43.210 UTC. There was no application or CSP change. Original block in controlled tab remains saved; success in new tab further limits conclusion about its cause. Original Ticket not available was not repeated through successful list; exact cause of that earlier response remains unknown.

Agent then through real /account Sign out observed Signing out… busy state and return to /login. New direct /account navigation again ended on Welcome back /login: **S03 fresh account denial confirmed**. Read-only SQL at **09:56:40.380963 UTC** confirms owner Auth sessions=0, refresh rows=0, non-owner sessions/refresh=0, retired-7 without access/sessions and all unchanged non-Auth/catalogue/owner/file invariants. Owner and Super Admin/Active/Approved right preserved; only test login was removed. Wire native POST/header export was not made.

S04 confirmed by later user original and unique-query CSV navigations in same uncontrolled tab, without new login: both responses are Attachment not available. Evidence separate from earlier download block; raw HTTP status/header was not recorded.

Read-only Vercel review confirms Enabled /api/maintenance/attachments schedule 30 3 * * * and Hobby notice about one hour. Current Last 30 minutes log at approximately 10:00 UTC has no request rows and does not cover 03:30–04:30 UTC daily window. That is not proof of daily failure or daily PASS. Run was not clicked and plan/schedule were not changed.

All 18 relevant source/spec hashes match previous manifest; terminal maintenance checkpoint SHA-256 remains 48883be58ab145d1a57142296b1988de13c9dac81d297a8730b75bb498917559. No app/test/spec change. Final documentation review has 317 verifiable local Markdown links across 63 documents, without missing target.


## Confirmed fresh file denial — 12 October

After real logout user, without re-login, in new uncontrolled tab manually entered known CSV address with logout-check=20261012-1, then removed only query and navigated again to original URL. Confirmed **Attachment not available. for both attempts** and attached screenshot of that generic message. **S04 user-native UI denial confirmed**, with separate S03 new /account denial and post-logout SQL sessions/refresh=0. Raw HTTP status/header was not recorded; that is not transport-header PASS or full role/parent matrix. Screenshot has no cookie/key values.

Current remaining work: controlled fictional refresh/replay/current-rights, full allowed/denied role/parent application HTTP matrix, wire headers, content/capability/proposal probe, hosted business fixtures, genuine Vercel daily caller, full authenticated responsive/busy/error UI and final acceptance. For new hosted fixture changes new private backup and user input of private data in hidden prompt required. Reviewed existing eight-file backup helper expects Docker Linux and existing local client container; currently off daemon/original local database were not started. Old empty-demo backup was not issued as appropriate populated demo probe.

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) was reviewed again: 12 October primary advisory still states no patched braces version for this finding. That is not new npm audit. Direct registry/latest via web tool unavailable; package/lock were not changed and proposed major eslint-config-next downgrade was not applied. Earlier dated full 5 High / production 0 review keeps its date and scope.
