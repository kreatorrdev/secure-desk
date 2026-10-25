# SecureDesk — next HTTPS verification

October 10, 2026. **First six manual examples complete in documented scopes: TXT/CSV/10 MiB downloaded bytes PASS; expected rejections confirmed. Full hosted matrix remains open.** Approved specification was not changed.

Next are actual HTTPS verification of session/forms and attachments. Six local fictional files prepared: small TXT, exact 10 MiB TXT, one byte over limit, CSV, fake PNG with text content and unsupported HTML. Preparation manifest records sizes/hashes/expectations and historical state before upload. Subsequently confirmed by user screenshot upload of small TXT. Chrome control connection for management did not respond even after documented recovery attempt. User asked to open deployed /account and log in personally; browser results not marked PASS.

## Order and expectations

1. Confirm actual owner login on exact production HTTPS address and open only fictional existing ticket.
2. Upload small TXT; only confirmed ready attachment may appear. Download through application and compare bytes/hash.
3. Upload exact 10 MiB text file directly to private quarantine and download identical bytes through authorized stream.
4. Reject file one byte over limit, text with fake PNG extension and unsupported HTML; verify no ready attachments.
5. Complete format/role/parent/replay/revocation matrix through reviewed private test; do not expand privilege to real people and do not disable Vercel protection.
6. Verify session/logout/cookies/HTTP protections, maintenance candidate and recovery of actual test Storage bytes.

We do not change business rules here; existing max is 10 MiB / 10.485.760 bytes. All prepared files are in ignored E:/portfolio/secure-desk/.tools/verification/phase7/https-fixtures. No real clients, personal data, passwords or keys. Manifest records expectation, not result.

## Current prior proofs

Actual continuation executed October 10 at 11:25:06–11:25:52 UTC: **182 PASS / 0 FAIL**, full reviewed Auth/Data API matrix completed. Stale edit received PT409 / HTTP 409 for 66 ms, without additional ticket edit or audit. Same Staff JWT immediately lost access after revocation; after regrant old privilege revision remained stale. All seven test identities banned, with zero active business privileges/sessions/refresh tokens. Owner profile/Approved request preserved; exactly one Super Admin. No saved credentials or resets.

New private archive before reactivation (11:25:10 UTC, 873.627 bytes / 1.151 catalog entries) was trial-restored at 11:29:36 UTC. PASS: all 25 compared tables / 47 rows match pre-resume checkpoint, exact ledger 27 migrations, 22 public and 1 private RLS table, 18 policies, 3 private buckets and 22 corrected functions with preserved owner/ACL/security settings. Network=none, no ports/bind mounts, scheduler off; temporary container removed, archive unchanged. This is the copy before the repeated test, not after it. No Storage objects/bytes; populated-byte recovery still remains.

For owner account password user uses application, not conversation. New general work permission not requested. Chrome control did not respond at session/tabs call nor at one documented recovery; that is not proof Chrome closed or login absent. Password manager, clipboard with secrets, cookie or browser storage not read.

Gate 7 remains open; [GATE7_VERIFICATION.md](GATE7_VERIFICATION.md) contains acceptance boundaries.

## User-confirmed account and first joint upload

User as requested opened production /account and sent display of Active, Request #1 Approved and administrator menus. This is user screenshot proof of current display, not agent verification of cookies/HTTP headers; address not visible on screenshot itself. Repeated browser inventory did not respond, so nothing auto-uploaded.

First small step: open existing fictional Company A ticket https://secure-desk-eta.vercel.app/organizations/70eaef72-97c9-4899-a63b-e40503d70c18/tickets/3e80ac1a-1b97-4cf2-920a-2bcfd7d23e26, find Private attachments, in Choose attachment select E:/portfolio/secure-desk/.tools/verification/phase7/https-fixtures/securedesk-small.txt and press Upload private file. Expectation is message Your private file was uploaded. and ready display of name. Subsequent user screenshot confirms expected message, securedesk-small.txt / 82 B and author SecureDesk Demo Owner; proof scope stated below. Then verify downloaded bytes/hash, then exact limit and negative formats. Without Vercel bypass or reading secrets.

## Result of first upload — October 10, 11:47 UTC

User screenshot from October 10 (display 11:47 UTC) confirms message Your private file was uploaded., securedesk-small.txt, 82 B and author SecureDesk Demo Owner. PASS limited to display of successful upload of small TXT. Production ticket was intended destination, but URL not visible on screenshot; agent Chrome control unavailable. Original 82 bytes/SHA-256 verified against preparation manifest, which remains unchanged historical record. Download and comparison of actual downloaded bytes not yet verified. 10 MiB limit, negative formats, role/replay/revocation, cookies/HTTP/logout and Storage byte recovery remain open. Current database/Storage inventory not re-read; earlier zero-file state applies only to dated checkpoints. Private proof: `.tools/verification/phase7/hosted-https-small-upload-user-proof.json/png`.

Next step: click name securedesk-small.txt and save downloaded file. Only reported file read and compare all 82 bytes and SHA-256 to original. Preparation hash is not proof of downloaded content.

## Downloaded small TXT — October 10, 12:32 UTC

User reported downloaded file C:/Users/rcf11/Downloads/securedesk-small.txt. File read from exact reported path and compared to prepared original: **PASS — both have 82 bytes, fully identical content and SHA-256 d5834e33cae9ac6d0e4e6d6f3870bca6a92d0f01642392442871e1f813e1debf**. Proof: `.tools/verification/phase7/hosted-https-small-download-byte-comparison.json`. Confirms integrity of that user-downloaded file after previously documented upload. HTTP headers/cookies and browser request itself not reviewed by agent. Exact 10 MiB, rejection of oversized/fake/unsupported file, other formats, role/replay/revocation and Storage-byte recovery remain open; Gate 7 not complete. Preparation manifest and earlier upload proof unchanged.

Next joint step: on same fictional ticket select E:/portfolio/secure-desk/.tools/verification/phase7/https-fixtures/securedesk-exact-10mib.txt and upload through Upload private file. Locally confirmed exact 10.485.760 bytes and hash from manifest. Successful message and name display expected; actual upload of that large file not yet confirmed. After success repeat download and comparison of all bytes.

## File one byte over limit — user screenshot October 10

User on screenshot selected securedesk-over-10mib.txt and got Choose one supported file up to 10 MB with matching format and content. Prepared file re-verified: 10.485.761 bytes, exactly one byte over limit of 10.485.760. **PASS within scope of displayed rejection of oversized file.** Reviewed client component returns this message for file.size > 10*1024*1024 before prepare call; actual network request not observed. URL/attachment list not visible on screenshot, so absence of new ready row/Storage object not separately confirmed. This is not hosted proof of server protection when client check bypassed. Original manifest unchanged. Private proof: `.tools/verification/phase7/hosted-https-over-limit-user-proof.json/png`. Exact-limit upload not yet confirmed; next file is securedesk-exact-10mib.txt, 10.485.760 bytes, which should be accepted.

## Exact limit: upload and download — October 10, 12:38–12:39 UTC

User screenshot shows Your private file was uploaded. and securedesk-exact-10mib.txt / 10.0 MB, author SecureDesk Demo Owner and 12:38 UTC; small TXT also in displayed list. Prepared original has exactly 10.485.760 bytes. User then confirmed Downloads; only C:/Users/rcf11/Downloads/securedesk-exact-10mib.txt read. **PASS — all 10.485.760 downloaded bytes identical to original**, with SHA-256 eb6183addde05c2196ce25e6fa34a4baf20f9bf30d33892f452a9a1e88c9a472. Upload has user screenshot proof, download actual local byte comparison; URL and HTTP/cookies not observed by agent. Previous over-limit screenshot confirms expected rejection of file one byte over limit in client-form scope. Exact-limit success does not confirm server-bypass/format/role/replay/revocation tests or recovery. Private proofs: `.tools/verification/phase7/hosted-https-exact-limit-upload-user-proof.json/png`, hosted-https-exact-limit-download-byte-comparison.json and hosted-https-file-status.json. Preparation manifest and earlier proofs unchanged; Gate 7 remains open.

Next joint step is securedesk-mismatched.png from same preparation folder: benign text with PNG extension, expected rejection of actual format/content mismatch. Actual result not yet confirmed.

## Fake PNG: text with PNG extension — user response October 10

On instruction for securedesk-mismatched.png user reported message Choose one supported file up to 10 MB with matching format and content. **PASS within scope of user-reported rejection.** Prepared file and manifest compared again: 66 bytes, well below limit; PNG extension with plain text; benign file not real PNG image. Actual browser/network step and absence of ready row/Storage object not verified by agent, so full hosted server/role/replay proof not derived from this message. Private record: `.tools/verification/phase7/hosted-https-mismatched-user-result.json`; current summary is hosted-https-file-status.json. Gate 7 remains open.

## Unsupported HTML format — user response October 10

On instruction for securedesk-unsupported.html user reported message Choose one supported file up to 10 MB with matching format and content. **PASS within scope of user-reported rejection.** Prepared file and manifest compared again: 53 bytes, well below limit; benign HTML not on allowed allowlist. Actual browser/network step and absence of ready row/Storage object not verified by agent, so full hosted server/role/replay proof not derived from this message. Private record: `.tools/verification/phase7/hosted-https-unsupported-user-result.json`; current summary is hosted-https-file-status.json. Gate 7 remains open.

## CSV and completion of first six examples — October 10, 12:46 UTC

User provided production attachment link for securedesk-fictional.csv (ID 6cac8741-84e6-47d5-9c5e-298fb8137fa5), 80 B, SecureDesk Demo Owner, 12:46 UTC. After confirming download in Downloads only C:/Users/rcf11/Downloads/securedesk-fictional.csv read. **PASS — all 80 downloaded bytes identical to original**, SHA-256 6937ad872631fb6f0ac6a0e8079ec72c572487079bb2004090aecbbd4e75f291. Upload confirmed by user link/metadata; browser request and HTTP headers not observed by agent. Private proofs: `.tools/verification/phase7/hosted-https-csv-upload-user-proof.json` and hosted-https-csv-download-byte-comparison.json. First six prepared examples complete in stated scopes: small TXT, exact 10 MiB TXT and CSV have identical downloaded bytes; over-limit rejection has screenshot, fake PNG and HTML rejection have user confirmation. Not full hosted matrix: remaining allowed JPEG/PNG/WebP/PDF/DOCX, direct server-bypass, role/parent/replay/revocation, cookies/HTTP/logout, maintenance and DB+Storage-byte recovery remain. Manifest/earlier proofs unchanged; Gate 7 not complete.

## Preparation of remaining allowed formats — October 10

In ignored https-fixtures folder prepared securedesk-valid.png, securedesk-valid.jpg, securedesk-valid.webp, securedesk-valid.pdf and securedesk-valid.docx. Images are new synthetic 32×32 solid-color images, PDF and DOCX contain only sentence SecureDesk fictional format test. No real user data, external links or macros. All five files passed existing local attachment content validator; all three images decoded successfully. Sizes/hashes and local expectations in separate allowed-formats-manifest.json; original manifest of six examples unchanged. This is preparation, not hosted upload/download PASS, nor Word/PDF render certification. Next small step is actual securedesk-valid.png through same form, then compare downloaded bytes; other formats then individually. Role/replay/revocation and Gate 7 remain open.

## Valid PNG: accepted attachment — October 10, 12:53 UTC

User screenshot shows securedesk-valid.png / 137 B, SecureDesk Demo Owner, 12:53 UTC, in attachment list. **PASS within scope of screenshot-confirmed upload of valid PNG.** Prepared original and hash re-verified; 32×32 synthetic image previously decoded locally and passed content validator. Supplements previous rejection of text with PNG extension. Downloaded bytes not yet compared; URL/HTTP/cookies and Storage inventory not read by agent. Private proof: `.tools/verification/phase7/hosted-https-valid-png-upload-user-proof.json/png`. Next is download of that name through application and compare to original. Remaining JPEG/WebP/PDF/DOCX and other Gate 7 rules remain open.

## PNG: downloaded bytes — October 10

After user confirmation only C:/Users/rcf11/Downloads/securedesk-valid.png read. **PASS — 137 bytes fully identical to prepared original**, SHA-256 6ae1d326f7af7c324e948cdbc299dcc1f62bdb562fdf3cfc910388a17f69537a. Upload has separate user proof; this is actual local comparison of downloaded file, without agent verification of HTTP/cookies/Storage inventory. Private proof: `.tools/verification/phase7/hosted-https-valid-png-download-byte-comparison.json`. In this supplementary preparation PNG now complete. Remaining formats: JPEG, WebP, PDF, DOCX. Hosted server-bypass/role/parent/replay/revocation, session/HTTP/logout, maintenance and DB+Storage-byte recovery remain open; Gate 7 not complete.

## Accepted JPEG and PDF — October 10, 12:57 UTC

User screenshot confirms securedesk-valid.jpg / 275 B and securedesk-valid.pdf / 608 B, both SecureDesk Demo Owner, 12:57 UTC. **PASS for screenshot-confirmed owner list display of both accepted attachments.** Source bytes/hashes re-verified. Private proofs are hosted-https-valid-jpg-upload-user-proof.json, hosted-https-valid-pdf-upload-user-proof.json and joint hosted-https-jpeg-pdf-upload-user-proof.png in `.tools/verification/phase7`. On initial Downloads check PDF found and bytes match (separate record follows), but JPG not found even as other securedesk-valid name; user asked to complete its download. Not proof of application error. URL, browser HTTP/cookies and Storage inventory not verified by agent; Gate 7 remains open.

## Accepted WebP and DOCX — October 10, 12:59 UTC

User screenshot confirms securedesk-valid.webp / 80 B and securedesk-valid.docx / 1.3 KB, both SecureDesk Demo Owner, 12:59 UTC. **PASS for screenshot-confirmed owner list display of both accepted attachments.** Source bytes/hashes re-verified: 80 and 1,358 bytes; DOCX display in application rounded. Private proofs are hosted-https-valid-webp-upload-user-proof.json, hosted-https-valid-docx-upload-user-proof.json and joint hosted-https-webp-docx-upload-user-proof.png in `.tools/verification/phase7`. Subsequently checked Downloads files found and identical to originals; separate comparison records follow. URL, browser HTTP/cookies and Storage inventory not verified by agent; Gate 7 remains open.

## JPEG: downloaded bytes — October 10

After user confirmation only C:/Users/rcf11/Downloads/securedesk-valid.jpg read. **PASS — 275 bytes fully identical to prepared original**, SHA-256 acf9838fe4b1814f7967e0d7d2ee861739f28b6811bdcf2a94c893a088900588. Upload has separate user proof; this is actual local comparison of downloaded file, without agent verification of HTTP/cookies/Storage inventory. Private proof: `.tools/verification/phase7/hosted-https-valid-jpg-download-byte-comparison.json`. In this supplementary preparation PNG, JPEG now complete. Remaining formats: WebP, PDF, DOCX. Hosted server-bypass/role/parent/replay/revocation, session/HTTP/logout, maintenance and DB+Storage-byte recovery remain open; Gate 7 not complete.

## PDF: downloaded bytes — October 10

After user confirmation only C:/Users/rcf11/Downloads/securedesk-valid.pdf read. **PASS — 608 bytes fully identical to prepared original**, SHA-256 64f3038b3784874c16d95dc2dae47c7152fcc8a7d15cfdf014da8ec2830dc8c2. Upload has separate user proof; this is actual local comparison of downloaded file, without agent verification of HTTP/cookies/Storage inventory. Private proof: `.tools/verification/phase7/hosted-https-valid-pdf-download-byte-comparison.json`. In this supplementary preparation PNG, JPEG, PDF now complete. Remaining formats: WebP, DOCX. Hosted server-bypass/role/parent/replay/revocation, session/HTTP/logout, maintenance and DB+Storage-byte recovery remain open; Gate 7 not complete.

## WebP: downloaded bytes — October 10

After user confirmation only C:/Users/rcf11/Downloads/securedesk-valid.webp read. **PASS — 80 bytes fully identical to prepared original**, SHA-256 2d4cfb637bdee8d503da332bbb6a1ee4c842a5d06e833002f9c5c0bfd51d98cf. Upload has separate user proof; this is actual local comparison of downloaded file, without agent verification of HTTP/cookies/Storage inventory. Private proof: `.tools/verification/phase7/hosted-https-valid-webp-download-byte-comparison.json`. In this supplementary preparation PNG, JPEG, WebP, PDF now complete. Remaining format: DOCX. Hosted server-bypass/role/parent/replay/revocation, session/HTTP/logout, maintenance and DB+Storage-byte recovery remain open; Gate 7 not complete.

## DOCX: downloaded bytes — October 10

After user confirmation only C:/Users/rcf11/Downloads/securedesk-valid.docx read. **PASS — 1358 bytes fully identical to prepared original**, SHA-256 14d1c4455f6d87799833ec575a0fee7f37b7204f95cfb881bf5d7fe2cf1e6a4f. Upload has separate user proof; this is actual local comparison of downloaded file, without agent verification of HTTP/cookies/Storage inventory. Private proof: `.tools/verification/phase7/hosted-https-valid-docx-download-byte-comparison.json`. In this supplementary preparation PNG, JPEG, WebP, PDF, DOCX now complete. All supplementary prepared formats complete in manual owner/download-byte scope. Hosted server-bypass/role/parent/replay/revocation, session/HTTP/logout, maintenance and DB+Storage-byte recovery remain open; Gate 7 not complete.

## Final review of this format test — October 10

Mutual consistency of all eight download proofs with preparation manifests verified: **8/8 PASS for identical bytes**, all seven allowed MIME formats (TXT, CSV, PNG, JPEG, WebP, PDF, DOCX), including exact 10 MiB. Initially absent JPEG later found and compared successfully; earlier Pending record remains history. Three negative manual examples have expected user-confirmed rejection: one byte over limit, text with PNG extension and HTML. Proof: `.tools/verification/phase7/hosted-https-manual-format-review.json`. This completes manual owner/format/download-byte test, not entire hosted security matrix or Gate 7. Remain server-bypass and attachment access/revocation/replay, session/HTTP/logout, controlled maintenance, DB+Storage-byte recovery and final risk review. Application, database, actual privileges or approved specification not changed; proofs remain local.


## Reported download after logout — October 10, 2026.

**FAIL within scope of user-reported HTTPS test; investigation open.** User confirmed Sign out in same Chrome window, login display, then new CSV download. Specifically provided both addresses: account and ticket on same production origin secure-desk-eta.vercel.app. Four screenshots saved privately. In Downloads exist original and three new CSV copies, all 80 bytes and identical to prepared original; new copies have timestamps 13:14–13:16 UTC. Timestamps prove new files, but not exact moment of logout. Screenshots lack address bar or network trace; cause not yet confirmed. New direct visit to /account after logout requested to distinguish lingering session from download path issue.

Code review: logout uses native Server Action and local signOut; download is dynamic, checks getUser and scoped RPC twice, with private/no-store. This review is not proof of correct hosted behavior. Repeated existing local native HTTP verification passed 48/48, including logout, fresh account denial and rejection of old session. Two new fictional Client/Pending local accounts retained and finished logged out, without privilege assignment. First sandbox attempt stopped before registration due to local Docker access; approved local retry passed. Chrome binding expired; hosted network/session not observed by agent. No change to application, hosted database, privileges or approved specification. Private proof: `.tools/verification/phase7/hosted-https-logout-download-investigation.json`. Gate 7 remains open; logout denial not PASS.


### New account visit after logout

User then, without new login, manually opened production /account in same Chrome window and confirmed return to login. New screenshot contains visible production /login address. **PASS only for user-confirmed rejection of new protected account visit.** Does not resolve reported download: next request is direct CSV attachment URL in same Chrome tab with unique logout-check query parameter. Earlier FAIL remains recorded and open until download path verified. No change to code/hosted data or privileges; private proof: `.tools/verification/phase7/hosted-https-logout-fresh-account-user-proof.json/png`.


### Direct new CSV request after logout

User without new login in same Chrome tab manually entered exact CSV attachment URL with ?logout-check=20261010-1. Response and screenshot confirm Attachment not available.; screenshot shows production origin and part of path. **PASS within scope of this manual fresh-query download denial probe.** HTTP status, headers or cookie not read by agent; code not changed. This does not turn previously reported new download into PASS nor determine its cause. Last repeated request for exact same original link requested, removing only logout-check parameter. Proof: `.tools/verification/phase7/hosted-https-logout-fresh-query-user-proof.json/png`. Full session/header/download matrix and Gate 7 remain open.


### Original CSV link after logout: repeated check

User in same logged-out Chrome tab removed only logout-check parameter and directly repeated original CSV attachment URL. Reported Attachment not available. **PASS within scope of this user-confirmed manual original-URL denial probe.** Now new protected account visit, direct request with unique parameter and original download URL rejected after logout. For last step proof is textual confirmation, without new screenshot/network trace.

Earlier reported FAIL and three actual new CSV copies remain in proof history. Reported behavior not reproduced by these repeated direct requests; its cause not confirmed. No code fix applied and cache/Chrome error not proven nor earlier report declared wrong. Full HTTPS cookie/header/role/parent/replay/revocation attachment verification remains open, as Gate 7. Proof: `.tools/verification/phase7/hosted-https-logout-original-url-user-proof.json`; previous local Auth rerun is 48/48 PASS, without hosted change or new privileges. Everything remains in local documentation/private proofs, without Markdown on GitHub.
