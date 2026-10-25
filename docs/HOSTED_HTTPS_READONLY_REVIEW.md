# SecureDesk — anonymous HTTPS verification: actual result and history

Current — October 11, 2026: **actual user-executed production HTTPS test passed 275/275 across 13 paths**. Cookie attributes and authenticated/native-form/role matrix remain separate. Gate 7 did not pass. Dated preparation and syntax-failure records below are history; the new actual result is at the end of the document.

Preparation record from October 10, 2026: approved scope is existing closed demo, appropriate checks and local documentation; approved v1.0 was not changed. At that time actual application HTTPS test had not yet been executed. Newer result from October 11 is stated above and in the final record.

## Purpose and flow

Logged-out user may see login/register, but a new visit to account, admin page or ticket must return them to login. Direct private CSV link must return generic denial, without file. Responses should have protective HTTP/CSP headers and private/no-store.

Private helper: E:/portfolio/secure-desk/.tools/securedesk-https-readonly-browser.js. Works only on https://secure-desk-eta.vercel.app. Thirteen targets: initial account gate; login and repeated login; register; three admin pages; organizations; dashboard; known ticket; original and unique new CSV request; injected request nonce/CSP.

Sends only same-origin GET requests, with timeout and body limit. Uses normal browser session implicitly, without reading/copying cookie, storage, password or key values. Does not send forms, write RPCs or files and does not change privileges. Initial account response must confirm logged-out state; otherwise stops after first path. Foreign-origin/Vercel obstacle is STOPPED or INCOMPLETE, not application PASS.

Checks nosniff, frame denial, referrer/permissions/COOP/CORP, private/no-store, absence of framework headers, production CSP, fresh script nonce, aligned script tags, rejection of client-chosen nonce and exact API target. HSTS/upgrade-insecure-requests checked only in hosted HTTPS mode. Attachment must be HTTP 404, exact generic denial, sandbox/default-src none, without download disposition.

Raw HTML, header collections, nonce values, Set-Cookie, tokens and provider errors are not printed or saved. Safe JSON has paths, statuses and boolean results. Explicitly states cookieAttributesMeasured, renderedBrowserNavigationObserved, nativeFormPostsTested, authenticatedRoleFlowsTested and gate7Complete = false. GET-only describes helper requests; does not exclude normal server logging or internal session maintenance.

## Actual local result and helper correction

**28/28 guard/parser/privacy/failure tests and Node syntax PASS. Actual local production HTTP test: 264 PASS / 13 paths.** Fourteen Auth/business/Storage tables identical before/after; hosted maintenance checkpoint hash unchanged. Locally is HTTP; HSTS absence is not proof of hosted HTTPS HSTS.

Two earlier local attempts saved as STOPPED: helper expected only final HTTP redirect. Reviewed installed Next.js redirect guide and make-get-server-inserted-html source confirm streaming HTTP 200 with meta refresh directive. Helper now accepts only one directive delay 0/1, exact relative /login, same origin/requested path, NEXT_REDIRECT and absence of rendered identity. Does not execute directive and does not claim browser navigation was observed. Duplicated/foreign/query/longer delayed redirect rejected. Application code was not fixed; previous traces were not rewritten.

## Hosted outer gate and Chrome handoff

Actual test at 17:39:26 UTC: all three existing domains on anonymous GET /login return HTTP 302 to Vercel /sso-api. No cookies/credentials in requests. PASS is outer-gate only.

User confirms SecureDesk Welcome back in her Chrome on production /login. That is textual proof of availability through her existing Vercel access, not proof of Supabase session or headers. Cua inventory and direct getTab for exact Chrome URL did not return state in time. Documentation recovery succeeded; binding unavailable, UI not changed, protection not bypassed. Continuation requires user execution of reviewed Snippet. Passwords not needed.

## User steps

1. Stay on production /login, without new SecureDesk login.
2. Copy entire content of open local JS file.
3. Chrome DevTools → Sources → Snippets. Alternatively: within DevTools Ctrl+Shift+P → Show Snippets.
4. New snippet → name securedesk-readonly → paste in editor → Ctrl+Enter.
5. Send only line SECUREDESK_READONLY_RESULT; not other Console/Network output.

[Official Chrome guide](https://developer.chrome.com/docs/devtools/javascript/snippets) describes Sources/Snippets, Command Menu and Ctrl+Enter. Browser warnings/protection are not excluded; if obstacle occurs, user reports description, without instruction to bypass.

## Maintenance and remaining scope

Candidate remains WAITING_24_HOURS. Earliest Check: 2026-10-11T17:24:24.825Z, practically **October 11 after 19:25 Europe/Budapest**. Prepare is not repeated; metadata is not aged with SQL and cleanup is not attempted earlier.

Existing Check strictly compares 28 protected table digests. New login/reactivation/privileges or business write may legitimately change snapshot and stop Check. Guard was not weakened. Current parallel step is anonymous GET/local preparation; future difference requires separate review, without overwriting checkpoint or false PASS.

Full hosted cookie/native form/session/role/proposal/content-bypass/upload-capability-replay matrix, maintenance removal/daily caller, controlled DB-job outcomes and final review remain open. Earlier reported CSV download after logout has unconfirmed cause; later denial and this preparation do not erase history. No app/deployment/privilege change, cost, public opening or spec change. Documents remain local; no Markdown push.

## Private proofs

In E:/portfolio/secure-desk/.tools/verification/phase7/:

- hosted-readonly-https-preparation-review.json — 28 guard checks and source/proof hashes.
- https-readonly-local-2026-10-10T17-42-05-152Z.json — 264 PASS, 13 paths, pre/post comparison.
- https-readonly-outer-2026-10-10T17-39-26-402Z.json — three actual outer-gate responses.
- hosted-readonly-https-browser-handoff.json — source/proof/checkpoint consistency, Welcome back and READY_FOR_USER_BROWSER_RUN.

On preparation day, October 10, actual hosted SECUREDESK_READONLY_RESULT did not yet exist. Later result is recorded separately; two initial local STOPPED traces remain saved.


## User Snippet attempt: syntax error — October 10

Submitted Chrome Console screenshot shows Uncaught SyntaxError: Unexpected token '%' on line 82, column 9. **USER_SNIPPET_SYNTAX_FAILED**: this parse did not reach application HTTP checks, so there is no hosted PASS nor conclusion that application protection failed. Original private JS has 78 lines, identical to previously reviewed SHA-256 and repeated Node --check passes. Content of copied Chrome Snippet not yet read; difference and its cause not confirmed.

Next small step is click on source link in red Console error and show only lines around 82. Other visible contentScript/EventEmitter/ObjectMultiplex messages are not attributed to application without additional proof. Private screenshot/JSON: hosted-readonly-https-snippet-syntax-user-proof.png/.json. Maintenance checkpoint hash unchanged; Gate 7 remains open. No change to application, source helper, privileges, protection or deployment; Markdown remains local.


## Additional percent-encoded block in Snippet identified — October 11

New user Sources code screenshot shows original console.log ending on 77 and })(); on 78. Below is additional sourceURL comment on 80, new async block on 81 and invalid function%20loginMetaDirective on 82, with subsequent percent-encoded lines. **ENCODED_EXTRA_BLOCK_IDENTIFIED**: additional percent-encoded JavaScript explains reported syntax error; manner of addition origin not determined. Reviewed original is hash-identical and parses without execution; isolated addition of same percent token reproduces same SyntaxError.

For user continuation a NEW Snippet with only one short name securedesk-check is proposed, then paste exact original 78-line code in editor (name and editor are separate). That avoids extra content in editor and possible multiline name/sourceURL. Exact mechanism generating addition not determined; initially considered tail deletion recorded in private proof, without browser execution. Correction in Chrome not yet applied/observed; no actual hosted HTTP result or application PASS. Earlier syntax FAIL remains historically saved. Private screenshot/JSON: hosted-readonly-https-encoded-tail-user-proof.png/.json. Original helper, maintenance checkpoint, application/privileges/deployment not changed; Gate 7 remains open and Markdown was not sent to GitHub.


## Submitted original correct; short Snippet name as next step — October 11

User Pasted text.txt is byte-for-byte identical to reviewed original: SHA-256 b4048c19bc5c09f9635a295302fac11bf78c8863a77fa4dea3043ef1d9147e4f, 78 code lines plus trailing newline, **zero %20 and syntax parse PASS without execution**. Expanded new Sources screenshot shows sourceURL starting with percent-encoded first code comment, then more invalid encoded lines. Parser reports first invalid location, not list of all.

Reviewed public upstream Chrome DevTools ScriptSnippetFileSystem.ts confirms adding uiSourceCode.url to sourceURL after expression and using snippet name in its path. Conclusion that entire multiline code ended up in name is **strong inference from screenshots and submitted text**, not complete review of user browser state/installed Chrome version. Next small step is Rename existing name to only securedesk-check, Enter, then Ctrl+Enter over original editor code. New snippet with short name remains fallback. [Official Rename/run procedure](https://developer.chrome.com/docs/devtools/javascript/snippets); [upstream source](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/panels/snippets/ScriptSnippetFileSystem.ts).

Private proof: hosted-readonly-https-canonical-paste-name-review.json and hosted-readonly-https-encoded-tail-expanded-user-proof.png. Browser correction and actual hosted result not confirmed; no app/source/deployment/privilege change. Gate 7 remains open; Markdown remains local.


## Actual anonymous application HTTPS test — October 11, 00:18 Europe/Budapest

**275 PASS / 0 FAIL, 13 GET paths** from user-executed reviewed Chrome Snippet. checkedAt is 2026-10-10T22:18:22.557Z, i.e. October 11 00:18:22.557 locally. Seven protected HTML responses return strict streaming /login directive; four public/login/register/spoof responses are expected. Original and fresh-query CSV requests return **HTTP 404 and Attachment not available.**, without download disposition, with sandbox CSP.

All 13 HSTS/private-no-store and 11 HTML production CSP/script-nonce checks pass; injected client nonce rejected. Same-origin, nosniff, framing/referrer/permissions/COOP/CORP and non-exposure of recognized privileged key patterns also pass. HTTP 307 for streamed response is not claimed: status is 200 with meta directive, and actual browser navigation was not observed in this test.

Independent local review of JSON confirmed suite/origin/HTTPS/GET-only, all 13 ordered targets and exact sets of check names, all 275 individual statuses, status/finalPath/meta data, sum and false scope flags. Proof is user-executed Snippet/safe JSON; not agent-collected raw HTTP/network trace. Body/header/nonce/cookie values not saved. Cookie attributes, authenticated/native form POST and role/proposal/upload replay flows remain pending.

Source guard stopped before recording because local browser JS was meanwhile replaced with identical user result text, with modification time after checkedAt. That content preserved separately; exact reviewed 78-line helper restored from earlier hash-identical user original. Source/proof set then passes. This is local helper restoration; no application/deployment/hosted change. Initial syntax FAIL remains history; current separate successful result confirms executed test, without claiming which exact Rename/New snippet UI flow succeeded.

Private proofs: hosted-anonymous-https-user-result-2026-10-10T22-18-22-557Z.json, hosted-anonymous-https-original-user-result.txt, hosted-anonymous-https-result-review.json and hosted-readonly-helper-result-paste-restore.json. Maintenance checkpoint file hash-unchanged; new hosted SQL inventory not executed. Deadline remains October 11 after 19:25 Europe/Budapest. Full Phase 7 and earlier unconfirmed logout download cause not declared resolved. Markdown was not sent to GitHub.
