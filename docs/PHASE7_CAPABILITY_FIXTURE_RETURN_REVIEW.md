# Stop during capability file preparation and fixed continuation

17 October 2026. New file-only flow successfully transferred and accepted first browser result: **11 PASS / 0 FAIL**, four GET requests, zero browser POST/Storage requests. Copying entire file and embedded step worked. Stop occurred then in preparation of benign pending fixture; original terminal FAIL remains.

## Confirmed cause

Existing reserve_proposal_attachment contract returns only two columns: id and storage_path. Saved actual pendingFixture contains exactly those two fields. Helper passed them directly to uploadPendingFixture function, whose guard condition requires organization/proposal/actor/membership, uploading state, name/MIME/size and revision. Due to missing fields assert stops before fetch call.

Exact saved pair locally was again passed to unchanged transport with synthetic key and fetch counter: guard rejects it with **zero provider calls**. That is helper procedure error. Previous model tested transport with manually assembled full fixture row; isolated SQL separately verified reservation, so mutual contract was not covered.

## Actual outcome and preservation

Before activation new real full141/ten-files private copy was made, restored and compared in isolation. One Client was activated and only first GET-only browser result was accepted. One uploading reservation resulted, but provider upload was not reached; no revoke, regrant or additional ready file. Mandatory cleanup aborted exact reservation and removed only its possible temporary paths.

Final read-only SQL at 17:06:55.263165–17:06:59.809609 UTC confirms **143 rows/29 protected subsets/ten files and Storage objects**, unchanged proposal revision 6 and earlier Admin decisions. Only two new permanent rows are completed first membership and marked setup audit. Ten real Storage reads confirm all **10.488.550 identical bytes**. Seven trial users banned; active rights/profiles/memberships/sessions/refresh zero. No uploading or quarantine leftovers. Three exact owned containers independently confirmed absent.

The user then confirmed Sign out, manually reopened /account, saw Welcome back and confirmed she was signed out. Private receipt tied to exact source, without new browser trial. Review did not repeat hosted request, login or backup and did not ask for credentials.

Private source is capability-file-current-2026-10-17T17-03-50-091Z.json, backup hosted-capability-file-backup-storage-restore-2026-10-17T17-03-50-307Z.json. Review is capability-fixture-return-stop-review-2026-10-17.json, and new reference reviewed-current-capability-fixture-return-retired-reference-2026-10-17.json. Reference is not new full 143 copy.

## Fix and verified preparation

New separate helper first retains original reservation pair for cleanup, then in read-only transaction reads exactly that new attachment, limited by ID, path, organization/proposal/actor, new name and uploading state. Verifies scope, first trial membership, revision, access revision, MIME/85 bytes, null SHA/assignment and remaining expiry. Only complete verified row goes to unchanged uploadPendingFixture transport. Transport guard conditions were not removed or relaxed; no Bearer fallback or upsert. Reservation deadline remains15 minutes.

**27 local tests** pass, including reproduction of original pair/full-row mismatch, metadata read, wrong scope/expiry/ID values and preserving reservation ID on read error. **62 synthetic checks** with real transfer handler pass across four generated files in fresh VM contexts. Those are not new hosted browser/provider results.

**27 isolated SQL checks** and three partial-retirement cases pass to expected150 rows/29 protected subsets. Check now passes actual result of reserve SQL through same metadata resolver and unchanged transport with synthetic provider fetch. That directly covers previously missed boundary. Archive has 141 real rows; business delta reconstructs143 with only copied historical Auth digest assumptions adjusted. New full143/Auth copy is not declared executed by simulation.

Two new exact containers — restore and owned client — independently confirmed absent. Final manifest binds160 hashes and confirms previous 128 unchanged. PowerShell syntax and real prepare-only/readiness/client modes pass without credentials or hosted requests. Handoff is capability-row-handoff-2026-10-17.json.

## New user continuation

New launcher is .tools/continue-capability-after-fixture-review.ps1. Existing real readiness6/0 and same whole-file copy mechanism used within original deadline, so no new readiness trial. First that receipt is verified, then new full143/ten-files private copy must pass before activation. **New full 143 copy and new hosted business flow not yet executed.**

One Client login, last Client trial password, two hidden existing inputs and four separate files remain same operation. Terminal at appropriate time fills securedesk-capability-check1-v5.js through check4-v5.js. Each time copy entire exact new file into large Chrome Snippet editor via Ctrl+A/paste, then Ctrl+Enter; entire RESULT goes to same PowerShell via Ctrl+V and Enter. No dialogs or COPY command. Same Client session through CHECK1–3, sign-out and fresh /account/Welcome back on CHECK4.

Initial GET read confirms new session/scope after mandatory new activation. Earlier46,15 and current11 PASS remain historically preserved; completed first business upload/replay flow is not repeated. Full planned end is150 rows/eleven files/10.488.635 bytes with all trial rights/tokens retired. On FAIL procedure is not re-activated without review.

Application, deployment, specification, protection and schedule were not changed. .tools/ remains private/ignored; no push or new credentials during preparation. Remaining capability, Origin/session/native SSR, job/Vercel caller and practical UI/final review remain open. This package does not close entire Phase7.
