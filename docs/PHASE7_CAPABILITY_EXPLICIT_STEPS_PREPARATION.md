# Capability continuation with explicit steps

17 October 2026. New private continuation prepared with **one Client login and four runs of same v3 Snippet**. Previous 46 browser PASS and later 15 PASS remain preserved; existing upload/replay flow is not repeated. Actual state remains 139 rows, ten files and retired-seven. New full 139 copy and new hosted continuation not yet executed. Gate 7 remains open.

## What changes

[Previous review](PHASE7_CAPABILITY_DELIVERY_REVIEW.md#v2-actual-stop-after-first-successful-phase) confirms CHECK1 passed, membership actually revoked, and next browser result started again from initial. Mechanism of lost browser step was not recorded. New Snippet therefore does not choose phase from previously saved window memory.

Terminal for each CHECK creates strictly limited non-secret control message: version/probe ID, step name, public nonce, deadline and required fixture ID/revision values. User types **COPY** in terminal, then Enter; only then controller writes message to clipboard and backup `.tools/current-capability-step.txt`. Clipboard is not read. Same new Snippet on each run asks for message in dialog via Ctrl+V, then OK. Passwords or keys are not entered into it.

COPY may be repeated after copying email or screenshot: returns same current step and nonce, without network request or business trial. Deadline remains same. Thus user can finish login or sign-out first, then prepare message. Unknown fields, wrong probe ID, expired deadline or private input stop Snippet before any request, without printing entered content. Node accepts result only for currently requested control nonce and separately verifies result nonce, exact checks, status/count and deadline.

Window has only short-lived running flag for concurrent run; no phase history, cookie values, Auth storage or saved capability values. New browser memory between steps does not return flow to initial. Same Client session remains mandatory until CHECK4 for real same-session revocation check; new login mid-flow is not substitute for that evidence.

## Next procedure

Private wrapper is `.tools/continue-explicit-upload-capability.ps1`; user file `.tools/securedesk-upload-capability-v3.js` starts with `// SecureDesk upload capability v3`. Old wrappers and Snippets remain history and are not run again. Before activation new wrapper requires exact current139 reference, new full DB/ten-files private copy, isolated restore and real byte comparison. Only existing DATABASE password and backend key in hidden prompts required; last trial Client password stays same and entered only in application.

| Step | Action and boundary |
| --- | --- |
| CHECK1 | One Client login, fresh account/current proposal and two existing proposal files. Browser sends only four GET requests; no new browser reservation, capability or upload. |
| Between 1 and 2 | Controller as marked fixture preparation once reserves new pending file in exact Client scope and writes85 harmless bytes to exact new quarantine ID. Then completes first membership. Earlier pending file was already deleted during previous cleanup and is not restored. |
| CHECK2 | Same Client session after real revoke: read, completion and prepare denial. Step and reservation come from current message, without relying on browser history. |
| CHECK3 | Controller grants new membership. Old reservation cannot publish file; new benign85-byte file passes, and second reservation with old parent revision is rejected. Completion retry and real byte hashes checked in same session. |
| CHECK4 | Controller shuts down trial access and tokens and cleans only new incomplete objects. User clicks Sign out, manually opens /account and confirms Welcome back; then COPY and same Snippet confirm signed-out denial. Final SQL and all eleven real file hashes follow. |

Controller fixture upload uses only backend apikey, `x-upsert:false`, text/plain and exact new quarantine ID from verified SQL reservation. Ten existing ID/path values forbidden for that write. Does not create signed capability for this preparation. Failure is not repeated: only bounded status/category and fixture ID recorded, without provider body, key or raw error; retirement/cleanup follows. Browser capability flow for new D/E reservations remains real later step still awaiting execution.

Business reservation remains 15 minutes per server clock and starts only after CHECK1, so does not run during login preparation. CHECK2/3 have remaining server budget with margin; COPY, wrong copied line and allowed read-only fixes do not extend it. After business POST/Storage failure no automatic retry. Final cleanup includes controller-created pending ID even when browser did not report it or DB row already gone.

Expected full end of new continuation is **146 rows, eleven files and10.488.635 bytes**. Ten current files, earlier capabilityA, Admin decisions/project, Staff recommendation, owner and history remain. One additional ready file85B, its Storage object and upload audit remain; two new memberships complete and two marked setup audits remain. All trial accounts, rights, sessions and refresh must be shut down again. That is planned outcome, not actual PASS.

## Preparation verification

**20 local regression tests** passed, **62 synthetic checks in four reports with real transfer handler** and **25 isolated SQL checks**, including three partial-retirement cases. Generated same v3 Snippet tested with new window context on each run and properly bound fetch/prompt functions. Verified control/result nonce, expired/private/cancelled input, quoted-console lines, COPY repeat with same deadline, no-overwrite fixture upload, pending cleanup without browser report, provider errors, retained files and concurrency running flag. One earlier new test stopped due to incomplete Date mock in test harness; fixed and final 20 pass. That local harness FAIL is not new hosted trial.

SQL trial returns real full 137 archive and reconstructs exact139 business deltas, with historically copied Auth and only copied Auth digests adjusted for model. This is not new full139/current Auth copy. SQL explicitly verifies new pending-fixture helper and rejects second call while reservation exists. Local client/certificate, PowerShell syntax and final offline preparation pass. Two owned containers from last successful trials independently absent. Exact95 source/evidence hashes bind new package and earlier evidence.

Private evidence is `.tools/verification/phase7/capability-step-handoff-2026-10-17.json`, with new unit/model/isolated proof and source pins. Clipboard transport tested with mock, and browser execution with Node VM; real new Chrome/Storage/clipboard PASS not claimed. All raw helpers/archives remain ignored and private. Application/deployment/spec/schedule/protection were not changed; no push. Proposal-transfer continuation does not close other ticket, Origin/session, job/daily-caller, UI and final Gate7 items.
